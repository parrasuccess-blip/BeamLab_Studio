'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {load, fixture} = require('./support/diagram-fixtures.cjs');
const policy = load('studio/activity-policy');
const workspace = load('studio/workspace');
const {toolsPanel} = load('studio/panels');
const {solveStudy, normalise} = load('model/study');
const {makeItem} = load('model/examples');
const {explainAt} = load('studio/challenges');
const {teaching} = load('studio/diagrams');
const near = (value, expected) => assert.ok(Math.abs(value - expected) < 1e-8, `${value} != ${expected}`);

for (const level of ['year1','year2','year3','all']) {
    for (const destination of ['build','analyse','review']) test(`${level}: ${destination} ignores learning masks and exposes engineering tools`, () => {
        const view = {...workspace.transition({}, destination), level, practice:true, practiceStep:0};
        assert.equal(policy.toolLevel(view), 'all');
        assert.equal(policy.resultVisibility(view).complete, true);
        assert.equal(policy.resultVisibility(view).masked, false);
        assert.equal(policy.resultActionBlocked(view, 'export', 'pdf'), false);
        assert.equal(view.level, level);
    });
    test(`${level}: Learn reveals the same solved outputs progressively`, () => {
        const view = {tab:'learn', level, practice:true};
        assert.equal(policy.toolLevel(view), level);
        for (let step = 0; step <= 4; step++) {
            view.practiceStep = step;
            const visible = policy.resultVisibility(view);
            assert.equal(visible.reactions, step >= 1);
            assert.equal(visible.shear, step >= 2);
            assert.equal(visible.moment, step >= 3);
            assert.equal(visible.deformation, step >= 4);
            for (const action of ['working','audit','export-audit','compare-details','ai-open','design-export']) assert.equal(policy.resultActionBlocked(view, action), step < 4);
            for (const format of ['csv','svg','png','pdf']) assert.equal(policy.resultActionBlocked(view, 'export', format), step < 4);
            assert.equal(policy.resultActionBlocked(view, 'export', 'json'), false);
        }
    });
}
test('idle Learn and submitted review expose answers; an active exam cannot bypass its mask with a reveal preference', () => {
    assert.equal(policy.resultVisibility({tab:'learn', practice:false}).complete, true);
    assert.equal(policy.resultVisibility({tab:'learn', practice:true, session:{review:true,mode:'exam'}}).complete, true);
    for (const practice of [true,false]) {
        const v = {tab:'learn', practice, practiceStep:4, session:{active:true, mode:'exam'}};
        assert.equal(policy.resultVisibility(v).step, 0);
        assert.equal(policy.modelLocked(v), true);
    }
    assert.equal(policy.modelLocked({standaloneLearning:true, lessonId:'example'}), false);
    assert.equal(policy.modelLocked({session:{review:true}}), true);
});
test('checking identity follows the current question and fails closed on a changed beam', () => {
    for (const v of [{session:{active:true,questionReference:'given'}},{lessonId:'one',lessonModelReference:'given'},{challengeId:'one',challengeModelReference:'given'}]) {
        assert.equal(policy.questionMatches(v, 'given'), true);
        assert.equal(policy.questionMatches(v, 'changed'), false);
    }
    for (const v of [{session:{active:true}}, {lessonId:'one'}, {challengeId:'one'}]) assert.equal(policy.questionMatches(v,'given'),false);
    assert.equal(policy.questionMatches({},'given'),true);
    assert.equal(policy.resultVisibility({tab:'learn',activityMismatch:true,practiceStep:4}).step,0);
});
test('first-year preference keeps full Build section and load-case controls', () => {
    const m = fixture('simple'), v = {tab:'build',level:'year1',selected:new Set(),advanced:true};
    const before = JSON.stringify(m), html = toolsPanel(m, v);
    for (const key of ['tab:section','tab:cases','data-tool="moment"','data-tool="hinge"']) assert.ok(html.includes(key));
    assert.equal(v.level, 'year1'); assert.equal(JSON.stringify(m), before);
});
test('coincident downward point and CCW couple explain both independently verified jumps', () => {
    const m = fixture('simple'); m.length = 10;
    m.items = m.items.filter(i => ['pin','roller'].includes(i.kind)); m.items[1].x = 10;
    m.items.push({...makeItem('point',5,undefined,20),caseId:m.cases[0].id}, {...makeItem('moment',5,undefined,30),caseId:m.cases[0].id});
    const before = JSON.stringify(m), a = solveStudy(normalise(m)), e = explainAt(m,a,5,'all');
    near(a.reactions[0].force,13); near(a.reactions[1].force,7);
    near(e.facts.left.V,13); near(e.facts.right.V,-7);
    near(e.facts.left.M,65); near(e.facts.right.M,35);
    assert.match(e.title,/both a shear jump and a moment jump/);
    assert.match(e.lines.join(' '),/ΔV = V⁺ − V⁻ = -20.000/);
    assert.match(e.lines.join(' '),/ΔM = M⁺ − M⁻ = -30.000/);
    assert.doesNotMatch(e.lines.join(' '),/moment remains continuous/);
    assert.ok(teaching(m,a,5).includes(e.title));
    assert.equal(JSON.stringify(m),before);
});
test('self-weight and case factors come from the same solved local intensity as the plots', () => {
    const m = fixture('simple'); m.items = m.items.filter(i => ['pin','roller'].includes(i.kind));
    m.selfWeight = true; m.selfWeightCase = m.cases[0].id; m.cases[0].factor = 1.7;
    let a = solveStudy(m), e = explainAt(m,a,m.length/2,'all');
    near(e.facts.w, a.properties.weight * 1.7);
    assert.match(e.lines.join(' '),/including enabled, factored self-weight/);
    m.cases[0].enabled = false; a = solveStudy(m); e = explainAt(m,a,m.length/2);
    near(e.facts.w,0);
});
test('a continuous intermediate support does not imply zero moment and endpoints do not invent a jump', () => {
    const m = fixture('continuous'), a = solveStudy(m), middle = m.items.find(i => i.kind === 'roller' && i.x > 0 && i.x < m.length);
    const e = explainAt(m,a,middle.x,'all');
    assert.ok(Math.abs(e.facts.right.M) > 1);
    assert.match(e.lines.join(' '),/does not release moment/);
    const end = explainAt(m,a,m.length,'all');
    assert.equal(end.facts.endpoint,true); assert.match(end.lines.join(' '),/no second beam region/);
});
