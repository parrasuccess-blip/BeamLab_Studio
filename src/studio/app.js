"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const examples_1 = require("../model/examples");
const validation_1 = require("../model/validation");
const study_1 = require("../model/study");
const catalogue_1 = require("../model/catalogue");
const sections_1 = require("../model/sections");
const section_regions_1 = require("../model/section-regions");
const stiffness_1 = require("../model/stiffness");
const history_1 = require("./history");
const common_1 = require("./common");
const diagrams_1 = require("./diagrams");
const panels_1 = require("./panels");
const workspace = require("./workspace");
const activity = require("./activity-policy");
const sectionLab = require("./section-lab");
const reviewHub = require("./review-hub");
const learningTransfer = require("./learning-transfer");
let pendingLearningImport = null;
const levels_1 = require("./levels");
const challenges_1 = require("./challenges");
const design_1 = require("./design");
const design_workflow_1 = require("./design-workflow");
const learning_evidence_1 = require("./learning-evidence");
const learning_path_1 = require("./learning-path");
const adaptive_practice_1 = require("./adaptive-practice");
const learning_trajectory_1 = require("./learning-trajectory");
const topic_drilldown_1 = require("./topic-drilldown");
const study_plan_1 = require("./study-plan");
const study_block_1 = require("./study-block");
const study_block_resume_1 = require("./study-block-resume");
const working_1 = require("./working");
const export_1 = require("./export");
const verification = require('./verification');
const presentation = require('./presentation');
const {MovingLab} = require('./moving-ui');
const {renderShear} = require('./shear-ui');
let movingLab = null;
const $ = (s) => document.querySelector(s);
const storageKey = 'beamlab:studio:3.2';
let restoreNotice = '';
function restore() {
    let data = null;
    try {
        data = localStorage.getItem(storageKey) || localStorage.getItem('beamlab:3:model');
    }
    catch {
        return (0, study_1.normalise)((0, examples_1.example)('simple'));
    }
    if (!data)
        return (0, study_1.normalise)((0, examples_1.example)('simple'));
    try {
        return (0, study_1.parseStudy)(data);
    }
    catch {
        restoreNotice = 'Saved model could not be restored. A starter study is open; you can import a valid JSON copy.';
        return (0, study_1.normalise)((0, examples_1.example)('simple'));
    }
}
const history = new history_1.History(restore());
let learningConfigured = false;
let learningSaved = null;
let existingStudioState = false;
try {
    existingStudioState = !!(localStorage.getItem(storageKey) || localStorage.getItem(storageKey + ':view') || localStorage.getItem('beamlab:3:model'));
    learningSaved = JSON.parse(localStorage.getItem(storageKey + ':learning') || 'null');
    learningConfigured = !!learningSaved?.level || existingStudioState;
}
catch { existingStudioState = false; learningConfigured = false; learningSaved = null; }
const v = { fibre:0, sectionSide:'right', reviewDetail:'overview', workspaceMode: 'analysis', tab: 'build', level: learningSaved?.level || 'all', levelPreferencesOpen:false, standaloneLearning:false, teachMe: learningSaved?.teachMe !== false, advanced: false, annotations: true, annotationMode: 'guided', deformation: false, stress: false, shear: false, moving: false, teaching: false, practice: false, practiceStep: 0, learnSection: 'lessons', lessonId: null, lessonChoice: null, lessonFeedback: null, lessonMethod: 'choice', lessonSketch: [], lessonSketchResult: null, lessonSketchReference: false, lessonSketchReferencePoints: [], challengeId: null, challengeFeedback: null, masteryView: [], session: null, taskAttempted: false, taskMasteryLocked: false, review: false, selected: new Set(), controls: true, inspector: true, snap: .1, zoom: 1, pan: 0, step: 0, working: false, trace: null, pinned: false, currentCase: history.model.cases[0].id };
let standaloneOrigin = null;
try {
    const saved = JSON.parse(localStorage.getItem(storageKey + ':view') || '{}');
    for (const k of ['deformation', 'stress', 'shear', 'teaching', 'annotations'])
        if (typeof saved[k] === 'boolean')
            v[k] = saved[k];
    if (['clean','guided','detailed'].includes(saved.annotationMode)) v.annotationMode = saved.annotationMode;
    else if (typeof saved.annotations === 'boolean') v.annotationMode = saved.annotations ? 'detailed' : 'clean';
    v.annotations = v.annotationMode !== 'clean';
}
catch { /* Model export remains available when storage is disabled. */ }
if (!levels_1.modes[v.level]) v.level = 'all';
if (!(0, levels_1.allowedTabs)(activity.toolLevel(v)).includes(v.tab)) v.tab = 'build';
let analysis = null, error = '', compareModel = null, comparison = null;
let width = 760, layout, toastTimer;
let fieldTransaction = null;
let inlineId = null;
let lastTap = null;
let drag = null;
let palette = null;
let exportBusy = false;
let demoSession = null;
let sweepFrame = 0, sweepPlaying = false, sweepLastTime = 0, sweepElapsed = 0;
let sweepProgress = 0.5, sweepDirection = 1;
let demoNotes = false;
let lastAudit = null;
let dialogReturnFocus = null;
let lessonSketchDrawing = false;
let lessonSketchPointer = null;
let aiTutor = { busy: false, history: [], error: '', mode: 'question' };
let designSettings = (0, design_1.defaults)();
try { designSettings = (0, design_1.normaliseSettings)(JSON.parse(localStorage.getItem(storageKey + ':design') || 'null')); } catch { designSettings = (0, design_1.defaults)(); }
let designStep = 1;
try {
    const savedDesignStep = Number(localStorage.getItem(storageKey + ':design-step'));
    if (Number.isInteger(savedDesignStep) && savedDesignStep >= 1 && savedDesignStep <= 5) designStep = savedDesignStep;
} catch { /* Step position is session-only when storage is unavailable. */ }
function saveDesignSettings() {
    try { localStorage.setItem(storageKey + ':design', JSON.stringify(designSettings)); }
    catch { /* Design inputs remain available for this session. */ }
}
function saveDesignStep() {
    try { localStorage.setItem(storageKey + ':design-step', String(designStep)); }
    catch { /* Design navigation remains available for this session. */ }
}
let challengeProgress = {};
try { challengeProgress = JSON.parse(localStorage.getItem(storageKey + ':challenges') || '{}'); if (!challengeProgress || typeof challengeProgress !== 'object' || Array.isArray(challengeProgress)) challengeProgress = {}; } catch { challengeProgress = {}; }
v.challengeProgress = challengeProgress;
let progressStorageAvailable = true;
let lessonProgress = {};
try { lessonProgress = JSON.parse(localStorage.getItem(storageKey + ':lessons') || '{}'); if (!lessonProgress || typeof lessonProgress !== 'object' || Array.isArray(lessonProgress)) lessonProgress = {}; } catch { lessonProgress = {}; progressStorageAvailable = false; }
v.lessonProgress = lessonProgress;
v.progressStorageAvailable = progressStorageAvailable;
let masteryStats = {};
try { masteryStats = JSON.parse(localStorage.getItem(storageKey + ':mastery') || '{}'); if (!masteryStats || typeof masteryStats !== 'object' || Array.isArray(masteryStats)) masteryStats = {}; } catch { masteryStats = {}; v.progressStorageAvailable = false; }
v.masteryStats = masteryStats;
let learningEvidenceEvents = [];
try {
    const savedEvidence = JSON.parse(localStorage.getItem(storageKey + ':learning-evidence') || '[]');
    learningEvidenceEvents = Array.isArray(savedEvidence) ? savedEvidence.slice(-learning_evidence_1.MAX_EVENTS) : [];
} catch { learningEvidenceEvents = []; }
function saveLearningEvidence() {
    try { localStorage.setItem(storageKey + ':learning-evidence', JSON.stringify(learningEvidenceEvents)); }
    catch { /* Learning evidence remains session-only when storage is unavailable. */ }
}
function recordLearningEvidence(event) {
    learningEvidenceEvents = (0, learning_evidence_1.appendEvent)(learningEvidenceEvents, event);
    saveLearningEvidence();
}
function currentLearningEvidenceTask() {
    const lesson = currentLesson(), challenge = currentChallenge();
    const spec = lesson || challenge;
    if (!spec) return null;
    const kind = lesson ? 'lesson' : 'challenge';
    return { kind, id:spec.id, title:spec.title, topic:(0, challenges_1.topicForTask)(kind, spec.id) };
}
function learningEvidenceSnapshot() {
    return (0, learning_evidence_1.snapshot)(learningEvidenceEvents, masteryStats, currentLearningEvidenceTask());
}
if (typeof window !== 'undefined') window.BeamLabLearningEvidence = { snapshot: learningEvidenceSnapshot };
let sessionLoading = false;
let sessionClockHandle = null;
const studyBlockResumeKey = storageKey + ':study-block-resume';
let studyBlockResume = null;
try {
    studyBlockResume = (0, study_block_resume_1.normalise)(localStorage.getItem(studyBlockResumeKey));
    if (!studyBlockResume) localStorage.removeItem(studyBlockResumeKey);
} catch { studyBlockResume = null; }
function syncStudyBlockResumeView() {
    v.studyBlockResume = (0, study_block_resume_1.summary)(studyBlockResume);
}
syncStudyBlockResumeView();
function persistGuidedStudyBlock() {
    if (!v.session?.active || v.session.mode !== 'plan') return;
    const snapshot = (0, study_block_resume_1.create)(v.session, v.level);
    if (!snapshot) return;
    try {
        localStorage.setItem(studyBlockResumeKey, JSON.stringify(snapshot));
        studyBlockResume = snapshot;
        syncStudyBlockResumeView();
    } catch { /* The active study block continues even if browser storage is unavailable. */ }
}
function clearGuidedStudyBlockResume() {
    studyBlockResume = null;
    syncStudyBlockResumeView();
    try { localStorage.removeItem(studyBlockResumeKey); } catch { /* Session-only cleanup is sufficient. */ }
}
// A new, untouched study follows the chosen learning level. The first real model edit freezes it.
let levelStarterActive = !existingStudioState;
try { if (localStorage.getItem(storageKey + ':starter-follow') === '1') levelStarterActive = true; } catch { /* session-only starter is fine */ }
function starterModelForLevel(id) {
    const key = id === 'all' ? 'reference' : (0, levels_1.recommendedExample)(id);
    const m = key === 'reference' ? referenceExample() : (0, study_1.normalise)((0, examples_1.example)(key));
    if (id === 'year1') m.name = 'First-year bridge / centre point load';
    if (id === 'year2') m.name = 'Second-year continuous beam';
    if (id === 'year3') m.name = 'Third-year suspended-span study';
    if (id === 'all') m.name = 'My beam / centre point load';
    return m;
}
function installLevelStarter(id) {
    const m = starterModelForLevel(id);
    history.model = m;
    history.past = [];
    history.future = [];
    v.currentCase = m.cases[0].id;
    v.zoom = 1; v.pan = 0; v.trace = null; v.pinned = false;
    v.selected.clear(); inlineId = null; compareModel = null; comparison = null; layout = undefined;
}
if (levelStarterActive) {
    const initialStarter = starterModelForLevel(v.level);
    history.model = initialStarter;
    history.past = []; history.future = [];
    v.currentCase = initialStarter.cases[0].id;
}
const publicOrigin = /^https?:$/.test(location.protocol) && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
function visibility() { return activity.resultVisibility(v); }
function blockModelEdit() {
    if (sessionLoading || !activity.modelLocked(v)) return false;
    toast('The given model is locked. Exit or finish the learning session to edit your own study.');
    return true;
}
function questionIsCurrent() {
    if (activity.questionMatches(v, verification.fingerprint(history.model))) return true;
    v.activityMismatch = true;
    toast('The question model changed. Restore the given model before checking this answer.');
    render();
    return false;
}
function shown(key) {
    if (key === 'practice') return visibility().masked;
    if (['teaching','moving','review'].includes(key) && !visibility().complete) return false;
    const hasEIOnlyOverrides = (history.model.stiffnessRegions || []).some(r => Math.abs(Number(r.factor)-1) > 1e-12);
    if ((key === 'stress' || key === 'shear') && hasEIOnlyOverrides) return false;
    return key === 'annotations' ? v.annotationMode !== 'clean' : (0, levels_1.canUseFeature)(activity.toolLevel(v), key) && !!v[key];
}
function diagramView() { return { width, zoom: v.zoom, pan: v.pan, selected: v.selected, annotations: v.annotationMode !== 'clean', annotationMode: v.annotationMode, deformation: shown('deformation'), stress: shown('stress'), teaching: shown('teaching'), practice: shown('practice'), practiceStep: visibility().step, trace: v.trace, compare: visibility().complete ? comparison : null, layout, scaleLimits: demoSession?.index === 0 ? {V:20,M:30,v:1.3,stress:18} : null }; }
function solve() {
    // Lesson choices/recaps describe a fixed reference study, not arbitrary edits.
    // Numerical fields and drags preview changes before commit. An invalid or
    // cancelled preview must not discard the question that rollback restores.
    const committedEdit = !fieldTransaction && !drag && !activity.modelLocked(v);
    if (committedEdit && v.lessonId && v.lessonModelReference &&
        verification.fingerprint(history.model) !== v.lessonModelReference) {
        v.changedActivity = {kind:'lesson', id:v.lessonId};
        v.practice = false;
        v.lessonId = null;
        v.lessonChoice = null;
        v.lessonFeedback = null;
        v.lessonSketch = []; v.lessonSketchResult = null; v.lessonSketchReference = false; v.lessonSketchReferencePoints = [];
        v.lessonModelReference = null;
    }
    if (committedEdit && v.challengeId && v.challengeModelReference &&
        verification.fingerprint(history.model) !== v.challengeModelReference) {
        v.changedActivity = {kind:'challenge', id:v.challengeId};
        v.practice = false;
        v.challengeId = null;
        v.challengeFeedback = null;
        v.challengeModelReference = null;
    }
    try {
        analysis = (0, study_1.solveStudy)(history.model);
        error = '';
    }
    catch (e) {
        analysis = null;
        error = e instanceof Error ? e.message : 'Unable to solve this model.';
    }
    try {
        comparison = compareModel && compareModel.length === history.model.length ? (0, study_1.solveStudy)(compareModel) : null;
    }
    catch {
        comparison = null;
    }
}
function save() {
    if (demoSession) { $('#save-label').textContent = 'Demo / your original study is preserved'; return; }
    if (standaloneOrigin) { $('#save-label').textContent = 'Learning example / your model is preserved'; return; }
    if (v.session?.active || v.session?.review) { $('#save-label').textContent = 'Practice session / original study preserved'; return; }
    try {
        (0, study_1.validateStudy)(history.model);
        localStorage.setItem(storageKey, JSON.stringify(history.model));
        localStorage.setItem(storageKey + ':view', JSON.stringify({ deformation: v.deformation, stress: v.stress, shear: v.shear, moving: v.moving, annotations: v.annotationMode !== 'clean', annotationMode: v.annotationMode, teaching: v.teaching }));
        if (learningConfigured || levelStarterActive) localStorage.setItem(storageKey + ':learning', JSON.stringify({ level: v.level, teachMe: v.teachMe }));
        if (levelStarterActive) localStorage.setItem(storageKey + ':starter-follow', '1'); else localStorage.removeItem(storageKey + ':starter-follow');
        $('#save-label').textContent = 'Saved in this browser';
    }
    catch {
        $('#save-label').textContent = 'Export a copy to keep this model';
    }
}
function saveLearning() {
    learningConfigured = true;
    try {
        localStorage.setItem(storageKey + ':learning', JSON.stringify({ level: v.level, teachMe: v.teachMe }));
        learningConfigured = true;
    }
    catch { /* The selected level still applies for this session. */ }
}
function renderLearningBar() {
    const root = $('#learning-bar');
    const current = (0, levels_1.mode)(v.level);
    const learning = activity.isLearning(v), expanded = learning || v.levelPreferencesOpen;
    root.classList.toggle('compact', !expanded);
    root.innerHTML = `<div class="level-context"><span>${learning ? 'LEARNING LEVEL' : 'BUILD / EXPLORE'}</span><b>${learning ? (0, common_1.esc)(current.short + ' / ' + current.title) : 'All Tools'}</b><small>${learning ? (0, common_1.esc)(current.subtitle) : 'All engineering tools and results are available. Learning is optional.'}</small></div>${learning ? '' : `<button type="button" data-action="level-preferences" class="secondary" aria-expanded="${expanded}" aria-controls="level-options">${expanded ? 'Hide learning settings' : 'Learning settings'}</button>`}<div id="level-options" class="level-options" ${expanded ? '' : 'hidden'}>${learning ? '' : '<p class="hint">Choose an explanation level for Learn. This does not restrict Build, Analyse or Review.</p>'}<div class="level-switch" role="group" aria-label="Learning level">${levels_1.modeOrder.map(id => { const m = (0, levels_1.mode)(id); return `<button data-action="level:${id}" class="${v.level === id ? 'active' : ''}" aria-pressed="${v.level === id}" ${activity.modelLocked(v) ? 'disabled' : ''}><span>${(0, common_1.esc)(m.short)}</span><small>${(0, common_1.esc)(m.title)}</small></button>`; }).join('')}</div>${(0, common_1.button)('curriculum', (0, common_1.icon)('help', 14), 'icon-button level-help', false, 'How the learning levels were chosen')}</div>`;
}
function setLearningMode(id, fromSetup = false) {
    if (v.session?.active || v.session?.review) { toast('Finish or close the learning session before changing level.'); return; }
    if (!levels_1.modes[id]) return;
    finishField();
    const destination = workspace.phaseFor(v);
    endStandaloneLearning();
    Object.assign(v, workspace.transition(v, destination));
    const previous = v.level;
    v.level = id;
    v.advanced = false;
    v.selected.clear();
    inlineId = null;
    if (activity.isLearning(v) && !(0, levels_1.allowedTabs)(id).includes(v.tab)) v.tab = 'learn';
    if (levelStarterActive) installLevelStarter(id);
    saveLearning();
    render();
    save();
    if (fromSetup) {
        closeDialog();
        $('#workspace').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    if (levelStarterActive && previous !== id)
        toast(`${(0, levels_1.mode)(id).short} starter loaded. Edit anything and BeamLab will keep your study when you change levels.`);
    if (v.teachMe && previous !== id) {
        const unlocked = (0, levels_1.unlockSummary)(previous, id);
        if (unlocked.tools.length || unlocked.features.length) {
            const names = [...unlocked.tools.map(k => examples_1.titles[k]), ...unlocked.features.map(k => k === 'moving' ? 'moving-load lab' : k.replace(/(^|_)([a-z])/g, (_, a, b) => (a ? ' ' : '') + b.toUpperCase()))];
            toast(`${(0, levels_1.mode)(id).short} unlocked: ${names.slice(0, 5).join(', ')}${names.length > 5 ? ' and more' : ''}. Open Learn for a guided example.`);
        }
    }
}
function learningSetup() {
    const cards = levels_1.modeOrder.map(id => {
        const m = (0, levels_1.mode)(id);
        return `<button class="level-choice" data-action="level-setup:${id}"><span>${(0, common_1.esc)(m.short)}</span><b>${(0, common_1.esc)(m.title)}</b><small>${(0, common_1.esc)(m.subtitle)}</small></button>`;
    }).join('');
    openDialog('Choose how deep BeamLab should go', `<p>Pick the stage closest to what you are studying. On a fresh, untouched workspace BeamLab also loads a simple example suited to that level. Once you edit the model, changing level only changes the controls and explanations — never your structure.</p><div class="level-choice-grid">${cards}</div><label class="setup-teach"><input id="setup-teach" type="checkbox" ${v.teachMe ? 'checked' : ''}> <span><b>Teach me as I go</b><small>Highlight new ideas when I move up a level.</small></span></label><p class="hint">The presets are based on common Australian civil/structural engineering sequences. Courses vary between universities and you can change level anytime.</p>${(0, common_1.button)('curriculum', 'See the syllabus basis', 'wide-button')}`);
}
function curriculumDialog() {
    openDialog('How the learning levels were chosen', `<p>BeamLab uses a broad Australian progression rather than pretending every university teaches the same topic in the same semester.</p><div class="curriculum-grid"><article><span>1ST YEAR / FUNDAMENTALS</span><h3>Statics first.</h3><p>Equilibrium, free-body diagrams, support reactions and distributed forces are consistently early topics. Several programs also introduce internal forces and shear/moment diagrams in first-year mechanics, while others move those diagrams into second year. BeamLab keeps SFD/BMD visible because they are its core response views.</p></article><article><span>2ND YEAR / STRUCTURAL BEHAVIOUR</span><h3>Deformable members.</h3><p>Section properties, stress/strain, elastic bending, shear and deflection become central, together with indeterminacy and structural-analysis methods in many programs.</p></article><article><span>3RD+ YEAR / DESIGN CONTEXT</span><h3>Cases, serviceability and design preparation.</h3><p>Structural design subjects commonly add permanent/live/wind actions, load combinations, serviceability, continuous systems and member behaviour. BeamLab exposes those analysis tools here without claiming code compliance.</p></article></div><div class="source-links"><a target="_blank" rel="noopener noreferrer" href="https://www.sydney.edu.au/units/CIVL1802.html">Sydney CIVL1802 / Statics</a><a target="_blank" rel="noopener noreferrer" href="https://www.sydney.edu.au/units/CIVL2201">Sydney CIVL2201 / Structural Mechanics</a><a target="_blank" rel="noopener noreferrer" href="https://handbook.unsw.edu.au/undergraduate/courses/2026/cven2303">UNSW CVEN2303 / Structural Analysis & Modelling</a><a target="_blank" rel="noopener noreferrer" href="https://www.handbook.unsw.edu.au/undergraduate/courses/2026/ENGG2400">UNSW ENGG2400 / Mechanics of Solids 1</a><a target="_blank" rel="noopener noreferrer" href="https://handbook.monash.edu/2026/units/civ2206">Monash CIV2206 / Structural Mechanics</a><a target="_blank" rel="noopener noreferrer" href="https://course-profiles.uq.edu.au/course-profiles/CIVL2330-21217-7620">UQ CIVL2330 / Structural Mechanics</a><a target="_blank" rel="noopener noreferrer" href="https://programsandcourses.anu.edu.au/course/engn1217">ANU ENGN1217 / Introduction to Mechanics</a></div><p class="hint">These links explain the curriculum rationale only. BeamLab is not affiliated with or endorsed by these universities.</p>`);
}
function nextLevelForSelection() {
    const selected = history.model.items.find(i => v.selected.has(i.id));
    if (!selected) return 'all';
    return levels_1.modeOrder.find(id => (0, levels_1.canEditItem)(id, selected)) || 'all';
}
function toast(message) {
    $('#toast').innerHTML = `<span>${(0, common_1.esc)(message)}</span>${(0, common_1.button)('dismiss-toast', (0, common_1.icon)('close', 14), 'icon-button', false, 'Dismiss message')}`;
    $('#toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 6000);
}
function commit(next, label, keepSelection = true) {
    if (blockModelEdit()) return;
    pauseSweep();

    if (v.lessonId) { v.lessonChoice = null; v.lessonFeedback = null; }
    finishField();
    levelStarterActive = false;
    history.commit(next, label);
    if (!keepSelection) {
        v.selected.clear();
        inlineId = null;
        $('#inline-edit').innerHTML = '';
    }
    v.selected = new Set([...v.selected].filter(id => next.items.some(i => i.id === id)));
    if (!next.cases.some(c => c.id === v.currentCase))
        v.currentCase = next.cases[0].id;
    v.trace = null;
    v.pinned = false;
    layout = undefined;
    render();
    save();
}
function renderWorkspaceModeBar() {
    $('#workspace-mode-bar').innerHTML = workspace.renderNavigation(v);
    $('#workflow-context').innerHTML = workspace.renderContext(v, !!analysis);
    $('#workspace-grid').dataset.phase = workspace.phaseFor(v);
}
let pendingWorkspace = null;
function requestSessionExit(target = null) {
    pendingWorkspace = target;
    if (v.session?.review) {
        const old = v.session; restoreSessionOrigin(old);
        if (target) setWorkflow(target);
        return;
    }
    if (!v.session?.active) return;
    openDialog('Exit this learning session?', `<p>Your original structural study, edit history and comparison will be restored. This unfinished session will be discarded; evidence from answers already checked remains.${v.session.mode === 'plan' ? ' The saved resume point will also be removed.' : ''}</p><div class="dialog-actions">${(0,common_1.button)('dialog-close','Stay in Learn','secondary')}${(0,common_1.button)('session-exit-confirm',target ? 'Exit and return to ' + (target === 'build' ? 'Build / Explore' : target === 'analyse' ? 'Analyse' : 'Review') : 'Exit session','danger')}</div>`);
}
function setWorkflow(target) {
    const next = workspace.transition(v, target);
    if (!next) { if (workspace.steps.some(s => s.id === target)) requestSessionExit(target); return; }
    finishField();
    if (target !== 'learn') {
        endStandaloneLearning();
        v.practice = false; v.practiceStep = 0;
        levelStarterActive = false;
    }
    Object.assign(v, next);
    if (matchMedia('(max-width:780px)').matches) v.controls = target === 'learn';
    if (target === 'review') v.reviewDetail = 'overview';
    v.selected.clear(); inlineId = null; $('#inline-edit').innerHTML = '';
    render(); save();
}
function enterWorkspace(target) {
    setWorkflow(target);
    if (activity.modelLocked(v) && target !== 'learn') return;
    window.history.replaceState(null, '', '#workspace');
    $('#workspace').focus({preventScroll:true});
    $('#workspace').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}
function designNumberField(key,label,value,unit,min,max,placeholder='') {
    const val = value === null || value === undefined ? '' : String(value);
    return `<label class="design-field"><span>${(0,common_1.esc)(label)}</span><input data-design-number="${(0,common_1.esc)(key)}" type="number" inputmode="decimal" min="${min}" max="${max}" step="any" value="${(0,common_1.esc)(val)}" placeholder="${(0,common_1.esc)(placeholder)}" aria-label="${(0,common_1.esc)(label)}"><em>${(0,common_1.esc)(unit)}</em></label>`;
}
function designRatioCard(check) {
    const assessed = check.ratio !== null;
    const over = assessed && check.ratio > 1;
    const pct = assessed ? Math.min(140, Math.max(0, check.ratio * 100)) : 0;
    const demand = `${(0,common_1.fmt)(check.demand,3)} ${check.unit}`;
    const limit = assessed ? `${(0,common_1.fmt)(check.limit,3)} ${check.unit}` : 'not entered';
    return `<article class="design-ratio ${!assessed?'unset':over?'over':''}"><div class="design-ratio-head"><div><b>${(0,common_1.esc)(check.label)}</b><small>Demand ${demand} / limit ${limit}</small></div><strong>${assessed?(0,common_1.fmt)(check.ratio,3):'—'}</strong></div><small>${assessed?(over?'Exceeds the entered screening limit.':'Below the entered screening limit.'):'Not assessed until you enter a capacity or criterion.'} ${assessed?(0,common_1.esc)(check.basis):''}</small><div class="design-ratio-track"><i style="width:${pct}%"></i></div></article>`;
}
function designElasticReference(r) {
    const fy = r.elasticReference;
    return `${fy.unavailable?`<div class="design-empty design-unavailable"><b>Not inferred for EI-only zones.</b><p>${(0,common_1.esc)(fy.reason)}</p></div>`:fy.momentKNm?`<div class="design-reference"><span>ELASTIC FIRST-YIELD REFERENCE${r.section.hasTrueSteppedSections?' / GOVERNING LOCAL SECTION':''}</span><b>${(0,common_1.fmt)(fy.momentKNm,2)} kN·m</b><p>M/My = ${(0,common_1.fmt)(fy.ratio,3)}${fy.x!==null?' at x = '+(0,common_1.fmt)(fy.x,3)+' m':''}${fy.sectionLabel?' · '+(0,common_1.esc)(fy.sectionLabel):''}. This remains an elastic mechanics reference and ignores section classification, LTB, restraint and code capacity factors.</p></div>`:'<div class="design-empty">Enter fy only if you want this educational mechanics reference. It is not required for the manual-capacity review.</div>'}`;
}
function renderDesignStudio() {
    const root = $('#design-studio');
    if (!root) return;
    const m = history.model, a = analysis;
    if (v.reviewDetail !== 'criteria') { root.innerHTML=reviewHub.render(m,a,v); return; }
    if (!a) {
        root.innerHTML = `<section class="design-invalid"><span class="eyebrow">DESIGN STUDIO / DEMAND UNAVAILABLE</span><h3>Stabilise the analysis model first.</h3><p>Design mode never guesses demand. Return to Analysis, resolve the model error, then come back.</p>${(0,common_1.button)('workspace-mode:analysis','Return to Analysis','primary')}</section>`;
        return;
    }
    const r = (0, design_1.evaluate)(m,a,designSettings);
    const s = r.settings, d = r.demand;
    const factorRows = r.factors.map(c=>`<div class="factor-row ${c.active?'':'off'}"><b>${(0,common_1.esc)(c.name)}${c.selfWeight?' + self-weight':''}</b><span>${c.active?(0,common_1.fmt)(c.factor,3)+'×':'off'}</span><small>${c.actions} action${c.actions===1?'':'s'}</small></div>`).join('');
    const combos = (m.combinations||[]).length ? `<div class="design-combos"><span class="eyebrow">SAVED MANUAL FACTOR SETS</span>${m.combinations.map(c=>(0,common_1.button)('design-combination:'+c.id,(0,common_1.esc)(c.name),'secondary')).join('')}</div>` : '';
    const readiness = r.readiness.map(row=>`<div class="design-ready-row ${row.state}"><i>${row.state==='ready'?'✓':row.state==='missing'?'!':'·'}</i><div><b>${(0,common_1.esc)(row.label)}</b><small>${(0,common_1.esc)(row.detail)}</small></div></div>`).join('');
    const standards = design_1.referenceBasis.map(row=>`<article class="design-standard"><span>${(0,common_1.esc)(row.label)}</span><b>${(0,common_1.esc)(row.title)}</b><small>${(0,common_1.esc)(row.source)}</small><a href="${row.url}" target="_blank" rel="noopener noreferrer">Public NCC reference</a></article>`).join('');
    const governing = r.governing ? `${(0,common_1.esc)(r.governing.label)} / ${(0,common_1.fmt)(r.governing.ratio,3)}` : 'No entered checks yet';
    const sourceLine = s.capacitySource ? `<span class="design-source-note"><b>Recorded source:</b> ${(0,common_1.esc)(s.capacitySource)}</span>` : '';
    const steppedRows = (r.section.steppedRegions || []).map(row => `<div class="design-step-section-row"><div><b>${(0,common_1.esc)(row.label)}</b><small>${(0,common_1.fmt)(row.x_m,2)} → ${(0,common_1.fmt)(row.end_m,2)} m · ${(0,common_1.esc)(row.section)}</small></div><span>EI ${(0,common_1.fmt)(row.EI_kNm2/1000,3)} MN·m²</span><small>Ix ${Number(row.I_mm4).toExponential(3)} mm⁴ · h ${(0,common_1.fmt)(row.depth_mm,1)} mm · SW ${(0,common_1.fmt)(row.selfWeight_kNm,3)} kN/m</small></div>`).join('');

    const workflow = (0, design_workflow_1.renderHeader)(designStep);
    const navigation = (0, design_workflow_1.renderNavigation)(designStep);
    const finishCard = (0, design_workflow_1.renderFinishCard)(m, r, governing, sourceLine, !!(v.session?.active&&v.session.mode==='exam'));
    root.innerHTML = `<section class="design-hero"><span class="eyebrow">BEAMLAB 4.1 / DESIGN STUDIO</span><h2>Carry verified analysis demand into a transparent design review.</h2><p>BeamLab solves the member first, then compares that deterministic demand with capacities and serviceability criteria that <b>you</b> enter from a verified source. It does not yet derive AS 4100 member capacity, classify sections or generate AS/NZS load combinations.</p><div class="design-hero-actions">${(0,common_1.button)('review-overview','← Review overview','secondary')}</div><span class="design-beta"><i></i>SCREENING REVIEW · NOT CODE APPROVAL OR STRUCTURAL DESIGN APPROVAL</span></section>
    <section class="design-workflow">${workflow}
    <div class="design-grid" data-design-step="${designStep}"><aside class="design-inputs"><section class="design-card violet design-step-card design-step-2"><span class="eyebrow">ENTERED CAPACITY BASIS</span><h3>Bring your verified capacities.</h3><p>Enter final design capacities from your own checked calculation, standard workflow or trusted design software. BeamLab only forms demand/capacity ratios.</p>${designNumberField('momentCapacity','Bending design capacity |φMb|',s.momentCapacity,'kN·m',.001,1e9,'e.g. 180')}${designNumberField('shearCapacity','Shear design capacity |φVv|',s.shearCapacity,'kN',.001,1e9,'e.g. 250')}<label class="design-field"><span>Serviceability criterion</span><select data-design-select="deflectionMode" aria-label="Serviceability criterion"><option value="unset" ${s.deflectionMode==='unset'?'selected':''}>Not set</option><option value="ratio" ${s.deflectionMode==='ratio'?'selected':''}>Span ratio L / n</option><option value="direct" ${s.deflectionMode==='direct'?'selected':''}>Direct displacement</option></select><em>criterion</em></label>${s.deflectionMode==='ratio'?designNumberField('serviceSpanM','Reference span',s.serviceSpanM ?? m.length,'m',.001,1e5,'member length')+designNumberField('deflectionRatio','Limit denominator n',s.deflectionRatio,'L/n',1,1e6,'250'):s.deflectionMode==='direct'?designNumberField('deflectionLimitMm','Displacement limit',s.deflectionLimitMm,'mm',.001,1e6,'e.g. 20'):''}<div class="design-input-note">Deflection demand uses the <b>current active load factors</b>. Apply an independently verified serviceability factor set before treating this as a serviceability review.</div></section>
    <section class="design-card design-step-card design-step-2"><span class="eyebrow">ELASTIC REFERENCE</span><h3>First yield, not design capacity.</h3><p>Optionally enter a yield stress to compare the elastic bending demand with the mechanics reference My = fyI/c. BeamLab deliberately keeps this separate from φMb.</p>${designNumberField('fyMPa','Yield stress fy',s.fyMPa,'MPa',.001,1e6,'e.g. 300')}<div id="design-elastic-reference">${designElasticReference(r)}</div></section>
    <section class="design-card design-step-card design-step-2"><span class="eyebrow">TRACEABILITY</span><h3>Record where the numbers came from.</h3><textarea class="design-textarea" data-design-text="capacitySource" maxlength="240" placeholder="Capacity source, calculation reference, clause, software run...">${(0,common_1.esc)(s.capacitySource)}</textarea><textarea class="design-textarea" data-design-text="notes" maxlength="1000" placeholder="Design assumptions, restraint notes, combination basis, outstanding checks...">${(0,common_1.esc)(s.notes)}</textarea><div class="design-source-note">These notes are stored locally and included in the Design Review JSON. They do not modify the structural model.</div>${(0,common_1.button)('design-reset','Reset design inputs','text-button')}</section></aside>
    <div class="design-output"><section class="design-card design-step-card design-step-1"><span class="eyebrow">DEMAND / CURRENT SOLVED FACTOR SET</span><h3>Deterministic analysis carried into design context.</h3><div class="design-demand-grid"><article class="design-demand"><span>Peak |M*|</span><b>${(0,common_1.fmt)(d.moment,3)} kN·m</b><small>x = ${(0,common_1.fmt)(d.momentX,3)} m</small><button data-action="design-jump:moment" aria-label="Inspect critical moment in Analysis"></button></article><article class="design-demand"><span>Peak |V*|</span><b>${(0,common_1.fmt)(d.shear,3)} kN</b><small>x = ${(0,common_1.fmt)(d.shearX,3)} m</small><button data-action="design-jump:shear" aria-label="Inspect critical shear in Analysis"></button></article><article class="design-demand"><span>Peak |v|</span><b>${(0,common_1.fmt)(d.deflectionMm,3)} mm</b><small>x = ${(0,common_1.fmt)(d.deflectionX,3)} m</small><button data-action="design-jump:deflection" aria-label="Inspect critical deflection in Analysis"></button></article><article class="design-demand ${d.elasticStressMPa===null?'unavailable':''}"><span>Elastic fibre stress</span><b>${d.elasticStressMPa===null?'NOT INFERRED':(0,common_1.fmt)(d.elasticStressMPa,3)+' MPa'}</b><small>${d.elasticStressMPa===null?'EI-only zones do not define local section geometry':r.section.hasTrueSteppedSections?'governing local section · x '+(0,common_1.fmt)(d.elasticStressX,3)+' m · '+(0,common_1.esc)(d.elasticStressSection):'from current M and I/c'}</small></article></div><div class="design-signed"><div><span>Moment + / −</span><b>${(0,common_1.signed)(d.momentPositive,2)} / ${(0,common_1.signed)(d.momentNegative,2)} kN·m</b></div><div><span>Shear + / −</span><b>${(0,common_1.signed)(d.shearPositive,2)} / ${(0,common_1.signed)(d.shearNegative,2)} kN</b></div></div></section>
    <section class="design-card design-step-card design-step-3"><span class="eyebrow">ENTERED CHECKS</span><h3>Demand divided by the criteria you supplied.</h3><div class="design-ratio-list">${r.checks.map(designRatioCard).join('')}</div><div class="design-governing"><span>Governing entered-check ratio</span><b>${governing}</b></div>${sourceLine}<div class="design-warning">A ratio below 1.0 only means BeamLab demand is below the <b>entered</b> capacity/limit. It does not prove AS 4100 compliance, structural adequacy or project approval.</div></section>
    <section class="design-card design-step-card design-step-1"><span class="eyebrow">SECTION & MEMBER CONTEXT</span><h3>${(0,common_1.esc)(r.section.label)}${r.section.hasTrueSteppedSections?' + true stepped sections':''}${r.section.hasEIOnlyOverrides?' + EI-only overrides':''}</h3><div class="design-section-grid"><article><span>${r.section.hasTrueSteppedSections||r.section.hasEIOnlyOverrides?'E / base':'E'}</span><b>${(0,common_1.fmt)(r.section.E_GPa,3)} GPa</b></article><article><span>${r.section.hasTrueSteppedSections||r.section.hasEIOnlyOverrides?'Ix / base':'Ix'}</span><b>${Number(r.section.I_mm4).toExponential(3)} mm⁴</b></article><article><span>${r.section.hasTrueSteppedSections||r.section.hasEIOnlyOverrides?'Area / base':'Area'}</span><b>${(0,common_1.fmt)(r.section.A_mm2,1)} mm²</b></article><article><span>${r.section.hasTrueSteppedSections?'True regions':r.section.hasEIOnlyOverrides?'EI zones':'c'}</span><b>${r.section.hasTrueSteppedSections?(r.section.steppedRegions?.length || 0):r.section.hasEIOnlyOverrides?(r.section.stiffnessZones?.length || 0):(0,common_1.fmt)(r.section.c_mm,2)+' mm'}</b></article></div>${r.section.hasTrueSteppedSections?`<div class="design-stepped-sections"><span class="eyebrow">LOCAL SECTION PROFILE</span>${steppedRows}</div><div class="design-input-note">BeamLab uses these local E/I/A/depth/density properties for deterministic member response and elastic stress. User-entered member capacities remain external inputs and must be verified for every relevant region.</div>`:''}${r.section.hasEIOnlyOverrides?`<div class="design-warning">EI-only multipliers change analysis stiffness without defining local geometry. Local elastic stress and first-yield references are deliberately unavailable while an EI-only override is active.</div>`:''}<p class="design-source-note">${m.section.catalogue?'Base catalogue geometry/area/Ix comes from the existing BeamLab InfraBuild reference library. The library is not a design-capacity database.':'Base section properties come from the BeamLab section model.'}</p></section>
    <section class="design-card design-step-card design-step-4"><span class="eyebrow">ACTION FACTOR LEDGER</span><h3>Exactly what produced this response.</h3><p>Current BeamLab factors are shown without implying a standard combination. Change or apply factors deliberately in Analysis / Cases.</p><div class="factor-ledger">${factorRows}</div>${combos}${(0,levels_1.canUseFeature)(activity.toolLevel(v),'cases')?(0,common_1.button)('design-edit-cases','Edit cases & factors in Analysis','wide-button'):''}</section>
    <section class="design-card design-step-card design-step-4"><span class="eyebrow">DESIGN READINESS</span><h3>What is known, entered, and still missing.</h3><div class="design-readiness">${readiness}</div></section>
    <section class="design-card violet design-step-card design-step-5"><span class="eyebrow">PUBLIC REFERENCE BASIS INSPECTED FOR 4.0</span><h3>Australian design context, without pretending the clauses are implemented.</h3><div class="design-standards">${standards}</div><div class="design-warning">The linked NCC schedule identifies the editions above. BeamLab 4.0 does not reproduce proprietary standard clauses or derive their member capacities/load combinations. Verify the applicable NCC edition, jurisdiction, amendments, project basis and purchased standards before real design work.</div></section>${finishCard}</div></div>${navigation}</section>`;
}
function setWorkspaceMode(mode) {
    if (!['analysis','design'].includes(mode)) return;
    if ((v.session?.active || v.session?.review) && mode === 'design') { toast('Finish or close the learning session before opening Design Studio.'); return; }
    finishField();
    endStandaloneLearning();
    v.workspaceMode = mode;
    render();
    $('#workspace').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' });
}
function setDesignStep(step, scroll = true) {
    designStep = (0, design_workflow_1.clampStep)(step);
    saveDesignStep();
    renderDesignStudio();
    if (scroll) $('#design-studio')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' });
}
function updateDesignInput(el, redraw = false) {
    const numberKey = el.dataset.designNumber, selectKey = el.dataset.designSelect, textKey = el.dataset.designText;
    if (numberKey) {
        const raw = el.value.trim(), n = Number(raw);
        const valid = raw && Number.isFinite(n) && n > 0 && el.validity.valid;
        designSettings[numberKey] = valid ? n : null;
        if (raw && !valid) el.setAttribute('aria-invalid', 'true');
        else el.removeAttribute('aria-invalid');
    } else if (selectKey) {
        designSettings[selectKey] = el.value;
    } else if (textKey) {
        designSettings[textKey] = el.value.slice(0, textKey === 'capacitySource' ? 240 : 1000);
    } else return;
    designSettings = (0, design_1.normaliseSettings)(designSettings);
    saveDesignSettings();
    // Save while typing; replacing the inputs on blur loses the next click or
    // keyboard focus. Only a select changes which criteria fields are present.
    if (redraw) renderDesignStudio();
    else {
        const reference = $('#design-elastic-reference');
        if (reference && analysis) reference.innerHTML = designElasticReference((0, design_1.evaluate)(history.model, analysis, designSettings));
    }
}
function render() {
    updateFocusControl();
    solve();
    const m = history.model;
    renderLearningBar();
    renderWorkspaceModeBar();
    const designMode = v.workspaceMode === 'design';
    const phase = workspace.phaseFor(v);
    $('#mobile-tools').hidden = designMode || phase === 'learn';
    $('#mobile-tools').innerHTML = `<button data-action="controls" aria-controls="controls" aria-expanded="${v.controls}"><span>${phase==='analyse'?'Response layers':'Model tools'}</span><b>${v.controls?'Close tools ↑':'Open tools ↓'}</b></button>`;
    $('#workspace-grid').hidden = designMode;
    $('#design-studio').hidden = !designMode;
    document.querySelector('.workspace-foot')?.classList.toggle('design-active', designMode);
    const restricted = (0, levels_1.restrictedStudyFeatures)(activity.toolLevel(v), m, v);
    $('#level-notice').hidden = !restricted.length;
    $('#level-notice').innerHTML = restricted.length ? `<span>${(0, common_1.icon)('help', 14)}</span><div><b>This study goes beyond ${(0, common_1.esc)((0, levels_1.mode)(v.level).short)}.</b><p>${(0, common_1.esc)(restricted.join(', '))} remain active in the calculation but some editing controls are hidden.</p></div>${(0, common_1.button)('level:all', 'Show all tools', 'secondary')}` : '';
    const inspectorVisible = v.inspector && v.selected.size > 0 && !designMode && !activity.modelLocked(v) && !inlineId;
    $('#workspace-grid').classList.toggle('controls-hidden', !v.controls && !inspectorVisible);
    $('#workspace-grid').classList.toggle('inspector-hidden', !inspectorVisible);
    $('#workspace-grid').classList.toggle('editing-object', inspectorVisible);
    $('#controls').hidden = !v.controls || inspectorVisible;
    $('#inspector').hidden = !inspectorVisible;
    v.masteryView = buildMasteryView(v.level);
    const learningSnapshot = learningEvidenceSnapshot();
    v.learningRecommendation = (0, learning_path_1.recommendNext)(v.level, learningSnapshot, lessonProgress, challengeProgress);
    v.learningTrajectory = (0, learning_trajectory_1.build)(learningEvidenceEvents, masteryStats, 6);
    const planningTrajectory = (0, learning_trajectory_1.build)(learningEvidenceEvents, masteryStats, 10);
    v.learningStudyPlan = (0, study_plan_1.build)(
        v.level,
        { ...learningSnapshot, recentEvents:learningEvidenceEvents },
        planningTrajectory,
        lessonProgress,
        challengeProgress,
        masteryStats
    );
    $('#controls').innerHTML = `<div class="mobile-tools-close"><span>${phase==='analyse'?'Response layers':'Model tools'}</span><button data-action="controls">Done with tools</button></div>` + (0, panels_1.toolsPanel)(m, v);
    syncSessionClock();
    $('#inspector').innerHTML = (0, panels_1.inspectorPanel)(m, analysis, v);
    $('#inspector').classList.toggle('has-selection', v.selected.size > 0);
    $('#mobile-done').hidden = true;
    $('#toolbar').innerHTML = `<div class="stage-title"><i class="dot ${analysis ? 'mint' : 'amber'}"></i><div><h2>${analysis ? (0, common_1.esc)(analysis.system) : 'Model needs attention'}</h2><small>${(0, common_1.esc)(m.name)}</small></div></div><div class="toolbar-buttons">${(0, common_1.button)('undo', (0, common_1.icon)('undo'), 'icon-button', activity.modelLocked(v) || !history.past.length, 'Undo (Ctrl/Cmd Z)')}${(0, common_1.button)('redo', (0, common_1.icon)('redo'), 'icon-button', activity.modelLocked(v) || !history.future.length, 'Redo (Ctrl/Cmd Shift Z)')}<i class="toolbar-separator"></i>${(0, common_1.button)('compare', (0, common_1.icon)('compare'), 'icon-button ' + (compareModel ? 'active' : ''), !visibility().complete || (!analysis && !compareModel), compareModel ? 'Clear comparison' : 'Freeze comparison')}${(0, common_1.button)('shortcuts', (0, common_1.icon)('help', 14), 'icon-button', false, 'Quick help (?)')}${(0, common_1.button)('ai-open', '<span class="ai-glyph">✦</span>', 'icon-button ai-launch', !visibility().complete, 'Ask BeamLab contextual tutor')}${(0, common_1.button)('controls', (0, common_1.icon)('menu'), 'icon-button ' + (!v.controls ? 'active' : ''), false, 'Toggle controls')}${(0, common_1.button)('inspector', (0, common_1.icon)('settings'), 'icon-button ' + (!v.inspector ? 'active' : ''), !v.selected.size || activity.modelLocked(v), v.selected.size ? 'Toggle selected-object editor' : 'Select a support or load to edit')}</div>`;
    width = Math.max(280, $('#graphs').getBoundingClientRect().width || width);
    renderStage();
    renderExtras();
    $('#study-name').innerHTML = `<input aria-label="Study name" data-text="name" maxlength="100" ${activity.modelLocked(v) ? 'readonly' : ''} value="${(0, common_1.esc)(m.name)}">`;
    $('#history-count').textContent = history.past.length + ' edits';
    if (designMode) renderDesignStudio();
    renderDemo();
}
function saveChallengeProgress() {
    try { localStorage.setItem(storageKey + ':challenges', JSON.stringify(challengeProgress)); v.progressStorageAvailable = true; }
    catch { v.progressStorageAvailable = false; }
}
function startChallenge(id) {
    const spec = (0, challenges_1.getChallenge)(id);
    if (!spec) { toast('Challenge not found.'); return; }
    if (!sessionLoading && activity.modelLocked(v)) return;
    beginStandaloneLearning();
    v.changedActivity = null; v.activityMismatch = false;
    v.lessonId = null; v.lessonChoice = null; v.lessonFeedback = null;
    v.lessonSketch = []; v.lessonSketchResult = null; v.lessonSketchReference = false; v.lessonSketchReferencePoints = [];
    v.tab = 'learn';
    loadExample(spec.example);
    v.challengeId = spec.id;
    v.challengeModelReference = verification.fingerprint(history.model);
    v.changedActivity = null;
    v.challengeFeedback = null;
    v.taskAttempted = false; v.taskMasteryLocked = false;
    v.practice = true;
    v.practiceStep = 0;
    solve(); render(); save();
    focusLearningActivity();
}
function currentChallenge() { return v.challengeId ? (0, challenges_1.getChallenge)(v.challengeId) : null; }
function saveLessonProgress() {
    try { localStorage.setItem(storageKey + ':lessons', JSON.stringify(lessonProgress)); v.progressStorageAvailable = true; }
    catch { v.progressStorageAvailable = false; }
}
function startLesson(id) {
    const spec = (0, challenges_1.getLesson)(id);
    if (!spec) { toast('Lesson not found.'); return; }
    if (!sessionLoading && activity.modelLocked(v)) return;
    beginStandaloneLearning();
    v.changedActivity = null; v.activityMismatch = false;
    v.tab = 'learn';
    loadExample(spec.example);
    v.challengeId = null; v.challengeFeedback = null;
    v.lessonId = spec.id; v.lessonChoice = null; v.lessonFeedback = null;
    v.taskAttempted = false; v.taskMasteryLocked = false;
    v.lessonMethod = 'choice'; v.lessonSketch = []; v.lessonSketchResult = null; v.lessonSketchReference = false; v.lessonSketchReferencePoints = [];
    v.lessonModelReference = verification.fingerprint(history.model);
    v.changedActivity = null;
    if (spec.target === 'v' && (0, levels_1.canUseFeature)(activity.toolLevel(v), 'deformation')) v.deformation = true;
    v.practice = true;
    v.practiceStep = Math.max(0, (spec.revealStep || 2) - 1);
    solve(); render(); save();
    focusLearningActivity();
}
function beginStandaloneLearning() {
    if (sessionLoading || v.session?.active || v.session?.review || standaloneOrigin) return;
    finishField();
    save();
    standaloneOrigin = captureSessionOrigin();
    v.standaloneLearning = true;
}
function endStandaloneLearning() {
    if (!standaloneOrigin) return false;
    finishField();
    const origin = standaloneOrigin;
    const preferences = {level:v.level, teachMe:v.teachMe, learnSection:v.learnSection};
    standaloneOrigin = null;
    v.standaloneLearning = false; v.changedActivity = null; v.activityMismatch = false;
    applySessionOrigin(origin);
    Object.assign(v, preferences);
    v.changedActivity = null;
    v.lessonId = null; v.challengeId = null; v.lessonFeedback = null; v.challengeFeedback = null;
    v.lessonModelReference = null; v.challengeModelReference = null;
    v.lessonChoice = null; v.lessonSketch = []; v.lessonSketchResult = null;
    v.lessonSketchReference = false; v.lessonSketchReferencePoints = [];
    return true;
}
function openUserStudy(model, label) {
    if (v.session?.active || v.session?.review) {
        toast('Finish or close the learning session before opening another study.');
        return false;
    }
    finishField();
    if (endStandaloneLearning()) {
        // An explicit import replaces the original engineering study, not the
        // temporary exercise. Undo therefore returns to that original study.
        v.workspaceMode = 'analysis';
        v.tab = 'build';
        v.practice = false;
        v.controls = !matchMedia('(max-width:780px)').matches;
    }
    v.zoom = 1; v.pan = 0;
    commit(model, label, false);
    return true;
}
function focusLearningActivity() {
    if (sessionLoading) return;
    const activity = $('#controls .activity-navigation') || $('#controls .lesson-active') || $('#controls .challenge-active');
    if (!activity) return;
    activity.setAttribute('tabindex', '-1');
    activity.focus({preventScroll:true});
    activity.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}
function currentLesson() { return v.lessonId ? (0, challenges_1.getLesson)(v.lessonId) : null; }
function saveMasteryStats() {
    v.masteryStats = masteryStats;
    try { localStorage.setItem(storageKey + ':mastery', JSON.stringify(masteryStats)); v.progressStorageAvailable = true; }
    catch { v.progressStorageAvailable = false; }
}
function learningTransferDialog() {
    if(v.session?.active||v.session?.review){toast('Finish or close the learning session before transferring progress.');return;}
    openDialog('Keep your learning progress', `<p>Save progress before changing devices. This file contains completed activities, topic counters and the last 24 learning events. Your beam, design inputs and active sessions are separate.</p><div class="dialog-actions"><button class="primary" data-action="progress-export">Download progress JSON</button><button class="secondary" data-action="progress-import">Choose progress file</button></div><p class="hint">Importing shows a preview before replacing local progress. It never changes your beam or learning level.</p>`);
}
async function previewLearningImport(file) {
    try {
        if(!file||file.size>100000) throw new Error('Choose a progress JSON smaller than 100 kB.');
        pendingLearningImport=learningTransfer.parse(await file.text());
        const counts=learningTransfer.summary(pendingLearningImport);
        openDialog('Review learning-progress import', `<p>This file contains <b>${counts.lessons} completed lessons</b>, <b>${counts.challenges} completed challenges</b>, ${counts.topics} topic records and ${counts.events} recent events.</p><p>Replacing progress also discards any saved, unfinished study block. Download your current progress first if you want to keep it.</p><div class="dialog-actions"><button data-action="progress-export" class="secondary">Back up current progress</button><button data-action="progress-import-confirm" class="primary">Replace learning progress</button><button data-action="dialog-close" class="secondary">Cancel</button></div>`);
    } catch(e) {pendingLearningImport=null;toast(e.message||'Progress could not be imported.');}
}
function recordMastery(kind, spec, correct, lockAfter = false) {
    if (!spec || v.taskMasteryLocked) return;
    const topic = (0, challenges_1.topicForTask)(kind, spec.id);
    const firstTry = !v.taskAttempted;
    masteryStats[topic] = (0, challenges_1.updateMastery)(masteryStats[topic], !!correct, firstTry);
    if (!v.session?.active) recordLearningEvidence({
        event:'attempt', kind, taskId:spec.id, taskTitle:spec.title, topic,
        correct:!!correct, firstTry, tries:firstTry ? 1 : 2, mode:'standalone'
    });
    v.taskAttempted = true;
    if (correct || lockAfter) v.taskMasteryLocked = true;
    saveMasteryStats();
}
function recordReveal(kind, spec) {
    if (!spec) return;
    const topic = (0, challenges_1.topicForTask)(kind, spec.id), prev = masteryStats[topic] || {};
    masteryStats[topic] = { ...prev, reveals: (prev.reveals || 0) + 1, lastAt: Date.now() };
    if (!v.session?.active) recordLearningEvidence({ event:'reveal', kind, taskId:spec.id, taskTitle:spec.title, topic, mode:'standalone' });
    saveMasteryStats();
}
function buildMasteryView(level = v.level) {
    const tasks = [
        ...(0, challenges_1.listLessons)(level).map(spec => ({kind:'lesson',id:spec.id,title:spec.title,topic:(0,challenges_1.topicForTask)('lesson',spec.id)})),
        ...(0, challenges_1.listChallenges)(level).map(spec => ({kind:'challenge',id:spec.id,title:spec.title,topic:(0,challenges_1.topicForTask)('challenge',spec.id)}))
    ];
    const grouped = new Map();
    for (const task of tasks) {
        if (!grouped.has(task.topic)) grouped.set(task.topic, { topic:task.topic, tasks:[] });
        grouped.get(task.topic).tasks.push(task);
    }
    return [...grouped.values()].map(row => {
        const stat = masteryStats[row.topic] || {};
        return { ...row, score:(0,challenges_1.masteryScore)(stat), attempts:stat.attempts||0, firstAttempts:stat.firstAttempts||0, firstCorrect:stat.firstCorrect||0, correct:stat.correct||0, reveals:stat.reveals||0, recommendation:row.tasks[0] };
    }).sort((a,b) => (a.score ?? 50) - (b.score ?? 50) || a.attempts - b.attempts || a.topic.localeCompare(b.topic));
}
function captureSessionOrigin() {
    const viewKeys = ['workspaceMode','reviewDetail','tab','level','teachMe','advanced','annotations','annotationMode','deformation','stress','shear','moving','teaching','practice','practiceStep','learnSection','controls','inspector','snap','zoom','pan','step','working','trace','pinned','currentCase','review'];
    const view = Object.fromEntries(viewKeys.map(k => [k, v[k]]));
    view.selected = [...v.selected];
    return {
        model:(0, study_1.clone)(history.model),
        past:history.past.map(e=>({model:(0,study_1.clone)(e.model),label:e.label})),
        future:history.future.map(e=>({model:(0,study_1.clone)(e.model),label:e.label})),
        compareModel:compareModel ? (0,study_1.clone)(compareModel) : null,
        levelStarterActive,
        view
    };
}
function applySessionOrigin(origin) {
    if (!origin?.model) return false;
    history.model = (0, study_1.clone)(origin.model);
    history.past = Array.isArray(origin.past) ? origin.past.map(e=>({model:(0,study_1.clone)(e.model),label:e.label})) : [];
    history.future = Array.isArray(origin.future) ? origin.future.map(e=>({model:(0,study_1.clone)(e.model),label:e.label})) : [];
    compareModel = origin.compareModel ? (0,study_1.clone)(origin.compareModel) : null;
    levelStarterActive = !!origin.levelStarterActive;
    if (origin.view && typeof origin.view === 'object') Object.assign(v, origin.view);
    v.selected = new Set(origin.view?.selected || []);
    layout = undefined;
    solve();
    return true;
}
function restoreSessionOrigin(session = v.session) {
    const origin = session?.origin;
    if (!origin) { v.session = null; render(); return; }
    applySessionOrigin(origin);
    v.session = null; v.activityMismatch = false; v.changedActivity = null; v.lessonId = null; v.challengeId = null; v.lessonFeedback = null; v.challengeFeedback = null;
    v.lessonSketch = []; v.lessonSketchResult = null; v.lessonSketchReference = false; v.lessonSketchReferencePoints = [];
    render(); save();
}
function formatElapsed(ms) {
    const sec = Math.max(0, Math.floor(ms / 1000)), m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}
function updateSessionClock() {
    const el = $('#session-clock');
    if (el && v.session?.active) el.textContent = formatElapsed(Date.now() - v.session.startedAt);
}
function syncSessionClock() {
    if (sessionClockHandle) { clearInterval(sessionClockHandle); sessionClockHandle = null; }
    if (v.session?.active) { updateSessionClock(); sessionClockHandle = setInterval(updateSessionClock, 1000); }
}
function currentGuidedStudyPlan() {
    const snapshot = learningEvidenceSnapshot();
    const trajectory = (0, learning_trajectory_1.build)(learningEvidenceEvents, masteryStats, 10);
    const plan = (0, study_plan_1.build)(v.level, { ...snapshot, recentEvents:learningEvidenceEvents }, trajectory, lessonProgress, challengeProgress, masteryStats);
    return { snapshot, trajectory, plan };
}
function guidedMixedPool(snapshot, excludeIds = [], count = 7) {
    return (0, adaptive_practice_1.planPractice)(
        v.level, snapshot, lessonProgress, challengeProgress, masteryStats,
        { count, excludeIds }
    );
}
function resumeGuidedStudyBlock() {
    const saved = (0, study_block_resume_1.normalise)(studyBlockResume);
    if (!saved || v.session?.active || v.session?.review) {
        if (!saved) clearGuidedStudyBlockResume();
        return;
    }
    endStandaloneLearning();
    if (!applySessionOrigin(saved.session.origin)) {
        clearGuidedStudyBlockResume();
        toast('The saved study block could not restore its original study.');
        render();
        return;
    }
    if (levels_1.modes[saved.level]) v.level = saved.level;
    const completed = (0, study_block_resume_1.completedCount)(saved);
    const stored = saved.session;
    const s = {
        active:true, review:false, mode:'plan',
        queue:stored.queue.map(task => ({...task})),
        index:0,
        results:stored.results.slice(0, completed),
        startedAt:Date.now() - saved.elapsedMs,
        finishedAt:null,
        currentLocked:false,
        origin:stored.origin,
        adaptive:true,
        targetCount:stored.targetCount || stored.queue.length,
        planRevision:stored.planRevision || 0,
        focusTarget:stored.focusTarget || 0,
        mixedTarget:stored.mixedTarget || 4,
        phaseTotal:stored.phaseTotal || 1,
        initialTrajectory:stored.initialTrajectory,
        studyPlanRationale:stored.studyPlanRationale || '',
        studyBlockReview:null
    };
    v.session = s;
    v.tab = 'learn';
    v.learnSection = 'session';
    const current = currentGuidedStudyPlan();
    if (completed === 0) {
        const focusIds = current.plan.steps.filter(step => step.kind === 'lesson' || step.kind === 'challenge').slice(0,3).map(step => step.id);
        const mixedPool = guidedMixedPool(current.snapshot, focusIds, 7);
        const rebuilt = (0, study_block_1.buildQueue)(current.plan, mixedPool, { focusTarget:stored.focusTarget || 3, mixedTarget:stored.mixedTarget || 4 });
        s.queue = rebuilt.queue;
        s.focusTarget = rebuilt.focusTarget;
        s.mixedTarget = rebuilt.mixedTarget;
        s.phaseTotal = rebuilt.phaseTotal;
        s.targetCount = rebuilt.queue.length;
        s.planRevision += 1;
    } else {
        s.index = completed - 1;
        replanGuidedStudyBlock(s);
    }
    if (completed >= s.queue.length) {
        s.index = Math.max(0, s.queue.length - 1);
        finishLearningSession();
        return;
    }
    s.index = completed;
    s.currentLocked = false;
    loadSessionTask();
    persistGuidedStudyBlock();
    toast('Guided study block resumed. Time away from the tab was not counted.');
}
function startLearningSession(mode) {
    if (v.session?.active || v.session?.review) return;
    finishField();
    endStandaloneLearning();
    const sessionMode = mode === 'exam' ? 'exam' : mode === 'plan' ? 'plan' : 'practice';
    let queue = [], focusTarget = 0, mixedTarget = 0, phaseTotal = 0, initialTrajectory = null, studyPlanRationale = '';
    if (sessionMode === 'plan') {
        const current = currentGuidedStudyPlan();
        const focusIds = current.plan.steps.filter(step => step.kind === 'lesson' || step.kind === 'challenge').slice(0,3).map(step => step.id);
        const mixedPool = guidedMixedPool(current.snapshot, focusIds, 7);
        const built = (0, study_block_1.buildQueue)(current.plan, mixedPool, { focusTarget:3, mixedTarget:4 });
        queue = built.queue;
        focusTarget = built.focusTarget;
        mixedTarget = built.mixedTarget;
        phaseTotal = built.phaseTotal;
        initialTrajectory = current.trajectory;
        studyPlanRationale = current.plan.rationale || '';
    } else if (sessionMode === 'practice') {
        queue = (0, adaptive_practice_1.planPractice)(v.level, learningEvidenceSnapshot(), lessonProgress, challengeProgress, masteryStats, { count:4 });
    } else {
        queue = (0, challenges_1.sessionPlan)(v.level, masteryStats, 'exam');
    }
    if (!queue.length) { toast('No practice tasks are available at this learning level.'); return; }
    v.session = {
        active:true, review:false, mode:sessionMode, queue, index:0, results:[],
        startedAt:Date.now(), finishedAt:null, currentLocked:false, origin:captureSessionOrigin(),
        adaptive:sessionMode === 'practice' || sessionMode === 'plan',
        targetCount:queue.length, planRevision:0,
        focusTarget, mixedTarget, phaseTotal, initialTrajectory, studyPlanRationale, studyBlockReview:null
    };
    v.learnSection = 'session';
    loadSessionTask();
    if (sessionMode === 'plan') persistGuidedStudyBlock();
}
function loadSessionTask() {
    const s = v.session;
    if (!s?.active) return;
    const task = s.queue[s.index];
    if (!task) { finishLearningSession(); return; }
    s.currentLocked = false;
    v.workspaceMode = 'analysis'; v.tab = 'learn'; v.controls = true;
    inlineId = null; $('#inline-edit').innerHTML = '';
    sessionLoading = true;
    try {
        if (task.kind === 'lesson') { startLesson(task.id); if (s.mode === 'exam') v.lessonMethod = 'sketch'; }
        else { v.lessonId = null; v.lessonChoice = null; v.lessonFeedback = null; v.lessonSketch = []; v.lessonSketchResult = null; startChallenge(task.id); }
    } finally { sessionLoading = false; }
    v.selected.clear();
    s.questionModel = (0, study_1.clone)(history.model);
    s.questionReference = verification.fingerprint(history.model);
    v.activityMismatch = false;
    v.learnSection = 'session';
    if (s.mode === 'exam') { v.teaching = false; v.practice = true; }
    render();
    if (s.mode === 'plan') persistGuidedStudyBlock();
}
function sessionExpectedLabel(spec, key) {
    return spec?.predict?.choices?.find(([id]) => id === key)?.[1] || key || 'Reference response';
}
function sessionTaskMeta(s) {
    const task = s?.queue?.[s.index] || {};
    return {
        blockRole: task.blockRole || '',
        studyPhase: Number(task.studyPhase) || null,
        studyPhaseTotal: Number(task.studyPhaseTotal) || null,
        phaseTitle: task.phaseTitle || '',
        mixedIndex: Number(task.mixedIndex) || null,
        mixedTotal: Number(task.mixedTotal) || null
    };
}
function sessionRecordAttempt(kind, spec, correct, answer, expected, extra = {}) {
    const s = v.session;
    if (!s?.active) return;
    let row = s.results[s.index];
    if (!row) row = {kind,id:spec.id,title:spec.title,topic:(0,challenges_1.topicForTask)(kind,spec.id),tries:0,firstCorrect:!!correct,correct:false,skipped:false,revealed:false,answer:'',expected:'',...sessionTaskMeta(s)};
    row.tries += 1;
    if (row.tries === 1) row.firstCorrect = !!correct;
    row.correct = row.correct || !!correct;
    row.answer = answer || row.answer;
    row.expected = expected || row.expected;
    Object.assign(row, sessionTaskMeta(s), extra);
    s.results[s.index] = row;
    recordLearningEvidence({
        event:'attempt', kind, taskId:spec.id, taskTitle:spec.title, topic:row.topic,
        correct:!!correct, firstTry:row.tries === 1, tries:row.tries,
        answer:answer || '', expected:expected || '',
        method:extra?.sketchScore !== undefined ? 'sketch' : kind === 'lesson' ? v.lessonMethod : 'calculation',
        mode:s.mode
    });
    if (s.mode === 'exam' || correct) { row.locked = true; s.currentLocked = true; }
    if (s.mode === 'plan') persistGuidedStudyBlock();
}
function sessionRecordReveal(kind, spec, expected) {
    const s = v.session;
    if (!s?.active || s.mode === 'exam') return;
    let row = s.results[s.index];
    if (!row) row = {kind,id:spec.id,title:spec.title,topic:(0,challenges_1.topicForTask)(kind,spec.id),tries:0,firstCorrect:false,correct:false,skipped:false,revealed:true,answer:'Revealed without a correct answer',expected,...sessionTaskMeta(s)};
    row.revealed = true; row.expected = expected || row.expected; row.locked = true; Object.assign(row, sessionTaskMeta(s)); s.results[s.index] = row; s.currentLocked = true;
    recordLearningEvidence({ event:'reveal', kind, taskId:spec.id, taskTitle:spec.title, topic:row.topic, expected:row.expected || '', mode:s.mode });
    if (s.mode === 'plan') persistGuidedStudyBlock();
}
function sessionSkipCurrent() {
    const s = v.session;
    if (!s?.active) return;
    const task = s.queue[s.index], spec = task.kind === 'lesson' ? (0,challenges_1.getLesson)(task.id) : (0,challenges_1.getChallenge)(task.id);
    let expected = 'Review after the session';
    try {
        if (task.kind === 'lesson' && spec && analysis) expected = sessionExpectedLabel(spec, (0,challenges_1.predictionFor)(spec,analysis,history.model));
        else if (spec && analysis) expected = (0,common_1.fmt)((0,challenges_1.answerFor)(spec,analysis),4) + ' ' + spec.unit;
    } catch {}
    s.results[s.index] = {kind:task.kind,id:task.id,title:task.title,topic:task.topic,tries:0,firstCorrect:false,correct:false,skipped:true,revealed:false,answer:'Left blank',expected,locked:true,...sessionTaskMeta(s)};
    recordLearningEvidence({ event:'skip', kind:task.kind, taskId:task.id, taskTitle:task.title, topic:task.topic, answer:'Left blank', expected, mode:s.mode });
    s.currentLocked = true;
    if (s.mode === 'plan') persistGuidedStudyBlock();
    sessionAdvance();
}
function replanGuidedStudyBlock(s) {
    const currentTask = s.queue[s.index];
    const current = currentGuidedStudyPlan();
    const seen = s.queue.slice(0, s.index + 1);
    const seenIds = seen.map(task => task.id);
    if (currentTask?.blockRole === 'mixed') {
        const mixedSeen = seen.filter(task => task.blockRole === 'mixed').length;
        const remaining = Math.max(0, (s.mixedTarget || 4) - mixedSeen);
        const mixed = remaining ? guidedMixedPool(current.snapshot, seenIds, Math.max(remaining, 4)) : [];
        s.queue = (0, study_block_1.replanMixedTail)(s.queue, s.index, mixed, {
            mixedTarget:s.mixedTarget || 4,
            phaseTotal:s.phaseTotal || currentTask.studyPhaseTotal || 1
        });
    } else {
        const pool = guidedMixedPool(current.snapshot, seenIds, Math.max((s.mixedTarget || 4) + (s.focusTarget || 0), 4));
        s.queue = (0, study_block_1.replanFocusTail)(s.queue, s.index, current.plan, pool, {
            focusTarget:s.focusTarget || 0,
            mixedTarget:s.mixedTarget || 4
        });
    }
    s.focusTarget = s.queue.filter(task => task.blockRole === 'focus').length;
    s.phaseTotal = s.queue.at(-1)?.studyPhaseTotal || s.phaseTotal || 1;
    s.planRevision = (s.planRevision || 0) + 1;
}
function sessionAdvance() {
    const s = v.session;
    if (!s?.active) return;
    const row = s.results[s.index];
    if (!row || !row.locked) { toast(s.mode === 'exam' ? 'Submit an answer or leave the question blank before continuing.' : 'Get it correct, reveal it, or skip this question before continuing.'); return; }
    if (s.mode === 'practice' && s.adaptive) {
        const seen = s.queue.slice(0, s.index + 1);
        const remainingCount = Math.max(0, (s.targetCount || 4) - seen.length);
        if (remainingCount > 0) {
            const tail = (0, adaptive_practice_1.planPractice)(
                v.level, learningEvidenceSnapshot(), lessonProgress, challengeProgress, masteryStats,
                { count:remainingCount, excludeIds:seen.map(task => task.id) }
            );
            s.queue = [...seen, ...tail];
            s.planRevision = (s.planRevision || 0) + 1;
        }
    } else if (s.mode === 'plan') {
        replanGuidedStudyBlock(s);
    }
    if (s.index >= s.queue.length - 1) { finishLearningSession(); return; }
    s.index += 1;
    if (s.mode === 'plan') persistGuidedStudyBlock();
    loadSessionTask();
}
function finishLearningSession() {
    const s = v.session;
    if (!s) return;
    if (s.mode === 'exam') {
        for (const row of s.results) if (row?.correct) {
            if (row.kind === 'lesson') lessonProgress[row.id] = true; else challengeProgress[row.id] = true;
        }
        saveLessonProgress(); saveChallengeProgress();
    }
    s.active = false; s.review = true; s.finishedAt = Date.now();
    if (s.mode === 'plan') {
        clearGuidedStudyBlockResume();
        const finalTrajectory = (0, learning_trajectory_1.build)(learningEvidenceEvents, masteryStats, 10);
        s.studyBlockReview = (0, study_block_1.review)(s.initialTrajectory, finalTrajectory, s.results, {
            startedAt:s.startedAt, finishedAt:s.finishedAt, planRevision:s.planRevision
        });
    }
    v.lessonId = null; v.challengeId = null; v.lessonFeedback = null; v.challengeFeedback = null; v.practice = false; v.learnSection = 'session';
    render();
}
function sessionReviewNext() {
    const rec = v.learningRecommendation;
    const old = v.session;
    restoreSessionOrigin(old);
    if (!rec) return;
    v.tab = 'learn';
    if (rec.kind === 'lesson') {
        v.learnSection = 'lessons';
        startLesson(rec.id);
    } else if (rec.kind === 'challenge') {
        v.learnSection = 'challenges';
        startChallenge(rec.id);
    } else if (rec.kind === 'session' && rec.id === 'practice') {
        v.learnSection = 'session';
        startLearningSession('practice');
    }
}
function sessionReviewPlanAgain() {
    const old = v.session;
    restoreSessionOrigin(old);
    v.tab = 'learn';
    v.learnSection = 'session';
    startLearningSession('plan');
}
function comparisonMetrics(a) {
    if (!a) return null;
    return { shear: Math.abs(a.peakV.V), moment: Math.abs(a.peakM.M), deflection: Math.abs(a.peakD.v) * 1000, EI: a.properties.EI / 1000, steppedSections:!!a.hasSectionRegions, eiOnly:!!a.hasEIOnlyRegions, sectionRegionCount:a.sectionRegions?.length || 0, stiffnessZoneCount:a.stiffnessRegions?.length || 0 };
}
function deltaText(a, b, unit) {
    const d = b - a, pct = Math.abs(a) > 1e-12 ? d / Math.abs(a) * 100 : null;
    return `${(0, common_1.signed)(d, 3)} ${unit}${pct === null ? '' : ` / ${(0, common_1.signed)(pct, 1)}%`}`;
}
function compareModelChanges(A, B) {
    const changes = [];
    const push = text => { if (changes.length < 8 && !changes.includes(text)) changes.push(text); };
    try {
        const aP = (0, sections_1.sectionProperties)(A.section), bP = (0, sections_1.sectionProperties)(B.section);
        if (Math.abs(aP.EI - bP.EI) > Math.max(1e-9, Math.abs(aP.EI) * 1e-9)) push('Flexural stiffness EI changed from ' + (0, common_1.fmt)(aP.EI / 1000, 3) + ' to ' + (0, common_1.fmt)(bP.EI / 1000, 3) + ' MN m².');
    } catch { /* Invalid section is already reported by the main solver. */ }
    const sectionSignature = r => [r.x,r.end,r.label,r.section?.catalogue||'',r.section?.material,r.section?.E,r.section?.density,r.section?.shape,r.section?.A,r.section?.I,r.section?.h,r.section?.b,r.section?.t,r.section?.tf];
    const aSections = JSON.stringify((A.sectionRegions || []).map(sectionSignature));
    const bSections = JSON.stringify((B.sectionRegions || []).map(sectionSignature));
    if (aSections !== bSections) push('True stepped-section profile changed (' + (A.sectionRegions?.length || 0) + ' → ' + (B.sectionRegions?.length || 0) + ' regions).');
    const aZones = JSON.stringify((A.stiffnessRegions || []).map(r => [r.x,r.end,r.factor]));
    const bZones = JSON.stringify((B.stiffnessRegions || []).map(r => [r.x,r.end,r.factor]));
    if (aZones !== bZones) push('Piecewise EI stiffness profile changed (' + (A.stiffnessRegions?.length || 0) + ' → ' + (B.stiffnessRegions?.length || 0) + ' zones).');
    if (!!A.selfWeight !== !!B.selfWeight) push('Self-weight was ' + (B.selfWeight ? 'enabled.' : 'disabled.'));
    const aCases = new Map((A.cases || []).map(c => [c.id, c])), bCases = new Map((B.cases || []).map(c => [c.id, c]));
    for (const [id, b] of bCases) { const a = aCases.get(id); if (a && (Math.abs(a.factor - b.factor) > 1e-10 || a.enabled !== b.enabled)) push('Load case ' + b.name + ' changed from ' + (a.enabled ? (0, common_1.fmt)(a.factor, 2) + '×' : 'off') + ' to ' + (b.enabled ? (0, common_1.fmt)(b.factor, 2) + '×.' : 'off.')); }
    const aItems = new Map(A.items.map(i => [i.id, i])), bItems = new Map(B.items.map(i => [i.id, i]));
    for (const [id, b] of bItems) {
        const a = aItems.get(id);
        if (!a) { push((b.label || examples_1.titles[b.kind]) + ' was added.'); continue; }
        const label = b.label || examples_1.titles[b.kind];
        if (Math.abs((a.x || 0) - (b.x || 0)) > 1e-8) push(label + ' moved from ' + (0, common_1.fmt)(a.x, 2) + ' to ' + (0, common_1.fmt)(b.x, 2) + ' m.');
        if ((0,validation_1.isSupport)(b.kind) && Math.abs((a.settlementMm || 0) - (b.settlementMm || 0)) > 1e-9) push(label + ' settlement changed from ' + (0,common_1.signed)(a.settlementMm || 0,2) + ' to ' + (0,common_1.signed)(b.settlementMm || 0,2) + ' mm (up +).');
        if (b.kind === 'fixed' && Math.abs((a.rotationMrad || 0) - (b.rotationMrad || 0)) > 1e-9) push(label + ' prescribed rotation changed from ' + (0,common_1.signed)(a.rotationMrad || 0,2) + ' to ' + (0,common_1.signed)(b.rotationMrad || 0,2) + ' mrad (CCW +).');
        if (Number.isFinite(a.value) && Number.isFinite(b.value) && Math.abs(a.value - b.value) > 1e-8) push(label + ' changed from ' + (0, common_1.signed)(a.value, 2) + ' to ' + (0, common_1.signed)(b.value, 2) + (b.kind === 'moment' ? ' kN m.' : (0, validation_1.isDistributed)(b.kind) ? ' kN/m.' : ' kN.'));
        if ((0, validation_1.isDistributed)(b.kind) && Math.abs((a.end || 0) - (b.end || 0)) > 1e-8) push(label + ' end moved from ' + (0, common_1.fmt)(a.end, 2) + ' to ' + (0, common_1.fmt)(b.end, 2) + ' m.');
    }
    for (const [id, a] of aItems) if (!bItems.has(id)) push((a.label || examples_1.titles[a.kind]) + ' was removed.');
    return changes;
}
function tutorContext(mode='question') {
    if (!visibility().complete) return null;
    if (!analysis) return null;
    const m = history.model;
    const x = v.trace === null ? analysis.peakM.x : v.trace;
    const sample = analysis.sample(x, x >= m.length - 1e-9 ? 'left' : 'right');
    const props = analysis.properties || {};
    const level = (0, levels_1.mode)(v.level);
    const items = m.items.slice(0, 48).map(i => ({
        label: i.label, kind: i.kind, x: i.x,
        end: Number.isFinite(i.end) ? i.end : undefined,
        value: Number.isFinite(i.value) ? i.value : undefined,
        endValue: Number.isFinite(i.endValue) ? i.endValue : undefined,
        caseId: i.caseId, settlementMm:i.settlementMm, rotationMrad:i.rotationMrad
    }));
    const reactions = (analysis.reactions || []).map(r => ({ label: r.label, x: r.x, force: r.force, moment: r.moment || 0, fixed: !!r.fixed, settlementMm:r.settlementMm || 0, rotationMrad:r.rotationMrad || 0 }));
    const A = comparisonMetrics(comparison), B = comparisonMetrics(analysis);
    const compare = compareModel && comparison ? {
        changes: compareModelChanges(compareModel, m),
        frozen: A, current: B,
        deltas: A && B ? { shear: B.shear - A.shear, moment: B.moment - A.moment, deflection: B.deflection - A.deflection, EI: B.EI - A.EI } : null
    } : null;
    return {
        release: verification.RELEASE, mode,
        learning: learningEvidenceSnapshot(),
        learningLevel: { id: v.level, short: level.short, title: level.title, subtitle: level.subtitle },
        signConventions: { appliedVertical: 'positive downward', reactions: 'positive upward', couples: 'positive counter-clockwise', internalMoment: 'positive sagging', displacement: 'positive upward' },
        assumptions: ['straight Euler-Bernoulli beam', 'linear elastic', 'small deflection', 'static analysis', ...(analysis.hasSupportSettlement ? ['prescribed vertical support settlement; positive displacement upward'] : []), ...(analysis.hasSupportRotation ? ['prescribed fixed-support rotation; positive counter-clockwise'] : [])],
        study: { name: m.name, length: m.length, selfWeight: !!m.selfWeight, activeCases: (m.cases || []).filter(c => c.enabled && c.factor !== 0).map(c => ({ name: c.name, factor: c.factor })), items, sectionRegions:(analysis.sectionRegions || []).map(r => { const rp=(0,sections_1.sectionProperties)(r.section); return {label:r.label,x:r.x,end:r.end,section:(0,section_regions_1.sectionLabel)(r.section),E_GPa:r.section.E,I_mm4:rp.I*1e12,A_mm2:rp.A*1e6,depth_mm:r.section.h,EI_kNm2:rp.EI,weight_kNm:rp.weight}; }), stiffnessRegions:(analysis.stiffnessRegions || []).map(r => ({label:r.label,x:r.x,end:r.end,factor:r.factor})) },
        section: { name:m.section?.catalogue || m.section?.shape || 'custom', E_GPa:m.section?.E, I_mm4:props.I*1e12, A_mm2:props.A*1e6, baseEI_kNm2:props.EI, hasTrueSteppedSections:!!analysis.hasSectionRegions, hasEIOnlyOverrides:!!analysis.hasEIOnlyRegions, localStressInferenceAvailable:!analysis.hasEIOnlyRegions },
        inspected: { x, V_kN: sample.V, M_kNm: sample.M, displacement_m: sample.v, rotation_rad: sample.theta, pinned: !!v.pinned, localSection:analysis.localSectionAt ? (() => { const local=analysis.localSectionAt(x); return {region:local.regionLabel,section:local.label,E_GPa:local.section?.E,I_mm4:local.properties?.I*1e12,A_mm2:local.properties?.A*1e6,EI_kNm2:local.EI,stiffnessFactor:local.stiffnessFactor}; })() : null },
        critical: { peakShear: { x: analysis.peakV.x, V_kN: analysis.peakV.V }, peakMoment: { x: analysis.peakM.x, M_kNm: analysis.peakM.M }, peakDeflection: { x: analysis.peakD.x, displacement_m: analysis.peakD.v } },
        reactions, compare,
        designReview: v.workspaceMode === 'design' ? (0, design_1.evaluate)(m, analysis, designSettings) : null,
        selectedObjects: m.items.filter(i => v.selected.has(i.id)).map(i => i.label).slice(0, 8),
        examMode: !!(v.session?.active && v.session.mode === 'exam')
    };
}
function tutorPromptText(key) {
    const x = analysis ? (v.trace === null ? analysis.peakM.x : v.trace) : 0;
    const prompts = {
        point: 'Explain what is happening at x = ' + (0, common_1.fmt)(x, 3) + ' m and connect the local load, shear, moment and deformation.',
        peak: 'Why does the maximum bending moment occur where BeamLab reports it? Explain from the shear-force behaviour and boundary conditions.',
        compare: 'Explain the frozen A to current B comparison. Separate confirmed input changes from observed response changes and do not overclaim causation.',
        quiz: 'Quiz me with one level-appropriate question about this exact beam. Do not give the answer until I reply.',
        hint: 'Give me one Socratic hint about the most useful structural relationship to inspect next. Do not give the final numerical answer.',
        design: 'Explain this Design Studio review. Use only the displayed deterministic demand and user-entered criteria. Identify the governing entered-check ratio and the important missing code/member checks. Do not invent capacities or claim compliance.'
    };
    return prompts[key] || '';
}
function renderTutorDialog() {
    if (!visibility().complete || $('#dialog-title')?.textContent !== 'Ask BeamLab' || !$('#dialog')?.classList.contains('open')) return;
    const content = $('#dialog-content');
    if (!content) return;
    const ctx = analysis ? tutorContext(aiTutor.mode) : null;
    const available = window.BeamLabTutorApi?.available === true;
    const messages = aiTutor.history.map(m => `<div class="ai-message ${m.role}"><small>${m.role === 'assistant' ? 'BeamLab Tutor' : 'You'}</small>${(0, common_1.esc)(m.text)}</div>`).join('');
    const x = ctx?.inspected?.x;
    content.innerHTML = `<div class="ai-dialog"><div class="ai-boundary"><b>Solver first.</b> The tutor receives BeamLab's deterministic results as authoritative context. It explains and asks questions; it does not calculate or certify the structure.</div><div class="ai-context-strip"><span>${(0, common_1.esc)((0, levels_1.mode)(v.level).short)}</span>${ctx ? `<span>x ${(0, common_1.fmt)(x, 3)} m</span><span>V ${(0, common_1.signed)(ctx.inspected.V_kN, 2)} kN</span><span>M ${(0, common_1.signed)(ctx.inspected.M_kNm, 2)} kN·m</span>` : ''}<span>4.1 contextual tutor</span></div><div class="ai-quick"><button data-action="ai-quick:point" ${!analysis || !available ? 'disabled' : ''}>Explain this point</button><button data-action="ai-quick:peak" ${!analysis || !available ? 'disabled' : ''}>Why is max moment here?</button><button data-action="ai-quick:compare" ${!comparison || !available ? 'disabled' : ''}>Explain what changed</button><button data-action="ai-quick:quiz" ${!analysis || !available ? 'disabled' : ''}>Quiz me on this beam</button><button data-action="ai-quick:hint" ${!analysis || !available ? 'disabled' : ''}>Give me a hint</button><button data-action="ai-quick:design" ${v.workspaceMode !== 'design' || !analysis || !available ? 'disabled' : ''}>Explain design review</button></div>${messages ? `<div class="ai-thread">${messages}</div>` : '<p class="hint">Choose a prompt above or ask your own question. Explanations adapt to your current learning level.</p>'}${aiTutor.error ? `<div class="ai-error">${(0, common_1.esc)(aiTutor.error)}</div>` : ''}${aiTutor.busy ? '<div class="ai-thinking"><i></i>Connecting the solved model to an explanation…</div>' : ''}<div class="ai-compose"><textarea id="ai-question" maxlength="600" placeholder="Ask about the current beam, diagram, support, load or comparison…" aria-label="Question for BeamLab Tutor" ${aiTutor.busy ? 'disabled' : ''}></textarea><div class="ai-compose-row"><button type="button" data-action="ai-clear" class="secondary" ${!aiTutor.history.length ? 'disabled' : ''}>Clear</button><button type="button" data-action="ai-send" class="primary" ${aiTutor.busy || !available || !analysis ? 'disabled' : ''}>Ask BeamLab</button></div></div>${available ? '' : '<div class="ai-offline"><b>Online tutor is not connected.</b><p>Use a local explanation of this exact solved model.</p><button data-action="explain-here" class="primary">Open deterministic Show Why</button></div>'}<p class="hint">AI explanations may be imperfect. For numerical values, diagrams and equilibrium, use BeamLab's solver outputs shown in the workspace.</p></div>`;
}
function openTutor() {
    if (!visibility().complete) { toast(activity.restrictionMessage(v)); return; }
    if (v.session?.active && v.session.mode === 'exam') { toast('Ask BeamLab is disabled during Exam Mode. Submit the exam before using the tutor.'); return; }
    if (!analysis) { toast('Complete a stable model first.'); return; }
    openDialog('Ask BeamLab', '<div class="ai-thinking"><i></i>Preparing deterministic context…</div>');
    renderTutorDialog();
}
async function askTutor(mode = 'question', override = '') {
    if (v.session?.active && v.session.mode === 'exam') { toast('Ask BeamLab is disabled during Exam Mode.'); return; }
    if (!analysis) { toast('Complete a stable model first.'); return; }
    const input = $('#ai-question');
    const question = (override || input?.value || '').trim();
    if (!question) { toast('Ask a question first.'); return; }
    if (!window.BeamLabTutorApi?.ask || !window.BeamLabTutorApi.available) { aiTutor.error = 'The live tutor is unavailable here. Use Show Why for a deterministic explanation.'; renderTutorDialog(); return; }
    aiTutor.mode = mode; aiTutor.error = ''; aiTutor.busy = true;
    aiTutor.history.push({ role: 'user', text: question });
    if (aiTutor.history.length > 8) aiTutor.history = aiTutor.history.slice(-8);
    renderTutorDialog();
    try {
        const response = await window.BeamLabTutorApi.ask({ mode, question, level: v.level, history: aiTutor.history.slice(-6), context: tutorContext(mode) });
        const answer = String(response?.answer || '').trim();
        if (!answer) throw new Error('The tutor returned an empty response.');
        aiTutor.history.push({ role: 'assistant', text: answer });
        if (aiTutor.history.length > 8) aiTutor.history = aiTutor.history.slice(-8);
    } catch (e) {
        aiTutor.error = 'The tutor could not respond right now. Your structural model and deterministic results are unaffected. ' + (e instanceof Error ? e.message : '');
    } finally { aiTutor.busy = false; renderTutorDialog(); }
}
function compareDialog() {
    if (!comparison || !compareModel || !analysis) { toast('Freeze a compatible model first.'); return; }
    const A = comparisonMetrics(comparison), B = comparisonMetrics(analysis);
    const row = (label, a, b, unit) => `<tr><th>${label}</th><td>${(0, common_1.fmt)(a, 4)} ${unit}</td><td>${(0, common_1.fmt)(b, 4)} ${unit}</td><td>${deltaText(a,b,unit)}</td></tr>`;
    const changes = compareModelChanges(compareModel, history.model);
    const observed = [
        ['Peak |V|', A.shear, B.shear, 'kN'], ['Peak |M|', A.moment, B.moment, 'kN m'], ['Peak |v|', A.deflection, B.deflection, 'mm']
    ].filter(([,a,b]) => Math.abs(b-a) > Math.max(1e-9,Math.abs(a)*1e-5)).map(([label,a,b,unit]) => `<li><b>${label}</b> ${deltaText(a,b,unit)}</li>`).join('');
    openDialog('Compare A → B', `<p>Snapshot A stays frozen while B is your current model. Deltas are B minus A; this is a response comparison, not a safety verdict.</p><div class="compare-insights"><article><span>MODEL CHANGES</span><ul>${changes.length ? changes.map(x => '<li>'+ (0, common_1.esc)(x) +'</li>').join('') : '<li>No model-input changes detected.</li>'}</ul></article><article><span>OBSERVED RESPONSE</span><ul>${observed || '<li>No material response change at the reported peaks.</li>'}</ul></article></div><table class="compare-table"><thead><tr><th>Quantity</th><th>A / frozen</th><th>B / current</th><th>Δ B−A</th></tr></thead><tbody>${row('Peak |V|',A.shear,B.shear,'kN')}${row('Peak |M|',A.moment,B.moment,'kN m')}${row('Peak |v|',A.deflection,B.deflection,'mm')}${row(A.steppedSections||B.steppedSections||A.eiOnly||B.eiOnly?'Base EI':'EI',A.EI,B.EI,'MN m²')}</tbody></table><div class="compare-model-grid"><article><span>A / FROZEN</span><b>${(0, common_1.esc)(compareModel.name)}</b><p>E ${(0, common_1.fmt)(compareModel.section.E,2)} GPa / I ${Number(compareModel.section.I).toExponential(3)} mm⁴ / ${compareModel.items.length} objects</p></article><article><span>B / CURRENT</span><b>${(0, common_1.esc)(history.model.name)}</b><p>E ${(0, common_1.fmt)(history.model.section.E,2)} GPa / I ${Number(history.model.section.I).toExponential(3)} mm⁴ / ${history.model.items.length} objects</p></article></div><p class="hint">The change list is descriptive. It does not claim that any one input caused a particular response change. Hover or pin the diagrams to inspect A, B and Δ at the same x-position.</p>`);
}
function shortcutsDialog() {
    openDialog('Quick help & shortcuts', `<div class="shortcut-grid"><div><kbd>?</kbd><span>Open this help</span></div><div><kbd>Ctrl/Cmd Z</kbd><span>Undo</span></div><div><kbd>Ctrl/Cmd Shift Z</kbd><span>Redo</span></div><div><kbd>Ctrl/Cmd D</kbd><span>Duplicate selection</span></div><div><kbd>← / →</kbd><span>Nudge selected objects</span></div><div><kbd>Shift + ← / →</kbd><span>Larger nudge</span></div><div><kbd>Delete</kbd><span>Remove unlocked selection</span></div><div><kbd>Esc</kbd><span>Clear selection / close transient edit</span></div></div><h3>Safe progressive complexity</h3><p>Learning levels and Practice mode change presentation only. They do not switch solvers, remove advanced objects, or alter structural results.</p><p class="hint">Double-click a model label for direct numeric editing. Hover a response diagram to inspect one x-position across all visible views; click to pin it.</p>`);
}
function renderStage() {
    const m = history.model, a = analysis;
    const {masked:practice, step:pstep} = visibility();
    const hiddenMetric = (stage) => practice && pstep < stage;
    const metrics = [...(a?.reactions || []).map(r => ({ label: 'Reaction ' + r.label, value: hiddenMetric(1) ? 'Predict first' : (0, common_1.signed)(r.force) + ' kN', meta: hiddenMetric(1) ? 'Reveal reactions when ready' : `x = ${(0, common_1.fmt)(r.x)} m${r.fixed ? ' / MF ' + (0, common_1.signed)(r.moment) + ' kN m' : ''}`, hidden: hiddenMetric(1) })), { label: 'Peak shear', value: hiddenMetric(2) ? 'Hidden' : a ? (0, common_1.fmt)(Math.abs(a.peakV.V)) + ' kN' : '--', meta: hiddenMetric(2) ? 'Sketch the SFD first' : a ? 'x = ' + (0, common_1.fmt)(a.peakV.x) + ' m' : 'No result', hidden: hiddenMetric(2) }, { label: 'Peak moment', value: hiddenMetric(3) ? 'Hidden' : a ? (0, common_1.fmt)(Math.abs(a.peakM.M)) + ' kN·m' : '--', meta: hiddenMetric(3) ? 'Sketch the BMD first' : a ? 'x = ' + (0, common_1.fmt)(a.peakM.x) + ' m' : 'No result', hidden: hiddenMetric(3) }, ...(shown('deformation') ? [{ label: 'Peak deflection', value: hiddenMetric(4) ? 'Hidden' : a ? (0, common_1.fmt)(Math.abs(a.peakD.v) * 1000) + ' mm' : '--', meta: hiddenMetric(4) ? 'Predict the elastic curve first' : a ? 'x = ' + (0, common_1.fmt)(a.peakD.x) + ' m / |v|' : 'No result', hidden: hiddenMetric(4) }] : [])];
    $('#metrics').innerHTML = metrics.map(c => `<div class="metric ${c.hidden ? 'practice-hidden' : ''}"><span>${(0, common_1.esc)(c.label)}</span><strong>${c.value}</strong><small>${(0, common_1.esc)(c.meta)}</small></div>`).join('');
    $('#error').hidden = !error;
    $('#error').innerHTML = `<strong>Check the model</strong><p>${(0, common_1.esc)(error)}</p>`;
    $('#case-summary').innerHTML = `<span>${(0, common_1.icon)('layers', 13)} RESPONSE</span><b>${m.cases.filter(c => c.enabled && c.factor !== 0).map(c => `${(0, common_1.fmt)(c.factor, 2)}\u00d7${(0, common_1.esc)(c.name)}`).join(' + ') || 'No active cases'}</b>${m.selfWeight ? '<small>Includes case-factored self-weight</small>' : ''}`;
    $('#compare-note').hidden = !compareModel || !visibility().complete;
    if (compareModel && visibility().complete) {
        const A = comparisonMetrics(comparison), B = comparisonMetrics(a);
        $('#compare-note').innerHTML = `${(0, common_1.icon)('compare', 14)}<span>${comparison ? 'A = dashed frozen snapshot / B = current colour.' : 'Comparison paused: restore the same member length to compare.'}</span>${comparison && A && B ? `<div class="compare-mini"><b>Δ|M| ${deltaText(A.moment,B.moment,'kN m')}</b><b>Δ|v| ${deltaText(A.deflection,B.deflection,'mm')}</b></div>${(0, common_1.button)('compare-details', 'Details', 'text-button')}` : ''}${(0, common_1.button)('compare', (0, common_1.icon)('close', 13), 'icon-button', false, 'Clear comparison')}`;
    }
    if (!visibility().complete) $('#compare-note').innerHTML = '';
    $('#graphs').innerHTML = (0, diagrams_1.renderDiagrams)(m, a, diagramView());
    $('#trace-position').innerHTML = `<div class="trace-position"><label for="trace-number">Inspect x / m</label><input type="range" data-range="trace" aria-label="Inspection position" min="0" max="${m.length}" step="${m.length/1000}" value="${v.trace ?? m.length/2}"><input id="trace-number" type="number" data-trace-number min="0" max="${m.length}" step="any" value="${v.trace ?? m.length/2}" aria-label="Inspection position in metres"></div>`;
    $('#stage-footer').innerHTML = `${(0,common_1.button)('audit', (0,common_1.icon)(a ? 'check' : 'help',13) + (a ? ' Model checks' : ' Model incomplete'), 'audit-trigger', !a || !visibility().complete, 'Inspect equilibrium, energy and critical locations')}<div class="view-controls">${(0, common_1.button)('annotation-cycle', (0, common_1.icon)('eye', 14) + '<span>' + (v.annotationMode === 'clean' ? 'Clean' : v.annotationMode === 'guided' ? 'Guided' : 'Detailed') + '</span>', 'detail-button ' + (v.annotationMode !== 'clean' ? 'active' : ''), false, 'Diagram detail: ' + v.annotationMode + '. Click to cycle.')}<label>Zoom <select data-select="zoom" aria-label="Diagram zoom">${[1, 1.5, 2, 3].map(n => `<option value="${n}" ${v.zoom === n ? 'selected' : ''}>${n * 100}%</option>`).join('')}</select></label>${v.zoom > 1 ? `<input type="range" data-range="pan" aria-label="Pan along beam" min="0" max="${m.length - m.length / v.zoom}" step="${m.length / 1000}" value="${v.pan}">${(0, common_1.button)('fit', 'Fit', 'text-button')}` : ''}<small>Snap ${v.snap ? v.snap + ' m' : 'off'}</small></div>`;
    $('#assumptions').hidden = !a?.warnings.length && !m.section.family?.includes('PFC');
    $('#assumptions').innerHTML = `<summary>Model assumptions to review</summary>${[...(a?.warnings || []), ...(m.section.family === 'PFC' ? ['Channel bending is about horizontal x-x only. Torsion from load eccentricity and shear-centre effects is not represented.'] : [])].map(w => `<p>${(0, common_1.esc)(w)}</p>`).join('')}`;
    $('#working-toggle').innerHTML = (0, common_1.button)('working', `${(0, common_1.icon)('help', 16)}<span>${v.working ? 'Hide worked solution' : 'Show working, step by step'}</span>${(0, common_1.icon)('right', 16)}`, 'working-toggle', !a || !visibility().complete);
    $('#working-toggle').insertAdjacentHTML('beforeend', !visibility().complete ? `<p class="answer-policy-note">${(0,common_1.esc)(activity.restrictionMessage(v))}</p>` : '');
    updateTrace();
}
function renderExtras(skipReview = false) {
    const a = analysis, m = history.model, x = v.trace ?? a?.peakM.x ?? 0;
    movingLab?.update(m,shown('moving'));
    if (!visibility().complete) $('#moving-lab').innerHTML = '';
    $('#shear-stress').hidden = !shown('shear') || (shown('practice') && visibility().step < 4);
    if(shown('shear') && (!shown('practice') || visibility().step >= 4)) $('#shear-stress').innerHTML = renderShear(m,a,x);
    $('#teaching').hidden = !shown('teaching');
    if (!visibility().complete) for (const id of ['teaching','section-stress','shear-stress','review']) $('#' + id).innerHTML = '';
    if (shown('teaching'))
        $('#teaching').innerHTML = (0, diagrams_1.teaching)(m, a, x, v.level);
    $('#section-stress').hidden = !shown('stress') || (shown('practice') && visibility().step < 4);
    if (shown('stress') && (!shown('practice') || visibility().step >= 4))
        $('#section-stress').innerHTML = sectionLab.render(m, a, x, v.fibre, v.sectionSide);
    $('#working').hidden = !v.working || !a || !visibility().complete;
    if (!visibility().complete) $('#working').innerHTML = '';
    if (v.working && a && visibility().complete)
        $('#working').innerHTML = (0, working_1.working)(m, a, v.step);
    if (!skipReview) {
        $('#review').hidden = !shown('review');
        if (shown('review'))
            $('#review').innerHTML = (0, panels_1.limitReview)(m, a);
    }
}
function updateTrace() {
    const a = analysis, m = history.model, x = v.trace;
    const { xp, span } = (0, diagrams_1.coordinates)(m, diagramView());
    const traceVisible = x !== null && x >= v.pan - 1e-8 && x <= v.pan + span + 1e-8;
    const {masked:practice, step:pstep} = visibility();
    if (x !== null) { const slider=$('[data-range=trace]'), number=$('[data-trace-number]'); if(slider && slider!==document.activeElement) slider.value=String(x); if(number && number!==document.activeElement) number.value=String(Math.round(x*10000)/10000); }
    $('#trace-readout').innerHTML = x === null ? `<span>${(0, common_1.icon)('help', 12)} Hover a diagram. Click to pin.</span><small>${practice ? 'Practice mode hides unrevealed responses. ' : ''}Reactions up + / loads down + / sagging moment +</small>` : (() => {
        const r = a?.sample(x), l = a?.sample(x, 'left'), cr = visibility().complete ? comparison?.sample(x) : null, cl = visibility().complete ? comparison?.sample(x, 'left') : null;
        const pair = (k, units, stage) => {
            if (practice && pstep < stage) return `${k} hidden / predict first`;
            if (!r || !l) return '--';
            const current = Math.abs(r[k] - l[k]) > 1e-5 ? `${k}- ${(0, common_1.signed)(l[k])} / ${k}+ ${(0, common_1.signed)(r[k])} ${units}` : `${k} ${(0, common_1.signed)(r[k])} ${units}`;
            if (!cr || !cl) return current;
            return `${current} <em>A ${(0, common_1.signed)(cr[k])} / Δ ${(0, common_1.signed)(r[k]-cr[k])}</em>`;
        };
        const def = practice && pstep < 4 ? (shown('deformation') ? '<span>v hidden / predict first</span>' : '') : shown('deformation') && r ? `<span>v ${(0, common_1.signed)(r.v * 1000)} mm${cr ? ` <em>A ${(0, common_1.signed)(cr.v * 1000)} / Δ ${(0, common_1.signed)((r.v-cr.v)*1000)}</em>` : ''}</span>` : '';
        return `<b>x ${(0, common_1.fmt)(x)} m ${v.pinned ? '[pinned]' : ''}</b><span>${pair('V', 'kN', 2)}</span><span>${pair('M', 'kN·m', 3)}</span>${def}${v.pinned ? (0, common_1.button)('unpin', (0, common_1.icon)('close', 13), 'icon-button', false, 'Unpin cursor') : ''}`;
    })();
    $('#graphs').querySelectorAll('.trace-group').forEach(g => { g.style.display = traceVisible ? '' : 'none'; if (traceVisible) g.querySelectorAll('line').forEach(line => { line.setAttribute('x1', String(xp(x))); line.setAttribute('x2', String(xp(x))); }); });
    $('#graphs').querySelectorAll('.diagram-block[data-kind]').forEach(block => {
        const marker = block.querySelector('.trace-marker'), text = block.querySelector('.trace-label');
        if (!marker || !text) return;
        const k = block.dataset.kind, stage = k === 'V' ? 2 : k === 'M' ? 3 : 4, hidden = practice && pstep < stage;
        const active = x !== null && a && !hidden;
        text.style.display = active ? '' : 'none';
        marker.style.display = active && traceVisible ? '' : 'none';
        const placeholder = block.querySelector('.trace-placeholder');
        if (placeholder) placeholder.hidden = !!active;
        if (x !== null && a && !hidden) {
            const sample = a.sample(x), value = k === 'v' ? sample.v * 1000 : k === 'stress' ? -sample.M * (sample.c ?? a.properties.c) / (sample.I ?? a.properties.I) / 1000 : sample[k];
            const y = Number(block.dataset.base) - value / Number(block.dataset.max) * Number(block.dataset.amp);
            marker.setAttribute('cx', String(xp(x))); marker.setAttribute('cy', String(y));
            const left = a.sample(x, 'left');
            const leftValue = k === 'v' ? left.v * 1000 : k === 'stress' ? -left.M * (left.c ?? a.properties.c) / (left.I ?? a.properties.I) / 1000 : left[k];
            const name = k === 'stress' ? 'σ' : k;
            const values = Math.abs(leftValue-value)>1e-5 ? `${name}⁻ ${(0,common_1.signed)(leftValue,3)} / ${name}⁺ ${(0,common_1.signed)(value,3)}` : `${name} ${(0,common_1.signed)(value,3)}`;
            text.textContent = `x = ${(0,common_1.fmt)(x)} m · ${values} ${block.dataset.units}${traceVisible ? '' : ' · outside zoomed view'}`;
        }
    });
    if (shown('teaching')) $('#teaching').innerHTML = (0, diagrams_1.teaching)(m, a, x ?? a?.peakM.x ?? 0, v.level);
    if (shown('stress') && (!practice || pstep >= 4)) $('#section-stress').innerHTML = sectionLab.render(m, a, x ?? a?.peakM.x ?? 0, v.fibre, v.sectionSide);
    if (shown('shear') && (!practice || pstep >= 4)) $('#shear-stress').innerHTML = renderShear(m, a, x ?? a?.peakM.x ?? 0);
}

function newIdentity(kind) {
    const m = history.model, prefix = (0, validation_1.isSupport)(kind) ? 'S' : kind === 'hinge' ? 'H' : kind === 'point' ? 'P' : kind === 'udl' ? 'U' : kind === 'variable' ? 'V' : 'M';
    let n = 1;
    while (m.items.some(i => i.label === prefix + n))
        n++;
    const used = new Set(m.items.filter(i => (0, validation_1.isLoad)(i.kind)).map(i => i.colour));
    return { label: prefix + n, colour: (0, validation_1.isSupport)(kind) ? '#9fbbb4' : kind === 'hinge' ? '#bc9aff' : examples_1.colours.find(c => !used.has(c)) || examples_1.colours[m.items.length % examples_1.colours.length] };
}
function add(kind, x = history.model.length / 2, preset) {
    if (blockModelEdit()) return;
    if (!(0, levels_1.canUseTool)(activity.toolLevel(v), kind)) { toast(`${examples_1.titles[kind]} is hidden at ${(0, levels_1.mode)(v.level).short}. Move up a learning level to use it.`); return; }
    const m = history.model;
    if (m.items.length >= 48) {
        toast('48 structural objects is the limit.');
        return;
    }
    const l = m.length, range = l / 3, start = (0, common_1.clamp)(x - range / 2, 0, l - range);
    const o = { ...(0, examples_1.makeItem)(kind, (0, validation_1.isDistributed)(kind) ? start : (0, common_1.clamp)(x, kind === 'hinge' ? .01 : 0, kind === 'hinge' ? l - .01 : l), (0, validation_1.isDistributed)(kind) ? start + range : undefined, kind === 'udl' ? 5 : kind === 'variable' ? 0 : kind === 'moment' ? 30 : 20, kind === 'variable' ? 12 : undefined), ...newIdentity(kind), caseId: (0, validation_1.isLoad)(kind) ? v.currentCase : undefined };
    if (preset === 'up')
        o.value = -10;
    if (preset === 'wind') {
        o.value = -2;
        o.x = 0;
        o.end = l;
    }
    if (preset === 'partial') {
        o.x = l / 2;
        o.end = l;
    }
    v.selected = new Set([o.id]);
    v.inspector = true;
    if (matchMedia('(max-width:780px)').matches) v.controls = false;
    commit({ ...m, items: [...m.items, o] }, 'Add ' + examples_1.titles[kind]);
}
function selectObject(id, add = false) { finishField(); if (matchMedia('(max-width:780px)').matches && workspace.phaseFor(v)!=='learn') v.controls = false; if (add) {
    if (v.selected.has(id))
        v.selected.delete(id);
    else
        v.selected.add(id);
}
else
    v.selected = new Set([id]); v.inspector = true; render(); }
function selectedItems() { return history.model.items.filter(i => v.selected.has(i.id)); }
function nudge(delta) {
    if (blockModelEdit()) return;
    const movable = selectedItems().filter(i => !i.locked && (0, levels_1.canEditItem)(activity.toolLevel(v), i));
    if (!movable.length)
        return;
    const bound = (i) => (0, validation_1.isDistributed)(i.kind) ? i.end : i.x;
    delta = (0, common_1.clamp)(delta, Math.max(...movable.map(i => (i.kind === 'hinge' ? .01 : 0) - i.x)), Math.min(...movable.map(i => history.model.length - bound(i) - (i.kind === 'hinge' ? .01 : 0))));
    const ids = new Set(movable.map(i => i.id));
    commit({ ...history.model, items: history.model.items.map(i => ids.has(i.id) ? { ...i, x: i.x + delta, ...(i.end !== undefined ? { end: i.end + delta } : {}) } : i) }, 'Move selection');
}
function duplicate() {
    if (blockModelEdit()) return;
    const chosen = selectedItems().filter(i => (0, levels_1.canEditItem)(activity.toolLevel(v), i));
    if (!chosen.length)
        return;
    if (history.model.items.length + chosen.length > 48) {
        toast('Duplicating would exceed the object limit.');
        return;
    }
    const m = (0, study_1.clone)(history.model), newIds = [];
    for (const old of chosen) {
        const o = { ...old, id: (0, examples_1.makeItem)(old.kind, old.x).id, locked: false };
        let n = 1;
        const prefix = old.label.replace(/\d+$/, '') || 'Copy';
        while (m.items.some(i => i.label === prefix + n))
            n++;
        o.label = prefix + n;
        const dx = Math.min(m.length * .04, m.length - (o.end ?? o.x) - (o.kind === 'hinge' ? .01 : 0));
        o.x += dx;
        if (o.end !== undefined)
            o.end += dx;
        if ((0, validation_1.isLoad)(o.kind))
            o.colour = examples_1.colours.find(c => !m.items.some(i => i.colour === c)) || examples_1.colours[m.items.length % examples_1.colours.length];
        m.items.push(o);
        newIds.push(o.id);
    }
    v.selected = new Set(newIds);
    commit(m, 'Duplicate selection');
}
function remove() {
    if (blockModelEdit()) return; const unlocked = selectedItems().filter(i => !i.locked && (0, levels_1.canEditItem)(activity.toolLevel(v), i)); if (!unlocked.length) {
    toast('Unlock objects before removing them.');
    return;
} const ids = new Set(unlocked.map(i => i.id)); commit({ ...history.model, items: history.model.items.filter(i => !ids.has(i.id)) }, 'Remove selection', false); }
function openDialog(title, content) { pauseSweep(); dialogReturnFocus = document.activeElement; finishField(); $('#dialog-title').textContent = title; $('#dialog-content').innerHTML = content; $('#dialog').classList.add('open'); $('#dialog').setAttribute('aria-hidden', 'false'); $('#dialog-close').focus(); }
function closeDialog() { $('#dialog').classList.remove('open'); $('#dialog').setAttribute('aria-hidden', 'true'); if (dialogReturnFocus?.isConnected) dialogReturnFocus.focus(); }
function openSectionRegionDialog(id = '') {
    if (!(0, levels_1.canUseFeature)(activity.toolLevel(v), 'steppedSections')) { toast('True stepped-section editing appears from 3rd+ Year mode.'); return; }
    const regions = history.model.sectionRegions || [];
    const existing = regions.find(r => r.id === id) || null;
    if (!existing && regions.length >= section_regions_1.MAX_SECTION_REGIONS) { toast(section_regions_1.MAX_SECTION_REGIONS + ' stepped-section regions is the limit.'); return; }
    const m = history.model, fallbackStart = m.length * .5, fallbackEnd = m.length;
    const region = existing || { label:'Section region ' + (regions.length + 1), x:fallbackStart, end:fallbackEnd, section:(0,study_1.clone)(m.section) };
    const source = existing?.section?.catalogue || (existing ? '__existing__' : '__base__');
    const opt = (value,label,selected=false) => `<option value="${(0,common_1.esc)(value)}" ${selected?'selected':''}>${(0,common_1.esc)(label)}</option>`;
    const groups = catalogue_1.catalogueFamilies.map(f => `<optgroup label="${(0,common_1.esc)(f.name)}">${catalogue_1.catalogue.filter(row=>row.family===f.id).map(row=>opt(row.name,row.name+' / '+row.mass+' kg/m',source===row.name)).join('')}</optgroup>`).join('');
    const existingOption = existing ? opt('__existing__','Keep current local section / '+(0,section_regions_1.sectionLabel)(existing.section),source==='__existing__') : '';
    const currentProps = (() => { try { return (0,sections_1.sectionProperties)(region.section); } catch { return null; } })();
    openDialog(existing ? 'Edit true stepped section' : 'Add true stepped section', `<div class="section-region-dialog-intro"><p>Assign an actual BeamLab section to one non-overlapping interval. The section is stored as an independent local property set, so the deterministic solver can use its own E, I, area, depth, density and self-weight.</p></div><label class="field"><span>Region label</span><div><input id="section-region-label" maxlength="40" value="${(0,common_1.esc)(region.label)}" aria-label="Stepped section label"></div><em class="field-error"></em></label><label class="field"><span>Start x</span><div><input id="section-region-start" type="number" min="0" max="${m.length}" step="any" value="${region.x}" aria-label="Stepped section start"><small>m</small></div><em class="field-error"></em></label><label class="field"><span>End x</span><div><input id="section-region-end" type="number" min="0" max="${m.length}" step="any" value="${region.end}" aria-label="Stepped section end"><small>m</small></div><em class="field-error"></em></label><label class="field"><span>Local section source</span><select id="section-region-source" aria-label="Local stepped section source">${existingOption}${opt('__base__','Copy current base section',source==='__base__')}${groups}</select><em class="field-error"></em></label><div class="section-region-dialog-summary"><b>Current local definition</b><span>${(0,common_1.esc)((0,section_regions_1.sectionLabel)(region.section))}</span><small>E ${(0,common_1.fmt)(region.section.E,2)} GPa · Ix ${currentProps ? (currentProps.I*1e12).toExponential(3) : '--'} mm⁴ · depth ${(0,common_1.fmt)(region.section.h,1)} mm · self-weight ${currentProps ? (0,common_1.fmt)(currentProps.weight,3) : '--'} kN/m</small></div><p class="section-region-dialog-note">“Copy current base section” stores a snapshot; later edits to the base section do not silently rewrite this region. Catalogue choices use BeamLab's tabulated A/Ix geometry and editable teaching material assumptions.</p><p id="section-region-dialog-error" class="stiffness-dialog-error" role="alert"></p><div class="dialog-actions">${(0,common_1.button)('section-region-save:'+(existing ? existing.id : 'new'), existing ? 'Save stepped section' : 'Add stepped section', 'primary')}${(0,common_1.button)('dialog-close','Cancel','secondary')}</div>`);
}
function openStiffnessDialog(id = '') {
    if (!(0, levels_1.canUseFeature)(activity.toolLevel(v), 'varyingEI')) { toast('Piecewise EI editing appears from 3rd+ Year mode.'); return; }
    const regions = history.model.stiffnessRegions || [];
    const existing = regions.find(r => r.id === id) || null;
    if (!existing && regions.length >= stiffness_1.MAX_REGIONS) { toast(stiffness_1.MAX_REGIONS + ' EI zones is the limit.'); return; }
    const m = history.model, fallbackStart = m.length * .5, fallbackEnd = m.length;
    const region = existing || { label:'EI zone ' + (regions.length + 1), x:fallbackStart, end:fallbackEnd, factor:.5 };
    openDialog(existing ? 'Edit EI stiffness zone' : 'Add EI stiffness zone', `<div class="stiffness-dialog-intro"><p>Define one non-overlapping interval where the solver uses <b>EI = base EI × multiplier</b>. The multiplier changes elastic stiffness only; it does not create local section geometry or capacity.</p></div><label class="field"><span>Zone label</span><div><input id="stiffness-label" maxlength="40" value="${(0,common_1.esc)(region.label)}" aria-label="EI zone label"></div><em class="field-error"></em></label><label class="field"><span>Start x</span><div><input id="stiffness-start" type="number" min="0" max="${m.length}" step="any" value="${region.x}" aria-label="EI zone start"><small>m</small></div><em class="field-error"></em></label><label class="field"><span>End x</span><div><input id="stiffness-end" type="number" min="0" max="${m.length}" step="any" value="${region.end}" aria-label="EI zone end"><small>m</small></div><em class="field-error"></em></label><label class="field"><span>EI multiplier</span><div><input id="stiffness-factor" type="number" min="0.05" max="20" step="any" value="${region.factor}" aria-label="EI multiplier"><small>× base EI</small></div><em class="field-error"></em></label><p id="stiffness-dialog-error" class="stiffness-dialog-error" role="alert"></p><div class="dialog-actions">${(0,common_1.button)('stiffness-save:'+(existing ? existing.id : 'new'), existing ? 'Save EI zone' : 'Add EI zone', 'primary')}${(0,common_1.button)('dialog-close','Cancel','secondary')}</div>`);
}
function trajectoryTopicDialog(topic) {
    if (v.session?.active || v.session?.review) return;
    const d = (0, topic_drilldown_1.detail)(v.level, topic, learningEvidenceEvents, masteryStats, lessonProgress, challengeProgress);
    if (!d.current) { toast('No retained learning evidence is available for this topic.'); return; }
    const timeLabel = value => {
        if (!value) return 'Time not recorded';
        try { return new Date(value).toLocaleString([], { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }
        catch { return 'Recorded locally'; }
    };
    const eventRows = d.events.map((row, index) => {
        const response = row.answer || row.expected ? `<div class="topic-event-response">${row.answer ? `<span><b>Your response</b>${(0,common_1.esc)(row.answer)}</span>` : ''}${row.expected ? `<span><b>Reference</b>${(0,common_1.esc)(row.expected)}</span>` : ''}</div>` : '';
        return `<article class="topic-event ${(0,common_1.esc)(row.stateKey)}"><div class="topic-event-index">${String(index+1).padStart(2,'0')}</div><div class="topic-event-body"><div class="topic-event-head"><b>${(0,common_1.esc)(row.taskTitle)}</b><span>${(0,common_1.esc)(row.outcome)}</span></div><small>${(0,common_1.esc)(row.kind === 'lesson' ? 'Concept lesson' : row.kind === 'challenge' ? 'Numerical challenge' : 'Learning activity')} · ${(0,common_1.esc)(row.mode)} · ${(0,common_1.esc)(timeLabel(row.timestamp))}</small>${response}<div class="topic-state-after">Trajectory after this event: <b>${(0,common_1.esc)(row.stateAfter)}</b></div></div></article>`;
    }).join('');
    const taskRows = d.tasks.map(task => `<div class="topic-task-row"><div><b>${(0,common_1.esc)(task.title)}</b><small>${task.kind === 'lesson' ? 'Concept lesson' : 'Numerical challenge'} · ${task.completed ? 'completed before' : 'not yet complete'}</small></div><span>${task.completed ? 'COMPLETE' : 'AVAILABLE'}</span></div>`).join('');
    const next = d.nextTask
        ? `<section class="topic-next"><div><span class="eyebrow">BEST NEXT EXERCISE / DETERMINISTIC</span><b>${(0,common_1.esc)(d.nextTask.title)}</b><p>${(0,common_1.esc)(d.nextReason)}</p><small>${d.nextTask.kind === 'lesson' ? 'Concept lesson' : 'Numerical challenge'} · ${(0,common_1.esc)(d.topic)}</small></div>${(0,common_1.button)(`trajectory-next:${d.nextTask.kind}|${d.nextTask.id}`, 'Open this exercise', 'primary')}</section>`
        : `<section class="topic-next no-drill"><div><span class="eyebrow">TOPIC-SPECIFIC NEXT STEP</span><b>No repeat drill recommended.</b><p>${(0,common_1.esc)(d.nextReason)}</p><small>Use the broader Recommended Next path to keep progressing.</small></div></section>`;
    openDialog(d.topic + ' · trajectory evidence', `<section class="topic-drilldown"><header class="topic-drill-head ${(0,common_1.esc)(d.current.status)}"><div><span class="eyebrow">RECENT TRAJECTORY / LOCAL EVIDENCE</span><h3>${(0,common_1.esc)(d.current.label)}</h3><p>${(0,common_1.esc)(d.current.explanation)}</p></div><strong>${d.current.masteryScore === null ? 'NO AGGREGATE SCORE' : (0,common_1.esc)(d.current.masteryScore + '% mastery heuristic')}</strong></header><div class="topic-drill-grid"><section><div class="topic-section-head"><span>EVENTS BEHIND THIS STATE</span><small>Newest retained evidence is at the bottom.</small></div><div class="topic-events">${eventRows || '<p class="muted">No retained events.</p>'}</div></section><aside><div class="topic-section-head"><span>AVAILABLE TASKS AT THIS LEVEL</span><small>These are the lesson/challenge records BeamLab can link to this topic.</small></div><div class="topic-tasks">${taskRows || '<p class="muted">No mapped tasks at this level.</p>'}</div></aside></div>${next}<p class="topic-boundary">${(0,common_1.esc)(d.boundary)}</p></section>`);
}
function referenceExample() { const m = (0, study_1.normalise)((0, examples_1.example)('simple')); m.name = 'Centre load / 6 metre study'; m.length = 6; m.items = m.items.filter(i => (0, validation_1.isSupport)(i.kind)); m.items[1].x = 6; const o = { ...(0, examples_1.makeItem)('point', 3, undefined, 20), label: 'P1', colour: '#f19b82', caseId: m.cases[0].id }; m.items.push(o); return m; }
function loadExample(key) { v.zoom = 1; v.pan = 0; commit(key === 'reference' ? referenceExample() : (0, study_1.normalise)((0, examples_1.example)(key)), 'Load example', false); if (!sessionLoading && !standaloneOrigin) toast('Example loaded. Undo restores your previous model.'); }
function openLibrary() {
    let records = [];
    try {
        records = JSON.parse(localStorage.getItem(storageKey + ':library') || '[]');
        if (!Array.isArray(records)) records = [];
    }
    catch { }
    openDialog('Your saved studies', `<p>Stored only in this browser. Export important models as JSON.</p>${(0, common_1.button)('save-named', 'Save current study', 'primary')}<div class="library-list">${records.map((r, i) => `<div><b>${(0, common_1.esc)(r.name)}</b><span>${(0, common_1.fmt)(r.model.length)} m</span>${(0, common_1.button)('open-named:' + i, 'Open', 'secondary')}${(0, common_1.button)('delete-named:' + i, (0, common_1.icon)('trash', 13), 'icon-button', false, 'Delete saved study')}</div>`).join('') || '<p class="muted">No named snapshots yet.</p>'}</div>`);
}
async function doExport(kind) {
    if (activity.resultActionBlocked(v, 'export', kind)) { toast(activity.restrictionMessage(v)); return; }
    if (exportBusy) { toast('An export is already being prepared.'); return; }
    finishField();
    $('#export-menu').hidden = true;
    const m = (0, study_1.clone)(history.model), a = analysis;
    exportBusy = true;
    document.querySelectorAll('[data-action^="export:"]').forEach(b => b.disabled = true);
    try {
        if (kind === 'json') {
            (0, export_1.download)(JSON.stringify(m, null, 2), 'beamlab-model.json', 'application/json');
            return;
        }
        if (!a) {
            toast('Complete a valid model before exporting results.');
            return;
        }
        if (kind === 'csv')
            (0, export_1.download)((0, export_1.resultsCsv)(a), 'beamlab-results.csv', 'text/csv');
        if (kind === 'svg')
            (0, export_1.download)((0, export_1.svgDocument)(m, a, diagramView()), 'beamlab-diagrams.svg', 'image/svg+xml');
        if (kind === 'png') {
            toast('Rendering the annotated PNG...');
            await (0, export_1.pngExport)(m, a, diagramView());
            toast('PNG created.');
        }
        if (kind === 'pdf') {
            toast('Preparing the calculation report...');
            const bytes = await (0, export_1.pdfReport)(m, a, diagramView());
            (0, export_1.download)(bytes, 'beamlab-calculation-report.pdf', 'application/pdf');
            toast('PDF report created.');
        }
    }
    catch (e) {
        toast(e instanceof Error ? e.message : 'Export failed. Use JSON or SVG instead.');
    } finally {
        exportBusy = false;
        document.querySelectorAll('[data-action^="export:"]').forEach(b => b.disabled = false);
    }
}
function share() {
    const code = (0, export_1.snapshotCode)(history.model), url = publicOrigin ? location.href.split('#')[0] + '#model=' + code : code;
    openDialog('Share a model snapshot', `<p>${publicOrigin ? 'Anyone with this link can read the complete model snapshot. No account is needed.' : 'This is the downloadable edition. Share the snapshot code with someone using this same HTML build. Public links require hosting this build first.'}</p><p class="hint">The snapshot is encoded, not encrypted. Avoid including confidential project information.</p><textarea id="share-code" aria-label="Model snapshot code" readonly>${(0, common_1.esc)(url)}</textarea>${(0, common_1.button)('copy-share', 'Copy snapshot', 'primary')}<div class="divider"></div><h3>Open a shared snapshot</h3><textarea id="paste-snapshot" aria-label="Paste model snapshot" placeholder="Paste a BLSTUDIO3: code or a compatible model link"></textarea>${(0, common_1.button)('open-snapshot', 'Open snapshot', 'secondary')}`);
}
function openHistory() { openDialog('Edit history', `<p>Up to 80 edits are kept in this session. Dragging a group counts as one edit. Reload keeps the model, not its history.</p><div class="history-list">${history.past.slice().reverse().map((e, i) => `<div><span>${history.past.length - i}</span><b>${(0, common_1.esc)(e.label)}</b></div>`).join('') || '<p>No edits yet.</p>'}</div>${(0, common_1.button)('undo-dialog', 'Undo latest', 'secondary', activity.modelLocked(v) || !history.past.length)}`); }
function privacyDialog() {
    openDialog('Privacy & local data', `<h3>Your model stays on this device.</h3><p>BeamLab stores the current study, named local studies, learning evidence and review inputs in this browser. There is no account or analytics tracker in this release. Clearing this browser's site data removes these local copies.</p><h3>When data leaves your browser</h3><p>Exports are files you choose to save. Shared model links contain an encoded, readable snapshot; anyone with the link can open it. If you choose the optional online tutor, your question, recent conversation and structured model/learning context are sent to the hosting endpoint and its configured AI provider. The tutor never runs automatically and is disabled in exams.</p><p>Model calculations, Show Why and practice work without the online tutor. Export a JSON copy before changing devices. Only include information you intend to share in a snapshot or public issue.</p>`);
}
function issueReport() {
    const audit=analysis?verification.audit(history.model,analysis):null;
    const report={release:verification.RELEASE,reference:verification.fingerprint(history.model),model:history.model,checks:audit?.checks||[],error:error||null,stepsToReproduce:'Describe what you did, what you expected, and what happened.'};
    openDialog('Prepare an issue report', `<p>Download the report below, add reproduction steps, then attach it to a GitHub issue. Review the model labels before posting; this repository is public.</p><textarea aria-label="Issue report JSON" id="issue-json" readonly>${(0,common_1.esc)(JSON.stringify(report,null,2))}</textarea><button data-action="issue-download" class="primary">Download issue report</button><a class="secondary" href="https://github.com/parrasuccess-blip/BeamLab_Studio/issues/new" target="_blank" rel="noopener noreferrer">Open GitHub issue form ↗</a>`);
}
function method() { openDialog('Method, sources & scope', `<span class="eyebrow">TRANSPARENT BY DESIGN</span><h3>Engineering calculations, not generated answers.</h3><p>Euler-Bernoulli matrix stiffness with event-aligned nodes, local section/EI properties and exact polynomial field recovery for supported loads. Support vertical displacement and fixed-support rotation may be prescribed (mm upward and mrad counter-clockwise). The same deterministic engine drives every result and export.</p><h3>Sign conventions</h3><p>Loads are entered positive downward. Reactions are positive upward. Applied couples are positive counter-clockwise. Sagging moment is positive and plotted upward. Displacement is positive upward: a downward deflected shape appears below its undeformed line. Extreme-fibre tension is positive.</p><h3>Limits of this edition</h3><p>No shear deformation, axial response, dynamics, geometric non-linearity, concrete cracking or code-design certification. The model supports uniform members and abrupt prismatic section/EI regions. Transition stresses, smooth tapers and thermal curvature are outside this release. Manual stress/displacement limits are not code checks. Catalogue PFC entries do not model torsion. Locking protects objects from direct editing, not undo or whole-model replacement.</p><h3>Moving loads and shear profiles</h3><p>The optional moving-load lab uses a separately formulated fixed-topology Hermite point-load solver. It uses the same local sections and EI regions. Moving response is incremental: prescribed support movements enter only through the optional static base case. Plotted axle envelopes remain sampled. It is static, not dynamic, and adds no impact or code vehicle. The optional transverse-shear profile is available only for dimension-derived rectangles and symmetric I-sections; no shear deformation is added to the beam model.</p><h3>Material and section sources</h3><p>The 51-row UB/UC/PFC reference library uses manufacturer-tabulated area and horizontal Ix from Liberty / InfraBuild HRSSP ninth edition, October 2019, Tables 9, 11 and 15. Preset E and density remain labelled illustrative. RHS/SHS geometry is a sharp-corner approximation; circular solid and hollow sections use exact ideal-circle formulas. These derived shapes are not manufacturer catalogue claims.</p><a href="${catalogue_1.catalogueSource}" target="_blank" rel="noopener noreferrer">Open manufacturer catalogue</a><p><a href="https://interactivetextbooks.citg.tudelft.nl/computational-modelling/structural_linear/euler_bernouilli.html" target="_blank" rel="noopener noreferrer">TU Delft: beam-element formulation</a></p><h3>Guided criteria review / boundary</h3><p>Studio 4.1 separates Analysis from Design. Design demand is read directly from the same deterministic solver, while bending/shear capacities and serviceability criteria are user-supplied. BeamLab does not yet automate AS 4100 member capacity, AS/NZS load combinations, section classification, lateral-torsional buckling, combined actions or connection design. A ratio below 1.0 means only that solver demand is below the value the user entered.</p><h3>AI and deployment</h3><p>The optional contextual tutor may explain both Analysis and Design Studio context, but it is instructed never to invent missing capacities, load combinations or code compliance. The deterministic beam solver remains the source of numerical truth. AI is disabled in Exam Mode. In the downloadable HTML, the tutor simply reports unavailable while deterministic teaching, analysis and Design Studio continue to work.</p>`); }
function finishField(preserveFocus = false) {
    if (!fieldTransaction)
        return;
    // Tab has already moved focus. Keep its native destination when rebuilding
    // the controls after the edit; pointer clicks still finish in their action.
    const focused = preserveFocus ? document.activeElement : null;
    const focusRoot = focused?.closest('[id]');
    const focusAttribute = focused && ['data-field', 'data-select', 'data-text', 'data-action', 'aria-label', 'href'].find(key => focused.hasAttribute(key));
    const focusSelector = focused?.id ? '#' + CSS.escape(focused.id) : focusRoot && focusAttribute
        ? '#' + CSS.escape(focusRoot.id) + ' [' + focusAttribute + '="' + CSS.escape(focused.getAttribute(focusAttribute)) + '"]' : null;
    const t = fieldTransaction;
    fieldTransaction = null;
    if (activity.modelLocked(v) && !sessionLoading) { history.model = t.base; render(); return; }
    const next = history.model;
    history.model = t.base;
    if (t.input.getAttribute('aria-invalid') === 'true') {
        toast('Invalid value was not applied. The previous value is restored.');
    }
    else if (verification.canonical(next) !== verification.canonical(t.base)) {
        levelStarterActive = false;
        history.commit(next, t.description);
    }
    layout = undefined;
    render();
    save();
    if (focusSelector) $(focusSelector)?.focus({ preventScroll: true });
}
function updateHistoryControls() {
    const pendingEdit = fieldTransaction && fieldTransaction.input.getAttribute('aria-invalid') !== 'true'
        && verification.canonical(history.model) !== verification.canonical(fieldTransaction.base);
    // A first valid edit must make Undo clickable before focus leaves the field.
    // Update existing buttons in place so a pointer target is never replaced.
    $('#toolbar [data-action="undo"]').disabled = activity.modelLocked(v) || (!history.past.length && !pendingEdit);
    $('#toolbar [data-action="redo"]').disabled = activity.modelLocked(v) || !history.future.length || !!pendingEdit;
}
function applyNumber(input) {
    if (blockModelEdit()) return;
    pauseSweep();
    const key = input.dataset.field;
    // A user can return to the same field before its deferred Tab commit runs.
    // Commit that completed edit before starting the next one, without replacing
    // the incoming input or a pressed pointer target.
    if (fieldTransaction && (fieldTransaction.input !== input || fieldTransaction.tabbed)) {
        const previous = fieldTransaction; fieldTransaction = null;
        const next = history.model; history.model = previous.base;
        if (previous.input.getAttribute('aria-invalid') !== 'true' && verification.canonical(next) !== verification.canonical(previous.base)) { levelStarterActive = false; history.commit(next, previous.description); }
    }
    if (!fieldTransaction)
        fieldTransaction = { base: (0, study_1.clone)(history.model), description: 'Edit ' + (input.getAttribute('aria-label') || key), input };
    const text = input.value.trim(), n = Number(text), nullable = key.startsWith('review:');
    const valid = (nullable && text === '') || (text !== '' && Number.isFinite(n) && n >= Number(input.min) && n <= Number(input.max));
    input.setAttribute('aria-invalid', String(!valid));
    const em = input.closest('.field')?.querySelector('.field-error');
    if (em)
        em.textContent = valid ? '' : `Not applied. Enter ${input.min} to ${input.max}.`;
    if (!valid) {
        updateHistoryControls();
        return;
    }
    const m = (0, study_1.clone)(history.model);
    const parts = key.split(':');
    if (key === 'length') {
        if (m.items.some(i => i.locked)) {
            toast('Unlock all objects before changing member length.');
            input.setAttribute('aria-invalid', 'true');
            updateHistoryControls();
            return;
        }
        const ratio = n / m.length;
        m.length = n;
        m.items.forEach(i => { i.x *= ratio; if (i.end !== undefined)
            i.end *= ratio; });
        (m.sectionRegions || []).forEach(r => { r.x *= ratio; r.end *= ratio; });
        (m.stiffnessRegions || []).forEach(r => { r.x *= ratio; r.end *= ratio; });
        v.pan = 0;
    }
    else if (parts[0] === 'section') {
        m.section[parts[1]] = n;
    }
    else if (parts[0] === 'item') {
        const i = m.items.find(i => i.id === parts[1]);
        if (!i || i.locked)
            return;
        i[parts[2]] = n;
    }
    else if (parts[0] === 'case') {
        const c = m.cases.find(c => c.id === parts[1]);
        if (c)
            c.factor = n;
    }
    else if (parts[0] === 'review') {
        m.review || (m.review = { displacementMm: null, stressMPa: null });
        m.review[parts[1]] = text === '' ? null : n;
    }
    history.model = m;
    solve();
    renderStage();
    renderExtras(true);
    updateHistoryControls();
}
function textChanged(input) {
    if (blockModelEdit()) return;
    const key = input.dataset.text, m = (0, study_1.clone)(history.model), text = input.value.trim();
    if (!text) {
        toast('A name cannot be empty.');
        render();
        return;
    }
    if (key === 'name')
        m.name = text;
    else if (key.startsWith('case:')) {
        const c = m.cases.find(c => c.id === key.slice(5));
        if (c)
            c.name = text;
    }
    commit(m, 'Rename ' + (key === 'name' ? 'study' : 'case'));
}
async function action(key, el) {
    if (!key.startsWith('copy-'))
        finishField();
    const [name, ...rest] = key.split(':'), id = rest.join(':');
    if (activity.resultActionBlocked(v, name, id)) { toast(activity.restrictionMessage(v)); return; }
    if (!['sweep-play','demo-notes','dismiss-toast'].includes(name)) pauseSweep();
    if (name === 'sweep-play') { if (sweepPlaying) pauseSweep(); else playSweep(); return; }
    if (name === 'sweep-reset') { sweepProgress = .5; sweepDirection = 1; applySweep(); return; }
    if (name === 'demo-notes') { demoNotes = !demoNotes; renderDemo(); return; }
    if (name === 'fullscreen') {
        try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else toast('Fullscreen is unavailable. Focus mode still works.'); }
        catch { toast('Fullscreen was not allowed by this browser. Use Focus mode instead.'); }
        return;
    }
    if (name === 'audit') { auditDialog(); return; }
    if (name === 'shortcuts') { shortcutsDialog(); return; }
    if (name === 'ai-open') { openTutor(); return; }
    if (name === 'ai-clear') { aiTutor.history = []; aiTutor.error = ''; aiTutor.mode = 'question'; renderTutorDialog(); return; }
    if (name === 'ai-send') { await askTutor('question'); return; }
    if (name === 'ai-quick') { const prompt = tutorPromptText(id); if (prompt) await askTutor(id, prompt); return; }
    if (name === 'ai-design') { const prompt = tutorPromptText('design'); if (prompt) { openTutor(); await askTutor('design', prompt); } return; }
    if (name === 'design-open') { if (!(0,levels_1.canUseFeature)(activity.toolLevel(v),'review')) return; v.reviewDetail='criteria'; designStep=1;renderDesignStudio();return; }
    if(name==='progress-transfer'){learningTransferDialog();return;}
    if(name==='progress-export'){const payload=learningTransfer.create(lessonProgress,challengeProgress,masteryStats,learningEvidenceEvents);(0,export_1.download)(JSON.stringify(payload,null,2),'beamlab-learning-progress.json','application/json');return;}
    if(name==='progress-import'){if(v.session?.active||v.session?.review)return;$('#progress-file').value='';$('#progress-file').click();return;}
    if(name==='progress-import-confirm'){
        if(!pendingLearningImport||v.session?.active||v.session?.review)return;
        const incoming=pendingLearningImport;pendingLearningImport=null;
        lessonProgress=incoming.lessons;challengeProgress=incoming.challenges;masteryStats=incoming.mastery;learningEvidenceEvents=incoming.events;
        v.lessonProgress=lessonProgress;v.challengeProgress=challengeProgress;saveLessonProgress();saveChallengeProgress();saveMasteryStats();saveLearningEvidence();clearGuidedStudyBlockResume();closeDialog();render();toast('Learning progress imported. Your structural study is unchanged.');return;
    }
    if (name === 'review-overview') {v.reviewDetail='overview';renderDesignStudio();return;}
    if (name === 'section-side') {if(['left','right'].includes(id)){v.sectionSide=id;renderExtras();}return;}
    if (name === 'issue-download') {(0,export_1.download)($('#issue-json').value,'beamlab-issue-report.json','application/json');return;}
    if (name === 'privacy') {privacyDialog();return;}
    if (name === 'issue-report') {issueReport();return;}
    if (name === 'workflow') { setWorkflow(id); return; }
    if (name === 'level-preferences') { v.levelPreferencesOpen = !v.levelPreferencesOpen; renderLearningBar(); return; }
    if (name === 'learning-library') {
        if (v.session?.active || v.session?.review) return;
        endStandaloneLearning();
        v.tab = 'learn'; v.controls = true;
        render(); save();
        const first = $('#controls .lesson-list button') || $('#controls .challenge-list button');
        first?.focus();
        return;
    }
    if (name === 'workspace-mode') { setWorkspaceMode(id); return; }
    if (name === 'design-step') { setDesignStep(id); return; }
    if (name === 'design-next') { setDesignStep(designStep + 1); return; }
    if (name === 'design-back') { setDesignStep(designStep - 1); return; }
    if (name === 'design-jump') { if (!analysis) return; const x = id === 'shear' ? analysis.peakV.x : id === 'deflection' ? analysis.peakD.x : analysis.peakM.x; v.workspaceMode='analysis'; v.trace=x; v.pinned=true; render(); $('#structure-block')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}); return; }
    if (name === 'design-edit-cases') { if (!(0,levels_1.canUseFeature)(activity.toolLevel(v),'cases')) { toast('Load-case editing is available in 3rd+ or All Tools.'); return; } v.workspaceMode='analysis'; v.tab='cases'; render(); return; }
    if (name === 'design-combination') { const c=(history.model.combinations||[]).find(c=>c.id===id); if(c) { commit((0,study_1.setCombination)(history.model,c.factors),'Apply '+c.name+' for design review'); v.workspaceMode='design'; render(); } return; }
    if (name === 'design-export') { if (!analysis) { toast('Complete a stable model before exporting a design review.'); return; } try { const snap=(0,design_1.reviewSnapshot)(history.model,analysis,designSettings,verification.fingerprint(history.model)); (0,export_1.download)(JSON.stringify(snap,null,2),'beamlab-design-review.json','application/json'); toast('Design review JSON created.'); } catch(e) { toast(e instanceof Error?e.message:'Could not export the design review.'); } return; }
    if (name === 'design-reset') { openDialog('Reset Design Studio inputs?', `<p>This clears only the manually entered capacities, serviceability criterion, yield reference and design notes. The structural model and analysis are untouched.</p>${(0,common_1.button)('design-reset-confirm','Reset design inputs','danger')}`); return; }
    if (name === 'design-reset-confirm') { designSettings=(0,design_1.defaults)(); saveDesignSettings(); closeDialog(); renderDesignStudio(); toast('Design inputs reset. The structural model was not changed.'); return; }
    if (name === 'compare-details') { compareDialog(); return; }
    if (name === 'annotation-cycle') { const order = ['clean','guided','detailed']; v.annotationMode = order[(order.indexOf(v.annotationMode) + 1) % order.length]; v.annotations = v.annotationMode !== 'clean'; render(); save(); return; }
    if (name === 'learn-section') {
        if (!['lessons','challenges','session'].includes(id)) return;
        if ((v.session?.active || v.session?.review) && id !== 'session') { toast('Finish or close the current learning session first.'); return; }
        if (id !== v.learnSection) endStandaloneLearning();
        v.learnSection = id; render(); save(); return;
    }
    if (name === 'session-start') { startLearningSession(id); return; }
    if (name === 'study-block-resume') { resumeGuidedStudyBlock(); return; }
    if (name === 'study-block-resume-discard') { clearGuidedStudyBlockResume(); render(); toast('Saved guided study block discarded.'); return; }
    if (name === 'session-next') { sessionAdvance(); return; }
    if (name === 'session-skip') { if (!questionIsCurrent()) return; sessionSkipCurrent(); return; }
    if (name === 'session-exit') { requestSessionExit(); return; }
    if (name === 'session-exit-confirm') { const old=v.session; if (old?.mode === 'plan') clearGuidedStudyBlockResume(); const destination = pendingWorkspace; pendingWorkspace = null; closeDialog(); restoreSessionOrigin(old); if (destination) setWorkflow(destination); return; }
    if (name === 'session-restore-question') { if (v.session?.active && v.session.questionModel) { history.model = (0,study_1.clone)(v.session.questionModel); v.activityMismatch = false; render(); } return; }
    if (name === 'activity-restart') { const task = v.changedActivity; if (task) { if (task.kind === 'lesson') startLesson(task.id); else startChallenge(task.id); } return; }
    if (name === 'session-review-close') { const old=v.session; restoreSessionOrigin(old); return; }
    if (name === 'session-review-next') { sessionReviewNext(); return; }
    if (name === 'session-review-plan-again') { sessionReviewPlanAgain(); return; }
    if (name === 'mastery-review') { const [kind,taskId]=id.split('|'); v.learnSection=kind==='lesson'?'lessons':'challenges'; if(kind==='lesson') startLesson(taskId); else startChallenge(taskId); return; }
    if (name === 'trajectory-topic') {
        if (v.session?.active || v.session?.review) return;
        try { trajectoryTopicDialog(decodeURIComponent(id)); } catch { toast('Could not open this topic evidence view.'); }
        return;
    }
    if (name === 'trajectory-next') {
        const [kind,taskId] = id.split('|');
        closeDialog();
        v.tab = 'learn';
        if (kind === 'lesson') { v.learnSection='lessons'; startLesson(taskId); }
        else if (kind === 'challenge') { v.learnSection='challenges'; startChallenge(taskId); }
        return;
    }
    if (name === 'recommended-next') {
        if (v.session?.active || v.session?.review) return;
        const [kind,taskId] = id.split('|');
        if (kind === 'lesson') { v.learnSection='lessons'; startLesson(taskId); }
        else if (kind === 'challenge') { v.learnSection='challenges'; startChallenge(taskId); }
        else if (kind === 'session' && taskId === 'practice') startLearningSession('practice');
        return;
    }
    if (name === 'study-plan-step') {
        if (v.session?.active || v.session?.review) return;
        const [kind,taskId] = id.split('|');
        v.tab = 'learn';
        if (kind === 'lesson') { v.learnSection='lessons'; startLesson(taskId); }
        else if (kind === 'challenge') { v.learnSection='challenges'; startChallenge(taskId); }
        else if (kind === 'session' && taskId === 'practice') { v.learnSection='session'; startLearningSession('practice'); }
        return;
    }
    if (name === 'lesson-start') { if (v.session?.active) return; startLesson(id); return; }
    if (name === 'lesson-method') { if (v.session?.active && v.session.mode === 'exam') { toast('Exam mode uses your own sketch for diagram questions.'); return; } if (['choice','sketch'].includes(id)) { v.lessonMethod = id; v.lessonFeedback = null; v.lessonSketchResult = null; render(); } return; }
    if (name === 'lesson-choice') { if (v.session?.active && v.session.currentLocked) return; v.lessonChoice = id; v.lessonFeedback = null; v.lessonSketchResult = null; render(); return; }
    if (name === 'lesson-sketch-clear') { if (v.session?.active && v.session.currentLocked) return; v.lessonSketch = []; v.lessonSketchResult = null; v.lessonSketchReference = false; v.lessonSketchReferencePoints = []; v.lessonFeedback = null; render(); return; }
    if (['lesson-sketch-check','lesson-check','lesson-reveal','challenge-check','challenge-reveal','session-skip'].includes(name) && !questionIsCurrent()) return;
    if (name === 'lesson-sketch-check') {
        const spec = currentLesson();
        if (!spec || !analysis || (v.session?.active && v.session.currentLocked)) return;
        try {
            const result = (0, challenges_1.checkSketch)(spec, v.lessonSketch, analysis, history.model);
            if (!result.ready) { v.lessonSketchResult = result; v.lessonFeedback = {kind:'warn',text:'Draw across most of the beam before checking your sketch.'}; render(); return; }
            const expectedKey = (0,challenges_1.predictionFor)(spec,analysis,history.model), expectedLabel = sessionExpectedLabel(spec,expectedKey);
            const exam = !!v.session?.active && v.session.mode === 'exam';
            recordMastery('lesson',spec,result.correct,exam);
            sessionRecordAttempt('lesson',spec,result.correct,'Freehand sketch / '+Math.round(result.score*100)+'% feature match',expectedLabel,{sketchScore:result.score});
            if (exam) {
                v.lessonSketchResult = null; v.lessonSketchReference = false; v.lessonSketchReferencePoints = [];
                v.lessonFeedback = {kind:'exam',text:'Sketch recorded. BeamLab will grade and explain it in the session review.'};
                render(); return;
            }
            v.lessonSketchResult = result;
            if (result.correct) {
                lessonProgress[spec.id] = true; saveLessonProgress();
                v.practiceStep = Math.max(v.practiceStep || 0, spec.revealStep || 2);
                v.lessonSketchReference = true; v.lessonSketchReferencePoints = (0, challenges_1.sketchReference)(spec, analysis, history.model);
                v.lessonFeedback = {kind:'pass',text:'Good structural prediction. The intended response layer is now revealed so you can compare it with your sketch.'};
            } else {
                v.lessonSketchReference = false; v.lessonSketchReferencePoints = [];
                v.lessonFeedback = {kind:'fail',text:'Not yet. Use the feature feedback above and adjust the sketch before revealing the solver reference.'};
            }
            render(); save();
        } catch(e) { toast(e instanceof Error ? e.message : 'Could not assess this sketch.'); }
        return;
    }
    if (name === 'lesson-check') {
        const spec = currentLesson();
        if (!spec || !analysis || (v.session?.active && v.session.currentLocked)) return;
        if (!v.lessonChoice) { v.lessonFeedback = {kind:'warn',text:'Choose the diagram you expect before checking.'}; render(); return; }
        try {
            const result = (0, challenges_1.checkPrediction)(spec, v.lessonChoice, analysis, history.model);
            const expectedLabel=sessionExpectedLabel(spec,result.expected), answerLabel=sessionExpectedLabel(spec,v.lessonChoice), exam=!!v.session?.active&&v.session.mode==='exam';
            recordMastery('lesson',spec,result.correct,exam); sessionRecordAttempt('lesson',spec,result.correct,answerLabel,expectedLabel);
            if (exam) { v.lessonFeedback={kind:'exam',text:'Answer recorded. BeamLab will grade and explain it in the session review.'}; render(); return; }
            if (result.correct) {
                lessonProgress[spec.id] = true; saveLessonProgress();
                v.practiceStep = Math.max(v.practiceStep || 0, spec.revealStep || 2);
                v.lessonFeedback = {kind:'pass',text:'Correct. BeamLab has revealed the calculated response so you can compare your prediction with the solver.'};
            } else v.lessonFeedback = {kind:'fail',text:'Not quite. Keep the load → shear → moment relationship in mind and try another shape before revealing it.'};
            render(); save();
        } catch(e) { toast(e instanceof Error ? e.message : 'Could not check this prediction.'); }
        return;
    }
    if (name === 'lesson-reveal') {
        const spec = currentLesson();
        if (v.session?.active && v.session.mode === 'exam') { toast('Solutions stay hidden until the exam session is submitted.'); return; }
        if (spec && analysis) {
            try { const expected = (0, challenges_1.predictionFor)(spec, analysis, history.model), expectedLabel=sessionExpectedLabel(spec,expected); recordReveal('lesson',spec); sessionRecordReveal('lesson',spec,expectedLabel); v.practiceStep = Math.max(v.practiceStep || 0, spec.revealStep || 2); v.lessonFeedback = {kind:'reveal',text:'Reference response revealed for comparison. Revealing does not mark the lesson complete.'}; v.lessonChoice = expected; if (v.lessonMethod === 'sketch') { v.lessonSketchReference = true; v.lessonSketchReferencePoints = (0, challenges_1.sketchReference)(spec, analysis, history.model); } render(); save(); }
            catch(e) { toast(e instanceof Error ? e.message : 'Could not reveal this lesson.'); }
        }
        return;
    }
    if (name === 'lesson-next') { if(v.session?.active){sessionAdvance();return;} const list=(0,challenges_1.listLessons)(v.level); const next=list.find(c=>!lessonProgress[c.id])||list[0]; if(next) startLesson(next.id); return; }
    if (name === 'lesson-reset') { if(v.session?.active||v.session?.review)return; openDialog('Reset learning progress', `<p>This clears completed mini-lessons, numerical challenges and local mastery history on this browser. It does not change your structural model.</p>${(0, common_1.button)('lesson-reset-confirm','Reset progress','danger')}`); return; }
    if (name === 'lesson-reset-confirm') { lessonProgress={}; challengeProgress={}; masteryStats={}; learningEvidenceEvents=[]; clearGuidedStudyBlockResume(); v.lessonProgress=lessonProgress; v.challengeProgress=challengeProgress; v.masteryStats=masteryStats; try { localStorage.removeItem(storageKey+':lessons'); localStorage.removeItem(storageKey+':challenges'); localStorage.removeItem(storageKey+':mastery'); localStorage.removeItem(storageKey+':learning-evidence'); } catch {} closeDialog(); render(); toast('Learning progress, mastery and recent learning evidence reset. Any saved study block was also cleared. Your beam model was not changed.'); return; }
    if (name === 'explain-here') {
        if (!visibility().complete) { openDialog('Think through the beam', `<p>${(0,common_1.esc)(activity.restrictionMessage(v))}</p>${visibility().exam ? '' : '<p>Start with the free-body diagram. Use load direction to predict how shear changes, then use the sign of shear to predict whether moment rises or falls.</p>'}`); return; }
        if (v.session?.active && v.session.mode === 'exam') { toast('Show Why is hidden until the exam session is submitted.'); return; }
        if (!analysis) { toast('Complete a stable model first.'); return; }
        try {
            const x = v.trace === null ? analysis.peakM.x : v.trace;
            const e = (0, challenges_1.explainAt)(history.model, analysis, x, v.level);
            openDialog('Why does the beam behave like this here?', `<div class="context-explain-dialog"><span class="eyebrow">x = ${(0,common_1.fmt)(e.x,3)} m / ${(0,common_1.esc)((0,levels_1.mode)(v.level).short)}</span><h3>${(0,common_1.esc)(e.title)}</h3><div class="formula">${(0,common_1.esc)(e.formula)}</div>${e.lines.map(line=>`<p>${(0,common_1.esc)(line)}</p>`).join('')}<p class="hint">This explanation is generated deterministically from the current solved model; it is not an AI answer or a design check.</p></div>`);
        } catch(e) { toast(e instanceof Error ? e.message : 'Could not explain this location.'); }
        return;
    }
    if (name === 'challenge-start') { if(v.session?.active)return; v.lessonId=null; v.lessonChoice=null; v.lessonFeedback=null; v.lessonSketch=[]; v.lessonSketchResult=null; v.lessonSketchReference=false; v.lessonSketchReferencePoints=[]; startChallenge(id); return; }
    if (name === 'challenge-check') {
        const spec = currentChallenge(), input = $('#challenge-answer');
        if (!spec || !analysis || !input || (v.session?.active && v.session.currentLocked)) return;
        const guess = Number(input.value);
        if (!input.value.trim() || !Number.isFinite(guess)) { v.challengeFeedback = {kind:'warn',text:'Enter a numerical answer before checking.'}; render(); return; }
        try {
            const result = (0, challenges_1.checkAnswer)(spec, guess, analysis), exam=!!v.session?.active&&v.session.mode==='exam';
            recordMastery('challenge',spec,result.correct,exam); sessionRecordAttempt('challenge',spec,result.correct,(0,common_1.fmt)(guess,4)+' '+spec.unit,(0,common_1.fmt)(result.expected,4)+' '+spec.unit);
            if (exam) { v.challengeFeedback={kind:'exam',text:'Answer recorded. BeamLab will show the mark and reference value after the session.'}; render(); return; }
            if (result.correct) { v.practiceStep = 4; challengeProgress[spec.id] = true; saveChallengeProgress(); v.challengeFeedback = {kind:'pass',text:'Correct. ' + (0, common_1.fmt)(result.expected,4) + ' ' + spec.unit + ' is within the accepted tolerance (1% or 0.02 units, whichever is larger).'}; }
            else v.challengeFeedback = {kind:'fail',text:'Not quite. Your answer is ' + (0, common_1.fmt)(result.error,4) + ' ' + spec.unit + ' away. Check the free-body diagram and sign/magnitude, then try again.'};
            render();
        } catch(e) { toast(e instanceof Error ? e.message : 'Could not check this answer.'); }
        return;
    }
    if (name === 'challenge-reveal') { const spec=currentChallenge(); if(v.session?.active&&v.session.mode==='exam'){toast('Solutions stay hidden until the exam session is submitted.');return;} if(spec&&analysis){ const expected=(0,challenges_1.answerFor)(spec,analysis), expectedText=(0,common_1.fmt)(expected,4)+' '+spec.unit; v.practiceStep = 4; recordReveal('challenge',spec); sessionRecordReveal('challenge',spec,expectedText); v.challengeFeedback={kind:'reveal',text:'Reference answer: '+expectedText+'. Revealing an answer does not mark the challenge complete.'}; render(); } return; }
    if (name === 'challenge-next') { if(v.session?.active){sessionAdvance();return;} const list=(0,challenges_1.listChallenges)(v.level); const next=list.find(c=>!challengeProgress[c.id])||list[0]; if(next) startChallenge(next.id); return; }
    if (name === 'activity-reveal-all') {
        if (!activity.isLearning(v) || visibility().exam || !questionIsCurrent()) return;
        const lesson = currentLesson(), challenge = currentChallenge(), spec = lesson || challenge;
        // Revealing extra response layers after a completed question is a view
        // action, not another failed/revealed attempt in learning evidence.
        if (spec && analysis && !v.session?.currentLocked) { const kind = lesson ? 'lesson' : 'challenge'; recordReveal(kind, spec); sessionRecordReveal(kind, spec, lesson ? sessionExpectedLabel(spec, (0,challenges_1.predictionFor)(spec,analysis,history.model)) : String((0,challenges_1.answerFor)(spec,analysis))); }
        v.practice = true; v.practiceStep = 4; render(); return;
    }
    if (name === 'practice-next') { if (!activity.isLearning(v) || visibility().exam) return; v.practice = true; v.practiceStep = (0, common_1.clamp)((v.practiceStep || 0) + 1, 0, 4); render(); save(); return; }
    if (name === 'practice-reset') { if (!activity.isLearning(v) || visibility().exam) return; v.practice = true; v.practiceStep = 0; render(); save(); return; }
    if (name === 'export-audit') {
        try { lastAudit = verification.audit(history.model, analysis); export_1.download(JSON.stringify(lastAudit,null,2), 'beamlab-verification-'+lastAudit.reference+'.json','application/json'); }
        catch(e) { toast('Verification not exported: '+e.message); }
        return;
    }
    if (name === 'jump-critical') {
        if (!analysis) return;
        const loc = verification.criticalLocations(analysis,history.model)[Number(id)];
        if (loc) { closeDialog(); v.trace = loc.x; v.pinned = true; v.zoom = 1; v.pan = 0; renderStage(); $('#structure-block').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}); }
        return;
    }
    if (name === 'demo') { startDemo(); return; }
    if (name === 'demo-step') { showDemoStep(Number(id)); return; }
    if (name === 'demo-end') { endDemo(); return; }
    if (name === 'verify') { verificationDialog(); return; }
    if (name === 'learning-setup') { learningSetup(); return; }
    if (name === 'curriculum') { curriculumDialog(); return; }
    if (name === 'level') { setLearningMode(id); return; }
    if (name === 'level-setup') {
        const teach = $('#setup-teach');
        if (teach) v.teachMe = !!teach.checked;
        setLearningMode(id, true);
        return;
    }
    if (name === 'level-next') { setLearningMode(nextLevelForSelection()); return; }
    if (name === 'level-example') { loadExample((0, levels_1.recommendedExample)(v.level)); return; }
    if (name === 'tab') {
        if (activity.modelLocked(v) && id !== 'learn') { requestSessionExit(id === 'layers' ? 'analyse' : 'build'); return; }
        if (!(0, levels_1.allowedTabs)(activity.toolLevel(v)).includes(id)) return;
        if (id !== 'learn') endStandaloneLearning();
        v.tab = id;
        render();
        return;
    }
    if (name === 'toggle') {
        if (v.session?.active && v.session.mode === 'exam' && ['teaching','practice'].includes(id)) { toast('Hints and progressive reveal stay locked during Exam mode.'); return; }
        if (id === 'practice' && !activity.isLearning(v)) return;
        if (id === 'annotations') { v.annotationMode = v.annotationMode === 'clean' ? 'detailed' : 'clean'; v.annotations = v.annotationMode !== 'clean'; render(); save(); return; }
        if (!['annotations', 'teachMe'].includes(id) && !(0, levels_1.canUseFeature)(activity.toolLevel(v), id)) {
            toast(`${id.replace(/_/g, ' ')} is available at a higher learning level.`);
            return;
        }
        v[id] = !v[id];
        if (id === 'practice') v.practiceStep = 0;
        render();
        saveLearning();
        save();
        return;
    }
    if (name === 'advanced') {
        v.advanced = !v.advanced;
        render();
        return;
    }
    if (name === 'deselect') {
        v.selected.clear();
        inlineId = null;
        $('#inline-edit').innerHTML = '';
        render();
        return;
    }
    if (name === 'controls' || name === 'inspector') {
        if (name === 'controls' && v.inspector && v.selected.size) { v.inspector = false; v.controls = true; }
        else v[name] = !v[name];
        render();
        return;
    }
    if (name === 'undo' || name === 'undo-dialog') {
        if (blockModelEdit()) return;
        inlineId = null;
        $('#inline-edit').innerHTML = '';
        history.undo();
        v.selected = new Set([...v.selected].filter(id => history.model.items.some(o => o.id === id)));
        v.trace = null; v.pinned = false; v.pan = Math.max(0, Math.min(v.pan, history.model.length - history.model.length/v.zoom));
        layout = undefined;
        render();
        save();
        if (name === 'undo-dialog')
            openHistory();
        return;
    }
    if (name === 'redo') {
        if (blockModelEdit()) return;
        inlineId = null;
        $('#inline-edit').innerHTML = '';
        history.redo();
        v.selected = new Set([...v.selected].filter(id => history.model.items.some(o => o.id === id)));
        v.trace = null; v.pinned = false; v.pan = Math.max(0, Math.min(v.pan, history.model.length - history.model.length/v.zoom));
        layout = undefined;
        render();
        save();
        return;
    }
    if (name === 'duplicate') {
        duplicate();
        return;
    }
    if (name === 'remove') {
        remove();
        return;
    }
    if (name === 'lock' || name === 'unlock') {
        commit({ ...history.model, items: history.model.items.map(i => v.selected.has(i.id) ? { ...i, locked: name === 'lock' } : i) }, name === 'lock' ? 'Lock selection' : 'Unlock selection');
        return;
    }
    if (name === 'compare') {
        compareModel = compareModel ? null : analysis ? (0, study_1.clone)(history.model) : null;
        render();
        return;
    }
    if (name === 'working') {
        v.working = !v.working;
        renderExtras();
        renderStage();
        return;
    }
    if (name === 'step') {
        v.step = (0, common_1.clamp)(Number(id), 0, 5);
        renderExtras();
        return;
    }
    if (name === 'fit') {
        v.zoom = 1;
        v.pan = 0;
        renderStage();
        return;
    }
    if (name === 'unpin') {
        v.pinned = false;
        v.trace = null;
        updateTrace();
        return;
    }
    if (name === 'dismiss-toast') {
        $('#toast').classList.remove('visible');
        return;
    }
    if (name === 'export-menu') {
        $('#export-menu').hidden = !$('#export-menu').hidden;
        return;
    }
    if (name === 'export') {
        await doExport(id);
        return;
    }
    if (name === 'open-json') {
        $('#model-file').click();
        $('#export-menu').hidden = true;
        return;
    }
    if (name === 'share') {
        share();
        return;
    }
    if (name === 'copy-share') {
        const text = $('#share-code').value;
        try {
            await navigator.clipboard.writeText(text);
            toast('Snapshot copied.');
        }
        catch {
            $('#share-code').select();
            toast('Copy the selected code using Ctrl/Cmd C.');
        }
        return;
    }
    if (name === 'open-snapshot') {
        try {
            const m = (0, export_1.fromSnapshot)($('#paste-snapshot').value);
            if (!openUserStudy(m, 'Open shared snapshot')) return;
            closeDialog();
            toast('Snapshot opened. Undo restores your previous model.');
        }
        catch (e) {
            toast(e instanceof Error ? e.message : 'Invalid snapshot');
        }
        return;
    }
    if (name === 'dialog-close') {
        closeDialog();
        return;
    }
    if (name === 'method') {
        method();
        return;
    }
    if (name === 'history') {
        openHistory();
        return;
    }
    if (name === 'library') {
        openLibrary();
        return;
    }
    if (['save-named', 'open-named', 'delete-named'].includes(name)) {
        try {
            let records = JSON.parse(localStorage.getItem(storageKey + ':library') || '[]');
            if (name === 'save-named') {
                (0, study_1.validateStudy)(history.model);
                records.push({ name: history.model.name, model: (0, study_1.clone)(history.model) });
                records = records.slice(-20);
                localStorage.setItem(storageKey + ':library', JSON.stringify(records));
                openLibrary();
            }
            else if (name === 'open-named') {
                const r = records[Number(id)];
                if (r) {
                    const m = (0, study_1.parseStudy)(JSON.stringify(r.model));
                    if (!openUserStudy(m, 'Open saved study')) return;
                    closeDialog();
                }
            }
            else {
                records.splice(Number(id), 1);
                localStorage.setItem(storageKey + ':library', JSON.stringify(records));
                openLibrary();
            }
        }
        catch {
            toast('Browser storage is unavailable or this snapshot is invalid. Export JSON instead.');
        }
        return;
    }
    if (name === 'section-region-add') { openSectionRegionDialog(); return; }
    if (name === 'section-region-edit') { openSectionRegionDialog(id); return; }
    if (name === 'section-region-remove') {
        if (!(0, levels_1.canUseFeature)(activity.toolLevel(v), 'steppedSections')) return;
        const m = (0, study_1.clone)(history.model);
        const before = m.sectionRegions?.length || 0;
        m.sectionRegions = (m.sectionRegions || []).filter(r => r.id !== id);
        if (m.sectionRegions.length === before) return;
        commit(m, 'Remove stepped section');
        return;
    }
    if (name === 'section-region-save') {
        if (!(0, levels_1.canUseFeature)(activity.toolLevel(v), 'steppedSections')) return;
        const label = $('#section-region-label')?.value.trim() || '';
        const x = Number($('#section-region-start')?.value);
        const end = Number($('#section-region-end')?.value);
        const source = $('#section-region-source')?.value || '__base__';
        const m = (0, study_1.clone)(history.model);
        m.sectionRegions || (m.sectionRegions = []);
        const regionId = id === 'new' ? 'section-' + Date.now().toString(36) : id;
        const existingIndex = m.sectionRegions.findIndex(r => r.id === regionId);
        const existing = existingIndex >= 0 ? m.sectionRegions[existingIndex] : null;
        let section;
        try {
            section = source === '__base__'
                ? (0,study_1.clone)(m.section)
                : source === '__existing__' && existing
                    ? (0,study_1.clone)(existing.section)
                    : (0,catalogue_1.fromCatalogue)(source);
        } catch (e) {
            const errorEl = $('#section-region-dialog-error');
            if (errorEl) errorEl.textContent = e instanceof Error ? e.message : 'Invalid section source.';
            return;
        }
        const region = { id:regionId, label, x, end, section };
        if (existingIndex >= 0) m.sectionRegions[existingIndex] = region;
        else m.sectionRegions.push(region);
        m.sectionRegions = (0, section_regions_1.normaliseSectionRegions)(m.sectionRegions);
        try { (0, study_1.validateStudy)(m); }
        catch (e) {
            const errorEl = $('#section-region-dialog-error');
            if (errorEl) errorEl.textContent = e instanceof Error ? e.message : 'Invalid stepped-section region.';
            return;
        }
        closeDialog();
        commit(m, existingIndex >= 0 ? 'Edit stepped section' : 'Add stepped section');
        return;
    }
    if (name === 'stiffness-add') { openStiffnessDialog(); return; }
    if (name === 'stiffness-edit') { openStiffnessDialog(id); return; }
    if (name === 'stiffness-remove') {
        if (!(0, levels_1.canUseFeature)(activity.toolLevel(v), 'varyingEI')) return;
        const m = (0, study_1.clone)(history.model);
        const before = m.stiffnessRegions?.length || 0;
        m.stiffnessRegions = (m.stiffnessRegions || []).filter(r => r.id !== id);
        if (m.stiffnessRegions.length === before) return;
        commit(m, 'Remove EI zone');
        return;
    }
    if (name === 'stiffness-save') {
        if (!(0, levels_1.canUseFeature)(activity.toolLevel(v), 'varyingEI')) return;
        const label = $('#stiffness-label')?.value.trim() || '';
        const x = Number($('#stiffness-start')?.value);
        const end = Number($('#stiffness-end')?.value);
        const factor = Number($('#stiffness-factor')?.value);
        const m = (0, study_1.clone)(history.model);
        m.stiffnessRegions || (m.stiffnessRegions = []);
        const regionId = id === 'new' ? 'ei-' + Date.now().toString(36) : id;
        const region = { id:regionId, label, x, end, factor };
        const existingIndex = m.stiffnessRegions.findIndex(r => r.id === regionId);
        if (existingIndex >= 0) m.stiffnessRegions[existingIndex] = region;
        else m.stiffnessRegions.push(region);
        m.stiffnessRegions = (0, stiffness_1.normaliseRegions)(m.stiffnessRegions);
        try { (0, study_1.validateStudy)(m); }
        catch (e) {
            const errorEl = $('#stiffness-dialog-error');
            if (errorEl) errorEl.textContent = e instanceof Error ? e.message : 'Invalid EI zone.';
            return;
        }
        const wasUniform = !(history.model.stiffnessRegions?.length || 0);
        if (wasUniform && m.stiffnessRegions.length) { v.stress = false; v.shear = false; }
        closeDialog();
        commit(m, existingIndex >= 0 ? 'Edit EI zone' : 'Add EI zone');
        return;
    }
    if (name === 'selfweight') {
        if (!(0, levels_1.canUseFeature)(activity.toolLevel(v), 'selfweight')) { toast('Self-weight editing appears from 3rd+ Year mode.'); return; }
        commit({ ...history.model, selfWeight: !history.model.selfWeight }, 'Toggle self-weight');
        return;
    }
    if (name === 'detach-catalogue') {
        const m = (0, study_1.clone)(history.model);
        delete m.section.catalogue;
        delete m.section.family;
        commit(m, 'Detach catalogue section');
        return;
    }
    if (['case-toggle', 'case-remove', 'save-combination', 'confirm-combination', 'combination', 'delete-combination'].includes(name) && !(0, levels_1.canUseFeature)(activity.toolLevel(v), 'cases')) {
        toast('Load cases and combinations appear from 3rd+ Year mode.');
        return;
    }
    if (name === 'case-toggle') {
        const m = (0, study_1.clone)(history.model), c = m.cases.find(c => c.id === id);
        if (c)
            c.enabled = !c.enabled;
        commit(m, 'Toggle case ' + c?.name);
        return;
    }
    if (name === 'case-remove') {
        const m = (0, study_1.clone)(history.model);
        if (m.cases.length <= 1)
            return;
        if (m.items.some(i => i.caseId === id) || (m.selfWeight && m.selfWeightCase === id)) {
            toast('Reassign this case\'s loads and self-weight before removing it.');
            return;
        }
        m.cases = m.cases.filter(c => c.id !== id);
        if (m.selfWeightCase === id)
            m.selfWeightCase = m.cases[0].id;
        m.combinations?.forEach(c => delete c.factors[id]);
        commit(m, 'Remove load case');
        return;
    }
    if (name === 'save-combination') {
        openDialog('Save a manual combination', `<p>Give this set of factors a name. It is not a prescribed design-code combination.</p><label class="field"><span>Name</span><input id="combination-name" aria-label="Combination name" maxlength="50" value="Combination ${(history.model.combinations?.length || 0) + 1}"></label>${(0, common_1.button)('confirm-combination', 'Save factor set', 'primary')}`);
        return;
    }
    if (name === 'confirm-combination') {
        const m = (0, study_1.clone)(history.model), name = $('#combination-name').value.trim();
        if (!name) {
            toast('Enter a name.');
            return;
        }
        if ((m.combinations?.length || 0) >= 20) {
            toast('20 saved combinations is the limit.');
            return;
        }
        m.combinations.push({ id: 'combo-' + Date.now().toString(36), name, factors: Object.fromEntries(m.cases.map(c => [c.id, c.enabled ? c.factor : 0])) });
        closeDialog();
        commit(m, 'Save combination');
        return;
    }
    if (name === 'combination') {
        const c = history.model.combinations.find(c => c.id === id);
        if (c)
            commit((0, study_1.setCombination)(history.model, c.factors), 'Apply ' + c.name);
        return;
    }
    if (name === 'delete-combination') {
        commit({ ...history.model, combinations: history.model.combinations.filter(c => c.id !== id) }, 'Remove saved combination');
        return;
    }
    if (name === 'inline-done') {
        inlineId = null;
        $('#inline-edit').innerHTML = '';
        return;
    }
    if (name === 'focus-mode') {
        document.body.classList.toggle('focus-mode');
        updateFocusControl();
        $('#workspace').scrollIntoView({ behavior: 'smooth' });
        return;
    }
}
function selectChanged(select) {
    finishField();
    const key = select.dataset.select, value = select.value, m = (0, study_1.clone)(history.model);
    if (key === 'example') {
        loadExample(value);
        return;
    }
    if (key === 'preset') {
        add(value === 'up' ? 'point' : value === 'couple' ? 'moment' : 'udl', m.length / 2, value);
        return;
    }
    if (key === 'zoom') {
        v.zoom = Number(value);
        v.pan = 0;
        renderStage();
        return;
    }
    if (key === 'snap') {
        v.snap = Number(value);
        render();
        return;
    }
    if (key === 'annotationMode') {
        if (!['clean','guided','detailed'].includes(value)) return;
        v.annotationMode = value; v.annotations = value !== 'clean'; render(); save(); return;
    }
    if (key === 'currentCase') {
        if (!(0, levels_1.canUseFeature)(activity.toolLevel(v), 'cases')) return;
        v.currentCase = value;
        return;
    }
    if (key === 'addCase') {
        if (!(0, levels_1.canUseFeature)(activity.toolLevel(v), 'cases')) return;
        if (m.cases.length >= 12) {
            toast('12 load cases is the limit.');
            return;
        }
        let id = value.toLowerCase(), n = 1;
        while (m.cases.some(c => c.id === id))
            id = value.toLowerCase() + '-' + (++n);
        m.cases.push({ id, name: value === 'Custom' ? 'Custom ' + n : value, enabled: true, factor: 1 });
        v.currentCase = id;
        commit(m, 'Add ' + value + ' case');
        return;
    }
    if (key === 'catalogue') {
        if (!(0, levels_1.canUseFeature)(activity.toolLevel(v), 'catalogue')) return;
        if (value)
            m.section = (0, catalogue_1.fromCatalogue)(value);
        else {
            delete m.section.catalogue;
            delete m.section.family;
        }
        commit(m, 'Choose section ' + (value || 'Custom'));
        return;
    }
    if (key === 'shape') {
        m.section.shape = value;
        delete m.section.catalogue;
        delete m.section.family;
        commit(m, 'Change section geometry');
        return;
    }
    if (key === 'material') {
        const p = sections_1.materials.find(c => c.name === value);
        if (p)
            Object.assign(m.section, { material: p.name, E: p.E, density: p.density });
        else
            m.section.material = 'Custom material';
        commit(m, 'Change material');
        return;
    }
    if (key.startsWith('itemCase:')) {
        if (!(0, levels_1.canUseFeature)(activity.toolLevel(v), 'cases')) return;
        const i = m.items.find(i => i.id === key.slice(9));
        if (i && !i.locked)
            i.caseId = value;
        commit(m, 'Assign load case');
        return;
    }
    if (key === 'selfWeightCase') {
        if (!(0, levels_1.canUseFeature)(activity.toolLevel(v), 'selfweight')) return;
        m.selfWeightCase = value;
        commit(m, 'Assign self-weight case');
        return;
    }
}
function lessonSketchPoint(e,svg){
 const r=svg.getBoundingClientRect();
 return {x:(0,common_1.clamp)((e.clientX-r.left)/Math.max(1,r.width),0,1),y:(0,common_1.clamp)((.5-(e.clientY-r.top)/Math.max(1,r.height))*2,-1.2,1.2)};
}
function lessonSketchPathD(points){return (points||[]).map((p,i)=>`${i?'L':'M'}${(5+90*p.x).toFixed(2)} ${(60-43*p.y).toFixed(2)}`).join(' ');}
function updateLessonSketchStroke(){const p=$('#lesson-sketch-path');if(p)p.setAttribute('d',lessonSketchPathD(v.lessonSketch));const empty=document.querySelector('.sketch-pad-empty');if(empty)empty.style.display=v.lessonSketch?.length?'none':'';}
function lessonSketchDown(e){
 const svg=e.target.closest('#lesson-sketch'); if(!svg||e.button!==0)return false;
 v.lessonMethod='sketch'; v.lessonSketch=[lessonSketchPoint(e,svg)]; v.lessonSketchResult=null; v.lessonSketchReference=false; v.lessonSketchReferencePoints=[]; v.lessonFeedback=null;
 lessonSketchDrawing=true; lessonSketchPointer=e.pointerId; try{svg.setPointerCapture(e.pointerId);}catch{} updateLessonSketchStroke(); e.preventDefault(); return true;
}
function lessonSketchMove(e){
 if(!lessonSketchDrawing||e.pointerId!==lessonSketchPointer)return false;
 const svg=$('#lesson-sketch'); if(!svg)return false; const p=lessonSketchPoint(e,svg), last=v.lessonSketch[v.lessonSketch.length-1];
 if(!last||Math.hypot(p.x-last.x,p.y-last.y)>.008){v.lessonSketch.push(p);if(v.lessonSketch.length>500)v.lessonSketch.splice(1,1);updateLessonSketchStroke();}
 e.preventDefault(); return true;
}
function lessonSketchUp(e,cancel=false){
 if(!lessonSketchDrawing||e.pointerId!==lessonSketchPointer)return false;
 const svg=$('#lesson-sketch'); if(!cancel&&svg){const p=lessonSketchPoint(e,svg),last=v.lessonSketch[v.lessonSketch.length-1];if(!last||Math.hypot(p.x-last.x,p.y-last.y)>.004)v.lessonSketch.push(p);}
 lessonSketchDrawing=false; lessonSketchPointer=null; try{if(svg?.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);}catch{} updateLessonSketchStroke(); e.preventDefault(); return true;
}
function eventX(clientX, rect, m = history.model) { const { left, right, span } = (0, diagrams_1.coordinates)(m, diagramView()); return (0, common_1.clamp)(v.pan + ((clientX - rect.left) * width / rect.width - left) * span / (right - left), 0, m.length); }
function snapX(x, alt = false) { return v.snap && !alt ? Math.round(x / v.snap) * v.snap : x; }
function pointerDown(e) {
    if (lessonSketchDown(e)) return;
    if (e.target.closest('#graphs')) pauseSweep();
    if (e.button !== 0 || e.target instanceof HTMLInputElement)
        return;
    const el = e.target, tool = el.closest('[data-tool]');
    if (tool) {
        if (blockModelEdit()) return;
        finishField();
        palette = { kind: tool.dataset.tool, x: e.clientX, y: e.clientY, moved: false, pointer: e.pointerId };
        e.preventDefault();
        $('#app').setPointerCapture(e.pointerId);
        return;
    }
    const svg = el.closest('svg[data-model]');
    if (!svg)
        return;
    if (blockModelEdit()) return;
    finishField();
    const inline = el.closest('[data-inline]');
    const target = el.closest('[data-object]'), id = target?.dataset.object;
    const o = history.model.items.find(i => i.id === id);
    if (o) {
        if (!(0, levels_1.canEditItem)(activity.toolLevel(v), o)) {
            v.selected = new Set([o.id]);
            v.inspector = true;
            render();
            toast(`${examples_1.titles[o.kind]} remains active in the calculation but is read-only in ${(0, levels_1.mode)(v.level).short}.`);
            return;
        }
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
            if (v.selected.has(o.id))
                v.selected.delete(o.id);
            else
                v.selected.add(o.id);
        }
        else if (!v.selected.has(o.id))
            v.selected = new Set([o.id]);
        // The first press of a label must leave it available for the second tap.
        // A mobile inspector opened here covers the target before pointerUp can
        // recognise the double tap. Object bodies still open the full inspector.
        v.inspector = !!o.locked || !inline;
        if (o.locked) {
            render();
            toast('Object locked. Use Unlock in the Inspector.');
            return;
        }
        const part = el.closest('[data-part]')?.dataset.part || 'body';
        const rect = svg.getBoundingClientRect();
        layout = (0, diagrams_1.layoutModel)(history.model, width, v);
        drag = { kind: 'object', base: (0, study_1.clone)(history.model), ids: [...v.selected], item: (0, study_1.clone)(o), part, startX: eventX(e.clientX, rect), startY: e.clientY, clientX: e.clientX, clientY: e.clientY, rect, moved: false, pointer: e.pointerId };
        renderStage();
        $('#inspector').innerHTML = (0, panels_1.inspectorPanel)(history.model, analysis, v);
        // Open the reserved editor after pointerUp; its reflow must not alter drag coordinates.
    }
    else {
        drag = { kind: 'marquee', base: (0, study_1.clone)(history.model), ids: e.shiftKey ? [...v.selected] : [], part: '', startX: 0, startY: 0, clientX: e.clientX, clientY: e.clientY, rect: svg.getBoundingClientRect(), moved: false, pointer: e.pointerId };
    }
    $('#graphs').setPointerCapture(e.pointerId);
    e.preventDefault();
}
function pointerMove(e) {
    if (lessonSketchMove(e)) return;
    if (palette) {
        palette.moved || (palette.moved = Math.hypot(e.clientX - palette.x, e.clientY - palette.y) > 6);
        if (palette.moved) {
            $('#drag-ghost').hidden = false;
            $('#drag-ghost').textContent = examples_1.titles[palette.kind];
            $('#drag-ghost').style.transform = `translate(${e.clientX + 12}px,${e.clientY + 12}px)`;
        }
        return;
    }
    if (drag) {
        const d = drag;
        d.moved || (d.moved = Math.hypot(e.clientX - d.clientX, e.clientY - d.clientY) > 4);
        if (!d.moved)
            return;
        if (d.kind === 'marquee') {
            const x = Math.min(e.clientX, d.clientX), y = Math.min(e.clientY, d.clientY), w = Math.abs(e.clientX - d.clientX), h = Math.abs(e.clientY - d.clientY);
            $('#marquee').hidden = false;
            Object.assign($('#marquee').style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
            const ids = new Set(d.ids);
            $('#graphs').querySelectorAll('svg[data-model] [data-object]').forEach(g => { const b = g.getBoundingClientRect(); if (b.left < x + w && b.right > x && b.top < y + h && b.bottom > y)
                ids.add(g.dataset.object); });
            v.selected = ids;
            return;
        }
        const m = (0, study_1.clone)(d.base), o = m.items.find(i => i.id === d.item.id);
        let dx = eventX(e.clientX, d.rect, m) - d.startX;
        if (['w0', 'w1'].includes(d.part)) {
            const key = d.part === 'w0' ? 'value' : 'endValue', raw = d.item[key] + (d.startY - e.clientY) / (layout.factor * d.rect.width / width);
            o[key] = Math.round((0, common_1.clamp)(raw, -100000, 100000) * 100) / 100;
        }
        else if (d.part === 'start')
            o.x = (0, common_1.clamp)(snapX(d.item.x + dx, e.altKey), 0, o.end - .01);
        else if (d.part === 'end')
            o.end = (0, common_1.clamp)(snapX(d.item.end + dx, e.altKey), o.x + .01, m.length);
        else {
            dx = snapX(d.item.x + dx, e.altKey) - d.item.x;
            const items = m.items.filter(i => d.ids.includes(i.id) && !i.locked);
            dx = (0, common_1.clamp)(dx, Math.max(...items.map(i => (i.kind === 'hinge' ? .01 : 0) - i.x)), Math.min(...items.map(i => m.length - (i.end ?? i.x) - (i.kind === 'hinge' ? .01 : 0))));
            for (const i of items) {
                i.x = Math.round((i.x + dx) * 1e9) / 1e9;
                if (i.end !== undefined)
                    i.end = Math.round((i.end + dx) * 1e9) / 1e9;
            }
        }
        history.model = m;
        v.trace = (0, common_1.clamp)(eventX(e.clientX, d.rect, m), 0, m.length);
        v.pinned = false;
        solve();
        renderStage();
        renderExtras(true);
        $('#inspector').innerHTML = (0, panels_1.inspectorPanel)(m, analysis, v);
        return;
    }
    if (v.pinned)
        return;
    const el = e.target, svg = el.closest('#graphs svg[data-chart],#graphs svg[data-model]');
    if (!svg)
        return;
    // A label is an editing target. Updating the hover readout can change its
    // wrapping/height and move the label away before the first or second press.
    // Dragging still updates the trace above; plots and the beam remain inspectable.
    if (el.closest('[data-inline]')) return;
    let x = eventX(e.clientX, svg.getBoundingClientRect());
    const dist = history.model.length / v.zoom * 7 / svg.getBoundingClientRect().width;
    const closest = history.model.items.flatMap(i => i.end !== undefined ? [i.x, i.end] : [i.x]).sort((a, b) => Math.abs(a - x) - Math.abs(b - x))[0];
    if (closest !== undefined && Math.abs(closest - x) < dist)
        x = closest;
    v.trace = x;
    updateTrace();
}
function pointerUp(e, cancel = false) {
    if (lessonSketchUp(e, cancel)) return;
    if (palette) {
        const p = palette;
        palette = null;
        $('#drag-ghost').hidden = true;
        if ($('#app').hasPointerCapture(e.pointerId))
            $('#app').releasePointerCapture(e.pointerId);
        if (cancel)
            return;
        if (!p.moved)
            add(p.kind);
        else {
            const svg = $('#graphs svg[data-model]'), r = svg.getBoundingClientRect();
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom)
                add(p.kind, snapX(eventX(e.clientX, r), e.altKey));
        }
        return;
    }
    if (!drag)
        return;
    const d = drag;
    drag = null;
    $('#marquee').hidden = true;
    if ($('#graphs').hasPointerCapture(e.pointerId))
        $('#graphs').releasePointerCapture(e.pointerId);
    if (d.kind === 'marquee') {
        if (!d.moved)
            v.selected.clear();
        if (cancel)
            v.selected = new Set(d.ids);
        layout = undefined;
        render();
        return;
    }
    const next = history.model;
    history.model = d.base;
    layout = undefined;
    if (!cancel && d.moved && !activity.modelLocked(v)) {
        levelStarterActive = false;
        history.commit(next, d.part === 'w0' || d.part === 'w1' ? 'Change variable-load intensity' : 'Drag ' + (d.ids.length > 1 ? 'selection' : d.item.label));
    }
    render();
    save();
    if (!cancel && !d.moved) {
        const now = performance.now();
        if (lastTap?.id === d.item.id && now - lastTap.time < 450) {
            lastTap = null;
            inlineEdit(d.item.id, e);
        }
        else
            lastTap = { id: d.item.id, time: now };
    }
}
function inlineEdit(id, e) {
    if (blockModelEdit()) return;
    finishField();
    const i = history.model.items.find(i => i.id === id);
    if (!i)
        return;
    if (!(0, levels_1.canEditItem)(activity.toolLevel(v), i)) {
        toast(`Move to a higher learning level to edit ${i.label}.`);
        return;
    }
    if (i.locked) {
        toast('Unlock before editing.');
        return;
    }
    inlineId = id;
    v.selected = new Set([id]);
    // The compact label editor replaces the floating inspector for this edit.
    // Keeping both open can cover the toolbar, including Undo, on laptops.
    v.inspector = false;
    render();
    const key = (0, validation_1.isLoad)(i.kind) ? 'value' : 'x', units = i.kind === 'moment' ? 'kN\u00b7m' : (0, validation_1.isDistributed)(i.kind) ? 'kN/m' : i.kind === 'point' ? 'kN' : 'm';
    $('#inline-edit').innerHTML = `<div><span>${(0, common_1.esc)(i.label)} / ${examples_1.titles[i.kind]}</span>${(0, common_1.button)('inline-done', (0, common_1.icon)('close', 13), 'icon-button', false, 'Finish inline editing')}</div>${(0, common_1.field)('item:' + id + ':' + key, (0, validation_1.isLoad)(i.kind) ? 'Nominal magnitude' : 'Position', i[key], units, key === 'x' ? 0 : -100000, key === 'x' ? history.model.length : 100000)}${i.kind === 'variable' ? (0, common_1.field)('item:' + id + ':endValue', 'End intensity', i.endValue, 'kN/m') : ''}<small>Enter to apply. Escape to close.</small>`;
    const box = $('#inline-edit');
    box.style.left = (0, common_1.clamp)(e.clientX - 105, 10, innerWidth - 265) + 'px';
    box.style.top = (0, common_1.clamp)(e.clientY + 12, 80, innerHeight - (i.kind === 'variable' ? 275 : 205)) + 'px';
    box.querySelector('input')?.focus();
    box.querySelector('input')?.select();
}

const demoSteps = [
    ['Move a load. See the response.', 'Drag P1 along the 6 m beam. The reaction values, shear jump and moment peak move with it. Use Undo to reverse an edit.'],
    ['Add continuity, not clutter.', 'This two-span beam has three supports. The internal support carries a hogging moment; it is not an internal hinge.'],
    ['Stiffness changes how far it bends.', 'Dashed white is the same beam at E = 200 GPa. Colour is E = 69 GPa. Forces stay the same; displacement changes. Hover the BMD to inspect the live stress section.'],
    ['Keep load cases separate.', 'Dead and Live are on; Wind is off. Toggle a case or change its factor. Nominal loads remain unchanged, and factors are applied once.'],
    ['Show your working. Take it with you.', 'Open the six calculation stages, or use Export for the annotated PNG, model JSON, CSV or PDF report.'],
    ['Show the evidence, not just the answer.', 'Inspect the model-specific consistency checks, jump to a critical section, or run analytical benchmarks. These checks verify the calculation model, not a real design.'],
    ['Let the load travel. Keep the evidence.', 'This separate lab scans a two-axle train across the structure. Click its envelope to find which vehicle position governs a section. These are sampled static envelopes, not dynamics or code vehicles.'],
    ['Look inside the section.', 'A rectangular section shows a parabolic transverse-shear profile. Move across the beam to connect changing shear force to the stresses through its depth. No new capacity claim is implied.']
];
function startDemo() {
    if (blockModelEdit()) return;
    endStandaloneLearning();
    finishField();
    if (!demoSession) demoSession = {
        model: (0, study_1.clone)(history.model), view: {...v, selected: new Set(v.selected)},
        past: history.past.slice(), future: history.future.slice(), compare: compareModel,
        focus: document.body.classList.contains('focus-mode'), moving: movingLab?.snapshot(), index: 0
    };
    closeDialog();
    showDemoStep(0);
}
function showDemoStep(index) {
    if (!demoSession) return;
    pauseSweep(); sweepProgress = .5; sweepDirection = 1;
    finishField(); demoSession.index = (0, common_1.clamp)(index,0,demoSteps.length-1);
    index = demoSession.index;
    v.selected.clear(); v.trace = null; v.pinned = false; v.pan = 0; v.zoom = 1;
    v.level = 'all';
    v.tab = index === 2 ? 'section' : index === 3 || index === 4 ? 'cases' : 'build';
    v.controls = true; v.inspector = true; v.annotations = true;
    v.stress = index === 2; v.deformation = index === 2 || index === 4; v.practice = false; v.practiceStep = 0;
    v.teaching = false; v.review = false; v.working = index === 4; v.step = 0;
    v.moving = index === 6; v.shear = index === 7;
    movingLab?.cancel();
    compareModel = null;
    let m = index === 1 ? (0, study_1.normalise)((0, examples_1.example)('continuous')) : referenceExample();
    if (index === 2) {
        compareModel = (0, study_1.clone)(m);
        m.section.material = 'Aluminium (illustrative)'; m.section.E = 69; m.section.density = 2700;
    }
    if (index === 3 || index === 4) {
        m.name = 'Dead + Live / independent cases';
        m.cases = [{id:'dead',name:'Dead',enabled:true,factor:1},{id:'live',name:'Live',enabled:true,factor:1},{id:'wind',name:'Wind',enabled:false,factor:1}];
        m.selfWeightCase = 'dead';
        m.items = m.items.filter(i => (0, validation_1.isSupport)(i.kind));
        m.items.push({...examples_1.makeItem('udl',0,6,4),label:'U1',caseId:'dead',colour:'#efbd6a'},
            {...examples_1.makeItem('point',3,undefined,12),label:'P1',caseId:'live',colour:'#79bbef'},
            {...examples_1.makeItem('udl',0,6,-1),label:'U2',caseId:'wind',colour:'#bd9af0'});
    }
    if(index===7){ m.section.shape='rectangle';m.section.catalogue=undefined;m.section.family=undefined;m.section.b=200;m.section.h=400;v.stress=true;v.tab='layers';v.trace=1.5;v.pinned=true;}
    history.model = m; history.past = []; history.future = [];
    v.currentCase = m.cases[0].id; layout = undefined;
    document.body.classList.add('focus-mode');
    render(); save();
    if(index===6) movingLab?.demo();
    requestAnimationFrame(() => { if(index===6) $('#moving-lab').scrollIntoView({block:'start',behavior:'auto'});else if(index===7) $('#shear-stress').scrollIntoView({block:'center',behavior:'auto'});else window.scrollTo({top:0,behavior:'auto'}); });
}
function renderDemo() {
    const el = $('#demo-guide'); if (!el) return;
    el.hidden = !demoSession;
    if (!demoSession) return;
    const i = demoSession.index;
    const steps = demoSteps.map((d,n) => (0,common_1.button)('demo-step:'+n, String(n+1), 'tour-dot '+(i===n?'current':''),false,'Step '+(n+1)+': '+d[0])).join('');
    el.innerHTML = `<div class="tour-main"><div><span class="eyebrow">PRESENTATION TOUR / ${i+1} OF ${demoSteps.length}</span><h3>${demoSteps[i][0]}</h3><p>${demoSteps[i][1]}</p></div><div class="demo-actions">${(0,common_1.button)('demo-step:'+Math.max(0,i-1),'Previous','secondary',i===0)}${(0,common_1.button)('demo-step:'+Math.min(demoSteps.length-1,i+1),'Next','primary',i===demoSteps.length-1)}${(0,common_1.button)('demo-end','End tour','text-button')}</div></div>
    <div class="tour-controls"><div class="tour-dots" aria-label="Tour steps">${steps}</div><span class="tour-keys">Page Up / Page Down</span>${(0,common_1.button)('demo-notes',demoNotes?'Hide presenter notes':'Presenter notes','text-button')}${(0,common_1.button)('fullscreen',(0,common_1.icon)('expand',14)+' Fullscreen','text-button')}</div>
    ${demoNotes?`<div class="presenter-notes"><b>Presenter note</b><p>${presentation.speakerNotes[i]}</p></div>`:''}
    ${i===0?`<div class="sweep-controls"><button data-action="sweep-play" id="sweep-play" class="secondary">${sweepPlaying?'Pause':'Play force sweep'}</button><label>Force position<input id="sweep-slider" type="range" min="0" max="1" step=".001" value="${sweepProgress}" aria-label="Force position in tour"></label><output id="sweep-readout">${(0,common_1.fmt)(presentation.sweepPosition(history.model.length,sweepProgress))} m</output>${(0,common_1.button)('sweep-reset','Centre','text-button')}<small>Static solves, not dynamics. Diagram scales held for comparison.</small></div>`:''}
    ${i===5?`<div class="tour-evidence">${(0,common_1.button)('audit','Inspect this model','primary')}${(0,common_1.button)('verify','Run analytical benchmarks','secondary')}${(0,common_1.button)('export-audit','Download verification JSON','secondary')}</div>`:''}`;
}
function pauseSweep() {
    sweepPlaying = false;
    if (sweepFrame) cancelAnimationFrame(sweepFrame);
    sweepFrame = 0; sweepLastTime = 0; sweepElapsed = 0;
    const b = $('#sweep-play'); if (b) { b.textContent = 'Play force sweep'; b.setAttribute('aria-pressed','false'); }
}
function applySweep() {
    if (!demoSession || demoSession.index !== 0) return;
    const point = history.model.items.find(i=>i.kind==='point');
    if (!point || point.locked) { pauseSweep(); toast('The tour force is missing or locked. Restart step 1 to restore it.'); return; }
    const x = presentation.sweepPosition(history.model.length,sweepProgress);
    history.model = {...history.model, items:history.model.items.map(i=>i.id===point.id?{...i,x}:i)};
    v.trace = x; v.pinned = true;
    solve();
    if (!analysis) { pauseSweep(); renderStage(); toast('Sweep paused. Correct the model or restart step 1.'); return; }
    renderStage(); renderExtras();
    const slider=$('#sweep-slider'), readout=$('#sweep-readout');
    if (slider && document.activeElement!==slider) slider.value=String(sweepProgress);
    if (readout) readout.textContent=(0,common_1.fmt)(x)+' m';
    if (v.selected.has(point.id)) $('#inspector').innerHTML=panels_1.inspectorPanel(history.model,analysis,v);
}
function playSweep() {
    if (!demoSession || demoSession.index!==0 || !analysis) return;
    finishField();
    const point=history.model.items.find(i=>i.kind==='point');
    if (!point || point.locked || study_1.caseFactor(history.model,point.caseId)===0) { toast('Enable and unlock the point-load case, or restart step 1.'); return; }
    sweepPlaying=true;sweepLastTime=0;sweepElapsed=0;
    const button=$('#sweep-play');if(button){button.textContent='Pause';button.setAttribute('aria-pressed','true');}
    function frame(now) {
        if(!sweepPlaying)return;
        const dt=sweepLastTime ? Math.min(.12,(now-sweepLastTime)/1000) : 0;
        sweepLastTime=now;sweepElapsed+=dt;
        if(sweepElapsed>=.05){const next=presentation.nextProgress(sweepProgress,sweepDirection,sweepElapsed,12);sweepProgress=next.progress;sweepDirection=next.direction;sweepElapsed=0;applySweep();}
        if(sweepPlaying)sweepFrame=requestAnimationFrame(frame);
    }
    sweepFrame=requestAnimationFrame(frame);
}
function auditDialog() {
    if (!visibility().complete) { toast(activity.restrictionMessage(v)); return; }
    if(!analysis){toast('Complete a valid model before checking it.');return;}
    try {
        lastAudit=verification.audit(history.model,analysis);
        const r=lastAudit, locations=verification.criticalLocations(analysis,history.model);
        openDialog('Model checks & critical locations',`<div class="audit-head"><span class="tag">STUDIO ${verification.RELEASE}</span><code>${r.reference}</code></div><p>${r.pass?'Six numerical consistency checks passed.':'A numerical check needs investigation. Do not rely on these results.'} This is not a structural safety approval.</p>
        <div class="audit-list">${r.checks.map(c=>`<article><b class="${c.pass?'pass':'fail'}">${c.pass?'PASS':'CHECK'}</b><div><strong>${(0,common_1.esc)(c.name)}</strong><small>Residual ${c.residual.toExponential(2)} ${c.unit}<br>Tolerance ${c.tolerance.toExponential(2)} ${c.unit}</small></div></article>`).join('')}</div>
        <details class="audit-energy"><summary>What the energy check means</summary><p>The integral of M squared divided by EI is compared with the work of the final applied forces, moments and distributed loads. With linear elasticity and zero prescribed support movement, half each value is the strain energy. This checks consistency of loading and deformation; it is not an independent certification.</p><p>Strain energy: ${(0,common_1.fmt)(r.energy.strainEnergy_kNm,8)} kN m. Half final-load work: ${(0,common_1.fmt)(r.energy.halfFinalLoadWork_kNm,8)} kN m.</p></details>
        <h3>Go to a critical location</h3><div class="critical-jumps">${locations.map((p,i)=>(0,common_1.button)('jump-critical:'+i,`<span>${(0,common_1.esc)(p.name)}</span><b>${(0,common_1.signed)(p.value,3)} ${p.unit}</b><small>x = ${(0,common_1.fmt)(p.x,3)} m</small>`,'critical-jump')).join('')}</div>
        <div class="tour-evidence">${(0,common_1.button)('export-audit','Download verification JSON','primary')}${(0,common_1.button)('verify','Run independent benchmarks','secondary')}</div><p class="hint">Reference ID identifies this input snapshot; it is not a security hash. The export includes the full model, inputs, results, tolerances and warnings.</p>`);
    }catch(e){toast('Unable to check model: '+e.message);}
}
function endDemo() {
    if (!demoSession) return;
    pauseSweep();
    finishField(); const d = demoSession; demoSession = null;
    history.model = d.model; history.past = d.past; history.future = d.future;
    Object.assign(v,d.view); compareModel = d.compare; layout = undefined;
    document.body.classList.toggle('focus-mode',d.focus);
    render();
    if(d.moving && movingLab) movingLab.restore(d.moving);
    save(); toast('Tour ended. Your original study and history are restored.');
}
function verificationDialog() {
    const checks=verification.benchmarks();
    openDialog('Live analytical benchmarks',`<p>These checks run the same bundled solver against analytical reference values. They do not certify a real design or every possible model.</p><div class="benchmark-summary">${checks.filter(c=>c.pass).length} / ${checks.length} checks passed</div><div class="benchmark-list">${checks.map(c=>`<div><b class="${c.pass?'pass':'fail'}">${c.pass?'PASS':'FAIL'}</b><span>${(0,common_1.esc)(c.name)}<small>Reference ${(0,common_1.fmt)(c.expected,6)} ${c.unit}</small></span><code>${Number.isFinite(c.actual)?(0,common_1.fmt)(c.actual,6):'error'}</code></div>`).join('')}</div><p class="hint">Studio ${verification.RELEASE}. No changes were made to your model. Benchmark values use the stated demonstration loads and EI, not arbitrary values copied from a screenshot.</p>`);
}

function updateFocusControl() {
    const el = document.querySelector('[data-action="focus-mode"]');
    if (!el) return;
    const focused = document.body.classList.contains('focus-mode');
    el.setAttribute('aria-pressed', String(focused));
    el.innerHTML = (0, common_1.icon)('expand',14) + (focused ? ' Exit focus' : ' Focus');
}

function bootstrap() {
    if (matchMedia('(max-width:780px)').matches) v.controls = false;
    window.addEventListener('beamlab:tutor-status',()=>{if($('#dialog-title')?.textContent==='Ask BeamLab' && $('#dialog')?.classList.contains('open')) renderTutorDialog();});
    $('#app').innerHTML = `
  <a class="skip-link" href="#workspace">Skip to workspace</a><div class="progress-line" id="scroll-progress"></div>
  <header class="topbar"><a class="brand" href="#home"><span>B</span><b>BeamLab</b><em>STUDIO ${verification.RELEASE}</em></a><nav><a href="#home">Home</a><a href="#workspace">Workspace</a>${(0, common_1.button)('method', 'Method & scope', 'text-button')}</nav><div class="header-actions">${(0, common_1.button)('share', (0, common_1.icon)('share', 15) + '<span>Share</span>', 'share-button')}<div class="export-wrap">${(0, common_1.button)('export-menu', (0, common_1.icon)('download', 15) + '<span>Export</span>' + (0, common_1.icon)('down', 12), 'export-button')}<div id="export-menu" class="export-menu" hidden>${['json', 'svg', 'png', 'csv', 'pdf'].map(k => (0, common_1.button)('export:' + k, ({ json: 'Save model JSON', svg: 'Vector diagram SVG', png: 'Annotated PNG', csv: 'Results CSV', pdf: 'Calculation report PDF' })[k], '')).join('')}${(0, common_1.button)('open-json', 'Open model JSON', '')}${(0, common_1.button)('method', 'Method & sources', '')}${(0, common_1.button)('demo', 'Presentation tour', '')}${(0, common_1.button)('audit', 'Model checks & verification JSON', '')}${(0, common_1.button)('verify', 'Run benchmark checks', '')}</div></div><a class="launch" href="#workspace" data-entry="build">Build / Explore ${(0, common_1.icon)('right', 14)}</a></div></header>
  <section class="hero" id="home"><canvas id="hero-network" aria-hidden="true"></canvas><div class="hero-glow" id="hero-glow"></div><div class="hero-content"><div class="eyebrow"><i></i>SPATIAL STRUCTURAL ANALYSIS</div><h1>Build structures.<br><span>Feel the forces.</span></h1><div class="hero-bottom"><div class="hero-copy"><p>Turn a beam into something you can <strong>touch, move and understand.</strong> Place the loads. Move the supports. See the structure and its diagrams respond as one.</p><a class="hero-cta" href="#workspace" data-entry="build">Build / Explore ${(0, common_1.icon)('right', 16)}</a><a class="hero-learn" href="#workspace" data-entry="learn">Guided learning <span aria-hidden="true">→</span></a>${(0, common_1.button)('demo', 'Take an 8-step tour ' + (0, common_1.icon)('right',14), 'hero-tour')}<span class="hero-detail">Start building immediately, or choose guidance. One model, one solver. No sign-in or lesson prerequisites.</span></div><div class="hero-demo" id="hero-demo"><div class="demo-label">LIVE FORCE FIELD <span>50 kN / move the load</span></div><svg id="hero-beam" viewBox="0 0 560 214" role="img" aria-label="Interactive simply supported beam demonstration"></svg><label class="demo-range"><span>Move pointer, or use the slider</span><input id="hero-slider" type="range" min=".08" max=".92" value=".64" step=".01" aria-label="Homepage load position"></label></div></div><div class="scroll-cue"><i></i>SCROLL TO EXPLORE</div></div></section>
  <section class="transition-copy"><span class="eyebrow">ONE CONNECTED SYSTEM</span><h2>Analyse the behaviour.<br><span>Then review the design context.</span></h2><p>Build and analyse directly, explore optional lessons, and review your results. Choose the tools and explanations you need without changing the underlying solver.</p></section>
  <main id="workspace" tabindex="-1"><div id="workspace-mode-bar" class="workspace-mode-bar"></div><div id="learning-bar" class="learning-bar"></div><div id="workflow-context"></div><div class="workspace-heading"><div><span class="eyebrow">YOUR STRUCTURAL WORKSPACE</span><div id="study-name"></div></div><div><span class="save-state"><i class="dot mint"></i><span id="save-label">Local study</span></span>${(0, common_1.button)('focus-mode', (0, common_1.icon)('expand', 14) + ' Focus', 'secondary')}${(0, common_1.button)('demo', (0, common_1.icon)('right', 14) + ' Present', 'secondary')}${(0, common_1.button)('library', (0, common_1.icon)('copy', 14) + ' Studies', 'secondary')}</div></div>
  <div id="level-notice" class="level-notice" hidden></div><div id="demo-guide" class="demo-guide" hidden></div><div id="mobile-tools" class="mobile-tools"></div><div id="workspace-grid" class="workspace-grid"><aside id="controls" class="panel controls"></aside><div class="centre"><section class="panel stage"><header id="toolbar" class="toolbar"></header><div id="case-summary" class="case-summary"></div><div id="metrics" class="metrics"></div><div id="error" class="model-error" role="alert" hidden></div><div id="trace-readout" class="trace-readout"></div><div id="compare-note" class="compare-note" hidden></div><div id="graphs" class="diagram-board"></div><div id="trace-position"></div><footer id="stage-footer" class="stage-footer"></footer></section><details id="assumptions" class="assumptions" hidden></details><section id="section-stress" class="panel" hidden></section><section id="shear-stress" class="panel" hidden></section><section id="moving-lab" class="panel" hidden></section><section id="teaching" class="panel teaching" hidden></section><section id="review" class="panel review" hidden></section><div id="working-toggle"></div><section id="working" class="panel working" hidden></section></div><aside id="inspector" class="panel inspector"></aside></div><section id="design-studio" class="design-studio" hidden></section>
  <div class="workspace-foot"><span>Same model. Different depth.</span><button data-action="history" id="history-count" class="text-button">0 edits</button><span>Analysis + transparent design screening / not structural design approval</span></div></main>
  <footer class="site-footer"><a class="brand" href="#home"><span>B</span><b>BeamLab</b></a><p>Build understanding before building structures.</p><small>Studio ${verification.RELEASE} / analysis + design-context preview. Your model and design inputs stay in your browser unless you export or share them.</small></footer>
  <input id="progress-file" type="file" accept=".json,application/json" aria-label="Import learning progress" hidden><input id="model-file" type="file" accept=".json,application/json" aria-label="Import BeamLab model JSON" hidden><div id="toast" class="toast" role="status"></div><div id="inline-edit" class="inline-edit"></div><div id="drag-ghost" class="drag-ghost" hidden></div><div id="marquee" class="marquee" hidden></div>
  <div id="dialog" class="dialog-overlay" aria-hidden="true"><section role="dialog" aria-modal="true" aria-labelledby="dialog-title" class="dialog"><header><h2 id="dialog-title"></h2><button id="dialog-close" class="icon-button" data-action="dialog-close" aria-label="Close dialog">${(0, common_1.icon)('close', 20)}</button></header><div id="dialog-content"></div></section></div><button id="mobile-done" data-action="deselect" class="mobile-done" hidden>Done editing ${(0, common_1.icon)('check', 14)}</button>`;
    movingLab = new MovingLab($('#moving-lab'),()=>{v.moving=false;render();});
    document.addEventListener('click', e => {
        const el = e.target, actionEl = el.closest('[data-action]');
        const entry = el.closest('[data-entry]');
        if (entry) {
            e.preventDefault();
            enterWorkspace(entry.dataset.entry);
            return;
        }
        if (el.closest('a[href="#home"]')) {
            pauseSweep(); if(demoSession) endDemo();
            e.preventDefault();
            document.body.classList.remove('focus-mode');
            updateFocusControl();
            window.scrollTo({top:0,behavior:'smooth'});
            return;
        }
        if (actionEl) {
            void action(actionEl.dataset.action, actionEl);
            return;
        }
        const object = el.closest('[data-select-object]');
        if (object) {
            selectObject(object.dataset.selectObject, e.shiftKey || e.ctrlKey || e.metaKey);
            return;
        }
        const tool = el.closest('[data-tool]');
        if (tool && e.detail === 0) {
            add(tool.dataset.tool);
            return;
        }
        if (el.closest('svg[data-chart]') && !drag && v.trace !== null) {
            v.pinned = !v.pinned;
            updateTrace();
        }
        if (el === $('#dialog'))
            closeDialog();
        if (!el.closest('.export-wrap'))
            $('#export-menu').hidden = true;
    });
    document.addEventListener('dblclick', e => { const el = e.target, object = el.closest('[data-object]'); if (object)
        inlineEdit(object.dataset.object, e); });
    document.addEventListener('input', e => { const el = e.target;
        if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && (el.dataset.designNumber || el.dataset.designText)) { updateDesignInput(el); return; }
        if (el instanceof HTMLInputElement && (el.dataset.range === 'trace' || el.hasAttribute('data-trace-number'))) {
            const x=el.valueAsNumber; if (!Number.isFinite(x) || x<0 || x>history.model.length) {el.setAttribute('aria-invalid','true');return;}
            el.removeAttribute('aria-invalid');v.trace=x;v.pinned=true;updateTrace();return;
        }
        if (el instanceof HTMLInputElement && el.dataset.field)
        applyNumber(el); if (el instanceof HTMLInputElement && el.dataset.range === 'pan') {
        v.pan = Number(el.value);
        $('#graphs').innerHTML = (0, diagrams_1.renderDiagrams)(history.model, analysis, diagramView());
        updateTrace();
    } });
    document.addEventListener('focusout', e => { const el = e.target; if (el instanceof HTMLInputElement && el.dataset.field) {
        const transaction = fieldTransaction;
        if (transaction?.input === el && transaction.tabbed) {
            // Wait for native Tab/Shift+Tab focus movement, then commit this
            // edit independently of any later click or change on that control.
            setTimeout(() => { if (fieldTransaction === transaction) finishField(true); }, 0);
            return;
        }
        // A pointer press focuses its target before click. Replacing that target
        // here cancels the click in Firefox. The destination's action/input
        // handler commits this transaction before using the model instead.
        if (e.relatedTarget instanceof Element && e.relatedTarget.closest('button,a,input,select,textarea,[data-object]')) return;
        setTimeout(() => { if (fieldTransaction?.input === el)
            finishField(); }, 0);
    } });
    window.addEventListener('pagehide', () => { finishField(); save(); });
    document.addEventListener('change', e => { const el = e.target; if(el.id==='progress-file'){void previewLearningImport(el.files?.[0]);return;} if(el instanceof HTMLInputElement && el.dataset.range==='fibre'){v.fibre=Number(el.value);$('#section-stress').innerHTML=sectionLab.render(history.model,analysis,v.trace ?? analysis?.peakM.x ?? 0,v.fibre,v.sectionSide);$('#fibre-slider')?.focus({preventScroll:true});return;} if (el instanceof HTMLSelectElement && el.dataset.select)
        selectChanged(el); if (el instanceof HTMLInputElement && el.dataset.text)
        textChanged(el); if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)
        if (el.dataset.designNumber || el.dataset.designSelect || el.dataset.designText) updateDesignInput(el, !!el.dataset.designSelect); });
    document.addEventListener('pointerdown', pointerDown);
    document.addEventListener('pointermove', pointerMove);
    document.addEventListener('pointerup', e => pointerUp(e));
    document.addEventListener('pointercancel', e => pointerUp(e, true));
    $('#graphs').addEventListener('pointerleave', () => { if (!drag && !v.pinned) {
        v.trace = null;
        updateTrace();
    } });
    document.addEventListener('visibilitychange', () => { if(document.hidden) { pauseSweep(); persistGuidedStudyBlock(); } });
    window.addEventListener('pagehide', () => { persistGuidedStudyBlock(); pauseSweep(); });
    document.addEventListener('input', e => {
        if(e.target.id==='sweep-slider'){pauseSweep();sweepProgress=Number(e.target.value);applySweep();}
    });
    document.addEventListener('keydown', e => {
        if ($('#dialog').classList.contains('open')) {
            if (e.key === 'Escape') {
                closeDialog();
                e.preventDefault();
            }
            if (e.key === 'Tab') {
                const focusable = [...$('#dialog').querySelectorAll('button:not(:disabled),input,textarea,a[href],select')];
                const first = focusable[0], last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                }
                else if (!e.shiftKey && document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
            return;
        }
        const input = e.target;
        if (input.matches('input,textarea,select')) {
            if (e.key === 'Tab' && fieldTransaction?.input === input) fieldTransaction.tabbed = true;
            if (e.key === 'Enter' && input instanceof HTMLInputElement) {
                finishField();
                input.blur();
                if (inlineId) {
                    inlineId = null;
                    $('#inline-edit').innerHTML = '';
                }
            }
            if (e.key === 'Escape' && inlineId) {
                finishField();
                inlineId = null;
                $('#inline-edit').innerHTML = '';
            }
            return;
        }
        if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); shortcutsDialog(); return; }
        if(demoSession && (e.key==='PageDown' || e.key==='PageUp')) { e.preventDefault();showDemoStep(demoSession.index+(e.key==='PageDown'?1:-1));return; }
        if(demoSession?.index===0 && e.key===' ' && !input.closest('button,a,[data-object]')) { e.preventDefault();if(sweepPlaying)pauseSweep();else playSweep();return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            void action(e.shiftKey ? 'redo' : 'undo');
        }
        else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            duplicate();
        }
        else if (e.key === 'Delete' || e.key === 'Backspace') {
            if (v.selected.size) {
                e.preventDefault();
                remove();
            }
        }
        else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && v.selected.size) {
            e.preventDefault();
            nudge((e.key === 'ArrowLeft' ? -1 : 1) * (v.snap || .01) * (e.shiftKey ? 10 : 1));
        }
        else if (e.key === 'Escape') {
            if (palette) { palette = null; $('#drag-ghost').hidden = true; }
            if (drag) {
                history.model = drag.base;
                drag = null;
                $('#marquee').hidden = true;
                layout = undefined;
            }
            v.selected.clear();
            v.pinned = false;
            v.trace = null;
            $('#inline-edit').innerHTML = '';
            render();
        }
        else if ((e.key === 'Enter' || e.key === ' ') && input.closest('[data-object]')) {
            e.preventDefault();
            selectObject(input.closest('[data-object]').dataset.object, e.shiftKey);
        }
    });
    $('#model-file').addEventListener('change', async (e) => { const input = e.target, f = input.files?.[0]; if (!f)
        return; try {
        if (f.size > 150000)
            throw new Error('Model exceeds 150 kB.');
        const m = (0, study_1.parseStudy)(await f.text());
        if (!openUserStudy(m, 'Import model JSON')) return;
        toast('Model imported. Undo restores your previous study.');
    }
    catch (e) {
        toast('File not opened: ' + (e instanceof Error ? e.message : 'Invalid JSON'));
    }
    finally {
        input.value = '';
    } });
    const ro = new ResizeObserver(entries => { const w = Math.max(280, entries[0].contentRect.width); if (Math.abs(w - width) > .5) {
        width = w;
        layout = undefined;
        renderStage();
    } });
    ro.observe($('#graphs'));
    window.addEventListener('scroll', () => { const max = document.documentElement.scrollHeight - innerHeight; $('#scroll-progress').style.width = (max ? scrollY / max * 100 : 0) + '%'; $('.topbar').classList.toggle('scrolled', scrollY > 50); }, { passive: true });
    render();
    save();
    hero();
    if (restoreNotice)
        toast(restoreNotice);
    if (location.hash.startsWith('#model=')) {
        const code = location.hash;
        openDialog('A shared model is ready', `<p>Opening replaces the current study, but you can undo it. Encoded model data is not a certificate of correctness.</p><textarea id="paste-snapshot" aria-label="Paste model snapshot">${(0, common_1.esc)(code)}</textarea>${(0, common_1.button)('open-snapshot', 'Open shared study', 'primary')}`);
    }
}
function hero() {
    let ratio = .64;
    const draw = () => {
        const L = 440, A = 60, B = 500, x = A + L * ratio, P = 50, ra = P * (1 - ratio), rb = P * ratio, base = 165, peak = P * L * ratio * (1 - ratio) * .012;
        $('#hero-beam').innerHTML = `<line x1="${A}" x2="${B}" y1="86" y2="86" stroke="#c1d3cc" stroke-width="4" stroke-linecap="round"/><path d="M${A} 91l-10 18h20Z M${B} 91l-10 18h20Z" fill="#bacdc6"/><circle cx="${B - 5}" cy="115" r="3" stroke="#a1b9af" fill="none"/><circle cx="${B + 5}" cy="115" r="3" stroke="#a1b9af" fill="none"/><line x1="${x}" x2="${x}" y1="29" y2="72" stroke="#f79e85" stroke-width="2"/><path d="M${x - 5} 65l5 10 5-10" fill="#f79e85"/><text x="${x}" y="19" fill="#efbbaa" font-size="11" text-anchor="middle">50 kN</text><line x1="${A}" x2="${B}" y1="${base}" y2="${base}" stroke="#4a5461"/><path d="M${A} ${base}L${x} ${base - peak}L${B} ${base}Z" fill="#a397ed" opacity=".13"/><path d="M${A} ${base}L${x} ${base - peak}L${B} ${base}" stroke="#a397ed" stroke-width="2" fill="none"/><text x="${A}" y="194" fill="#6f8390" font-size="8">BENDING MOMENT / LIVE</text><text x="${A}" y="133" fill="#90c9b6" text-anchor="middle" font-size="10">${(0, common_1.fmt)(ra, 1)} kN</text><text x="${B}" y="137" fill="#90c9b6" text-anchor="middle" font-size="10">${(0, common_1.fmt)(rb, 1)} kN</text>`;
    };
    draw();
    $('#hero-demo').addEventListener('pointermove', e => { const r = $('#hero-beam').getBoundingClientRect(); ratio = (0, common_1.clamp)((e.clientX - r.left) / r.width, .08, .92); $('#hero-slider').value = String(ratio); draw(); });
    $('#hero-slider').addEventListener('input', e => { ratio = Number(e.target.value); draw(); });
    const canvas = $('#hero-network'), ctx = canvas.getContext('2d');
    if (!ctx)
        return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = true, mouse = { x: -1000, y: -1000 };
    let cw = 0, ch = 0, nodes = [];
    function resize() { const r = $('#home').getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5); cw = r.width; ch = r.height; canvas.width = cw * dpr; canvas.height = ch * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); nodes = Array.from({ length: Math.min(62, Math.round(cw / 23)) }, (_, i) => ({ x: ((i * 213.43 + 79) % cw), y: ((i * 97.61 + 23) % ch), vx: Math.sin(i) * .06, vy: Math.cos(i) * .06 })); }
    resize();
    window.addEventListener('resize', resize);
    $('#home').addEventListener('pointermove', e => { const r = $('#home').getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; $('#hero-glow').style.setProperty('--x', mouse.x + 'px'); $('#hero-glow').style.setProperty('--y', mouse.y + 'px'); });
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe($('#home'));
    let last = 0;
    function frame(t) {
        if (!reduced)
            requestAnimationFrame(frame);
        if (!visible || document.hidden || t - last < 32)
            return;
        last = t;
        ctx.clearRect(0, 0, cw, ch);
        nodes.forEach((n, i) => { if (!reduced) {
            n.x = (n.x + n.vx + cw) % cw;
            n.y = (n.y + n.vy + ch) % ch;
        } ctx.fillStyle = '#75cdb76b'; ctx.fillRect(n.x, n.y, 1.7, 1.7); for (let j = i + 1; j < nodes.length; j++) {
            const other = nodes[j], d = Math.hypot(n.x - other.x, n.y - other.y);
            if (d < 145) {
                ctx.beginPath();
                ctx.moveTo(n.x, n.y);
                ctx.lineTo(other.x, other.y);
                ctx.strokeStyle = `rgba(94,175,167,${(1 - d / 145) * .1})`;
                ctx.stroke();
            }
        } if (Math.hypot(n.x - mouse.x, n.y - mouse.y) < 155) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = 'rgba(98,170,190,.1)';
            ctx.stroke();
        } });
    }
    requestAnimationFrame(frame);
}
bootstrap();
