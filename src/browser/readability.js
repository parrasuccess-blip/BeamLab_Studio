(() => {
  'use strict';
  const workspace = document.getElementById('workspace');
  if (!workspace) return;
  const storageKey = 'beamlab:studio:3.2';
  const normal = value => String(value || '').replace(/\\s+/g, ' ').trim().toLowerCase();
  const selector = 'h1,h2,h3,h4,p,b,strong,span,small,summary';
  const sectionSpecs = [
    ['carry verified analysis demand into a transparent design review', 'bl-design-hero'],
    ['deterministic analysis carried into design context', 'bl-design-demand'],
    ['demand divided by the criteria you supplied', 'bl-design-checks'],
    ['what is known, entered, and still missing', 'bl-design-readiness'],
    ['record where the numbers came from', 'bl-design-traceability'],
    ['action factor ledger', 'bl-design-factors'],
    ['elastic first-yield reference', 'bl-design-elastic'],
    ['australian design context', 'bl-design-reference']
  ];
  let queued = false;
  const leafFor = text => [...workspace.querySelectorAll(selector)].find(el => normal(el.textContent).includes(text));
  const panelFor = leaf => {
    let el = leaf;
    for (let depth = 0; el && el !== workspace && depth < 7; depth += 1, el = el.parentElement) {
      const name = String(el.className || '');
      if (el.tagName === 'ARTICLE' || el.tagName === 'SECTION' || /(^|\\s)(panel|card|review|design[^ ]*)(\\s|$)/i.test(name)) return el;
    }
    return leaf?.parentElement || null;
  };
  const safeJson = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
    } catch { return fallback; }
  };
  const learningSnapshot = () => {
    const mastery = safeJson(storageKey + ':mastery', {});
    const entries = Object.entries(mastery).slice(0, 12).map(([topic, stat]) => ({
      topic,
      attempts: Number.isFinite(stat?.attempts) ? stat.attempts : 0,
      firstAttempts: Number.isFinite(stat?.firstAttempts) ? stat.firstAttempts : 0,
      firstCorrect: Number.isFinite(stat?.firstCorrect) ? stat.firstCorrect : 0,
      correct: Number.isFinite(stat?.correct) ? stat.correct : 0,
      reveals: Number.isFinite(stat?.reveals) ? stat.reveals : 0,
      lastAt: Number.isFinite(stat?.lastAt) ? stat.lastAt : null
    }));
    const activeTask = document.querySelector('.lesson-active > b, .challenge-active > b')?.textContent?.trim() || null;
    return {
      activeTask,
      topics: entries,
      interpretationBoundary: 'Deterministic local learning evidence. Use for tutoring sequence and tentative diagnostic questions, never as structural numerical authority.'
    };
  };
  const installTutorAdapter = () => {
    const api = window.BeamLabTutorApi;
    if (!api?.ask || api.ask.__beamlabAdaptiveContext) return;
    const original = api.ask.bind(api);
    const wrapped = async payload => {
      const context = payload?.context && typeof payload.context === 'object' ? payload.context : {};
      return original({ ...payload, context: { ...context, learning: learningSnapshot() } });
    };
    wrapped.__beamlabAdaptiveContext = true;
    window.BeamLabTutorApi.ask = wrapped;
  };
  const clearMarks = () => {
    workspace.classList.remove('bl-design-readable');
    for (const [, cls] of sectionSpecs) workspace.querySelectorAll('.' + cls).forEach(el => el.classList.remove(cls, 'bl-design-panel'));
    workspace.querySelectorAll('.bl-design-guide').forEach(el => el.remove());
  };
  const enhanceTutorUi = () => {
    const strip = document.querySelector('.ai-context-strip');
    if (strip && !strip.querySelector('.bl-adaptive-chip')) {
      const chip = document.createElement('span');
      chip.className = 'bl-adaptive-chip';
      chip.textContent = 'adaptive learning context';
      strip.appendChild(chip);
    }
  };
  const apply = () => {
    queued = false;
    installTutorAdapter();
    enhanceTutorUi();
    const heroLeaf = leafFor(sectionSpecs[0][0]);
    if (!heroLeaf) { clearMarks(); return; }
    workspace.classList.add('bl-design-readable');
    let heroPanel = null;
    for (const [text, cls] of sectionSpecs) {
      const leaf = leafFor(text);
      if (!leaf) continue;
      const panel = panelFor(leaf);
      if (!panel) continue;
      panel.classList.add('bl-design-panel', cls);
      if (cls === 'bl-design-hero') heroPanel = panel;
    }
    // Design Studio now provides its own source-native guided workflow.
    // This enhancer only applies readability classes and tutor context.

  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  schedule();
})();
