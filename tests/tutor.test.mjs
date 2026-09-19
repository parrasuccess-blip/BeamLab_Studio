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
