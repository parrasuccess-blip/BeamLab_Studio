import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { modeInstruction, extractResponseText, systemPrompt } from '../api/tutor.js';

function mock(method, body) {
  let statusCode = 200;
  let payload;
  const res = {
    status(code) { statusCode = code; return this; },
    json(value) { payload = value; return this; }
  };
  return { req: { method, body }, res, result: () => ({ statusCode, payload }) };
}

test('quiz and hint remain Socratic and do not leak expected answers', () => {
  assert.match(modeInstruction('quiz'), /exactly one question/i);
  assert.match(modeInstruction('quiz'), /expected field/i);
  assert.match(modeInstruction('hint'), /Socratic hint/i);
  assert.match(modeInstruction('hint'), /repeated wrong response/i);
});

test('adaptive evidence is diagnostic rather than a misconception verdict', () => {
  assert.match(systemPrompt, /stable response pattern only/i);
  assert.match(systemPrompt, /not proof of a misconception/i);
  assert.match(systemPrompt, /expected fields.*diagnostic-only/i);
  assert.match(systemPrompt, /not.*structural numerical authority/i);
});

test('exam mode is blocked before any provider call', async () => {
  const m = mock('POST', { mode:'question', question:'help', level:'year1', context:{ examMode:true } });
  await handler(m.req, m.res);
  assert.equal(m.result().statusCode, 403);
});

test('missing provider key degrades without breaking BeamLab', async () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const m = mock('POST', { mode:'question', question:'why?', level:'year1', context:{ examMode:false } });
  await handler(m.req, m.res);
  assert.equal(m.result().statusCode, 503);
  assert.match(m.result().payload.error, /Deterministic BeamLab analysis remains available/i);
  if (previous) process.env.OPENAI_API_KEY = previous;
});

test('Responses API text extraction supports raw output arrays', () => {
  const text = extractResponseText({ output:[{type:'message', content:[{type:'output_text', text:'answer'}]}] });
  assert.equal(text, 'answer');
});

test('health reports configuration without exposing provider credentials', async () => {
  const previous=process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    const off=mock('GET');await handler(off.req,off.res);
    assert.deepEqual(off.result().payload,{message:'Success',release:'4.1.5',configured:false});
    process.env.OPENAI_API_KEY='test-only-not-a-secret';
    const on=mock('GET');await handler(on.req,on.res);
    assert.equal(on.result().payload.configured,true);
    assert.ok(!JSON.stringify(on.result().payload).includes('test-only'));
  } finally {if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;}
});

test('invalid and oversized tutor requests are rejected before provider access', async () => {
  for(const [body,status] of [
    [{mode:'invent',question:'why',level:'year1',context:{}},400],
    [{mode:'point',question:'why',level:'unknown',context:{}},400],
    [{mode:'point',question:' ',level:'year1',context:{}},400],
    [{mode:'point',question:'why',level:'year1',context:null},400],
    [{mode:'point',question:'why',level:'year1',context:{name:'a'.repeat(30001)}},413]
  ]) {const m=mock('POST',body);await handler(m.req,m.res);assert.equal(m.result().statusCode,status);}
  const m=mock('DELETE');await handler(m.req,m.res);assert.equal(m.result().statusCode,405);
});

test('configured tutor sends bounded deterministic context and a timeout signal', async () => {
  const priorKey=process.env.OPENAI_API_KEY,priorFetch=globalThis.fetch;
  try {
    process.env.OPENAI_API_KEY='test-only-not-a-secret';let captured;
    globalThis.fetch=async(url,options)=>{captured={url,options};return {ok:true,json:async()=>({output_text:'The supplied reaction is 10 kN.'})};};
    const m=mock('POST',{mode:'point',question:'Explain',level:'year1',context:{reactions:[{force:10}],learning:{recentEvents:[]}}});
    await handler(m.req,m.res);assert.equal(m.result().statusCode,200);
    assert.equal(m.result().payload.solverAuthoritative,true);
    assert.equal(captured.url,'https://api.openai.com/v1/responses');
    assert.ok(captured.options.signal instanceof AbortSignal);
    const body=JSON.parse(captured.options.body);assert.match(body.input,/"force":10/);assert.match(body.input,/"learning"/);
    assert.match(body.instructions,/Never replace, recalculate/);
  } finally {globalThis.fetch=priorFetch;if(priorKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=priorKey;}
});
