'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {load,fixture}=require('./support/diagram-fixtures.cjs');
const {textWidth,wrapText,labelBox,overlaps,placeCallouts,stackLabels}=load('studio/annotation-layout');
const {renderDiagrams,layoutModel,coordinates}=load('studio/diagrams');
const {solveStudy}=load('model/study');
const view=(width,extra={})=>({width,zoom:1,pan:0,selected:new Set(),annotationMode:'detailed',trace:null,stress:true,deformation:true,...extra});

test('annotation wrapping retains long names, Unicode symbols and every number',()=>{
    const input='West support 支座 W'.repeat(3)+' θ +100.00 mrad / R -123456.789 kN';
    const lines=wrapText(input,120);
    assert.equal(lines.join('').replace(/\s/g,''),input.replace(/\s/g,''));
    for(const line of lines) assert.ok(textWidth(line)<=120);
});
for(const width of [280,360,550,1100]) test(`annotation allocation is bounded, deterministic and lossless at ${width}px`,()=>{
    const wanted=Array.from({length:24},(_,n)=>({...labelBox([{text:`${n} / -123456.789`,colour:'#ffffff'},{text:'x=200.00 m',size:9}],width-90),px:45+(width-90)*(n%3)/2,py:n%2?42:174,above:n%2===0,id:n}));
    const bounds={left:45,right:width-45,top:5,bottom:201};
    const boxes=placeCallouts(wanted,bounds);
    assert.equal(boxes.length,wanted.length);assert.equal(JSON.stringify(boxes),JSON.stringify(placeCallouts(wanted,bounds)));
    boxes.forEach((b,n)=>{assert.equal(b.id,n);assert.ok(b.x>=45 && b.x+b.width<=width-45+1e-9);assert.ok(b.y>=5);for(const other of boxes.slice(n+1)) assert.equal(overlaps(b,other,0),false);for(const point of wanted)assert.equal(overlaps(b,{x:point.px-5,y:point.py-5,width:10,height:10},0),false);});
    const notes=stackLabels(wanted,width,300);
    notes.forEach((b,n)=>{assert.ok(b.x>=12&&b.x+b.width<=width-12+1e-9);for(const other of notes.slice(n+1))assert.equal(overlaps(b,other,0),false);});
});
for(const key of ['simple','fixed','cantilever','continuous','suspended','crowded']) test(`${key}: diagram layout preserves model, solved values and exact critical coordinates`,()=>{
    const m=fixture(key),saved=JSON.stringify(m),a=solveStudy(m);
    for(const width of [280,360,1100]) {
        const html=renderDiagrams(m,a,view(width));
        assert.ok(!html.includes('NaN')&&!html.includes('Infinity'));
        for(const block of html.split('<section class="diagram-block" data-kind="').slice(1)) {
            const kind=block.split('"')[0];
            for(const match of block.matchAll(/data-x="([^"]+)" data-value="([^"]+)"/g)) {
                const x=+match[1],value=+match[2];
                const candidates=['left','right'].map(side=>{const s=a.sample(x,side);return kind==='v'?s.v*1000:kind==='stress'?-s.M*(s.c??a.properties.c)/(s.I??a.properties.I)/1000:s[kind];});
                assert.ok(candidates.some(v=>Math.abs(v-value)<=1e-8*(1+Math.abs(value))),`${kind}@${x}: ${value}`);
            }
        }
        assert.equal(JSON.stringify(m),saved);
    }
});
test('load labels use full text widths and separate vertical extents at endpoints',()=>{
    const m=fixture('crowded');
    for(const width of [280,360,1100]) {
        const l=layoutModel(m,width),boxes=[];
        for(const [id,b] of l.labels) {
            const box={x:b.cx-b.width/2,y:l.beamY+b.top-l.offsets[l.lanes.get(id)],width:b.width,height:b.height};
            assert.ok(box.y>=24-1e-9&&box.x>=12-1e-9&&box.x+box.width<=width-12+1e-9);
            boxes.forEach(other=>assert.equal(overlaps(box,other,0),false));boxes.push(box);
        }
    }
});
test('zoom excludes off-screen point labels without clamping them onto visible objects',()=>{
    const m=fixture('crowded'),v=view(360,{zoom:2,pan:2.5}),l=layoutModel(m,360,v),{xp}=coordinates(m,v);
    assert.equal(l.labels.size,1);assert.ok(l.labels.has('fixture-2'));
    assert.equal(xp(2.5),45);assert.equal(xp(7.5),315);
    const html=renderDiagrams(m,solveStudy(m),v);
    assert.ok(!html.includes('West fixed support'));assert.ok(html.includes('Near centre B'));
});
test('practice hides all unrevealed critical values and reaction notes; clean mode hides critical labels',()=>{
    const m=fixture('fixed'),a=solveStudy(m);
    const hidden=renderDiagrams(m,a,view(360,{practice:true,practiceStep:0}));
    assert.ok(!hidden.includes('data-annotation="critical"'));assert.ok(hidden.includes('reaction ?'));assert.ok(!hidden.includes('R +25.00'));
    const clean=renderDiagrams(m,a,view(360,{annotationMode:'clean'}));
    assert.ok(!clean.includes('data-annotation="critical"'));assert.ok(clean.includes('R +25.00'));
});
