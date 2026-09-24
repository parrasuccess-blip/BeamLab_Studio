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
const {workingStep} = load('studio/working');
const near = (value, expected) => assert.ok(Math.abs(value - expected) < 1e-8, `${value} != ${expected}`);

test('engineering routes form a clear path and Learn remains a separate optional destination', () => {
    const nav = workspace.renderNavigation({workspaceMode:'analysis',tab:'build'});
    assert.match(nav, /class="workflow-engineering"/);
    assert.match(nav, /class="workflow-learning"/);
    assert.equal((nav.match(/data-action="workflow:/g) || []).length, 4);
    assert.equal((nav.match(/aria-current="page"/g) || []).length, 1);
    assert.ok(nav.indexOf('workflow:review') < nav.indexOf('workflow:learn'));
});

test('worked equations use mathematical symbols while retaining the solved reference values', () => {
    const model=fixture('simple'), result=solveStudy(model);
    assert.match(workingStep(model,result,0), /W = ∫ w\(x\) dx/);
    assert.match(workingStep(model,result,1), /ΣRᵧ/);
    assert.match(workingStep(model,result,1), /K<sub>ff<\/sub>d<sub>f<\/sub>/);
    const regions=workingStep(model,result,2);
    assert.match(regions,/t²/);assert.match(regions,/t³/);
    assert.doesNotMatch(regions,/t\^2|t\^3/);
    assert.match(workingStep(model,result,4), /M\(H⁻\) = M\(H⁺\) = 0/);
});

test('Show Why connects solved jumps, local slopes and curvature without changing the model', () => {
    const model=fixture('simple');
    model.items=model.items.filter(item=>item.kind!=='udl');
    model.items.push(makeItem('point',model.length/2,undefined,20));
    const before=JSON.stringify(model), result=solveStudy(model);
    const x=model.length/2, e=explainAt(model,result,x,'all');
    assert.equal(e.steps.length,3);
    near(e.facts.left.V,10);near(e.facts.right.V,-10);near(e.facts.right.M,50);
    assert.match(e.steps[0].detail,/ΔV = -20\.000 kN/);
    assert.match(e.steps[1].value,/moment falls/);
    assert.match(e.steps[1].detail,/M = 50\.000 kN·m/);
    assert.match(e.steps[2].equation,/EI d²v\/dx² = M\(x\)/);
    assert.match(e.steps[2].value,/v″ = 7\.143 × 10⁻⁴ m⁻¹/);
    const beginner=explainAt(model,result,x,'year1');
    assert.equal(beginner.steps[2].equation,'Moment → bending');
    assert.equal(JSON.stringify(model),before);
});

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
