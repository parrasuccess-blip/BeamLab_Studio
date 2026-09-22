import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

const act=(page,name)=>page.locator(`[data-action="${name}"]`);
async function showTools(page) {const toggle=page.locator('#mobile-tools button');if(await toggle.isVisible()&&await toggle.getAttribute('aria-expanded')==='false')await toggle.click();}
async function hideMobileTools(page) {const toggle=page.locator('#mobile-tools button');if(await toggle.isVisible()&&await toggle.getAttribute('aria-expanded')==='true')await toggle.click();}
async function open(page,level='year1') {
  await page.goto('/#workspace');
  await expect(page.locator('#graphs svg').first()).toBeVisible();
  const setup=act(page,`level-setup:${level}`);
  if(await setup.isVisible()) await setup.click();
  else {
    const preferences=act(page,'level-preferences');
    if(await preferences.isVisible()&&await preferences.getAttribute('aria-expanded')==='false')await preferences.click();
    await act(page,`level:${level}`).click();
  }
  await showTools(page);
}
async function flow(page,phase) {await page.locator('.workflow-nav').locator(`[data-action="workflow:${phase}"]`).click();}
async function closeInspector(page) {const button=page.locator('#inspector [data-action="deselect"]');if(await button.isVisible())await button.click();else await page.keyboard.press('Escape');}
async function modelCopy(page) {
  await act(page,'share').first().click();
  const text=await page.locator('#share-code').inputValue();
  await page.getByRole('button',{name:'Close dialog',exact:true}).click();
  return text;
}
async function noOverflow(page) {
  const dimensions=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,width:document.documentElement.scrollWidth}));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport+1);
}
test.beforeEach(async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  page.__beamErrors=errors;
});
test.afterEach(async({page})=>{expect(page.__beamErrors,'uncaught application errors').toEqual([]);});

test('homepage opens full engineering tools without a learning gate',async({page},testInfo)=>{
  await page.goto('/');
  const primary=page.locator('.hero-cta');
  await expect(primary).toContainText('Build / Explore');
  await primary.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.workflow-nav [aria-current]')).toContainText('Build / Explore');
  await expect(page.locator('#level-options')).toBeHidden();
  await expect(page.locator('#learning-bar')).toContainText('All Tools');
  await showTools(page);
  await expect(act(page,'tab:cases')).toBeVisible();await expect(act(page,'tab:section')).toBeVisible();
  await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('6');
  await expect(page.locator('#metrics')).toContainText('30');
  await hideMobileTools(page);await noOverflow(page);
  await page.screenshot({path:testInfo.outputPath('direct-explore.png'),fullPage:true});
  await flow(page,'analyse');
  await expect(page.locator('#workflow-context [data-action="workflow:review"]')).toBeVisible();
  await expect(page.locator('#workflow-context [data-action="workflow:learn"]')).toHaveCount(0);
});

test('guided entry is optional and direct engineering entry preserves an edited beam',async({page})=>{
  await open(page);
  await page.getByLabel('Beam length',{exact:true}).fill('8');await page.getByLabel('Beam length',{exact:true}).press('Tab');
  const original=await modelCopy(page);
  await page.locator('.hero-learn').click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.workflow-nav [aria-current]')).toContainText('Learn');
  await act(page,'level:year2').click();expect(await modelCopy(page)).toBe(original);
  await page.locator('.launch').click();
  await expect(page.locator('#learning-bar')).toContainText('All Tools');
  expect(await modelCopy(page)).toBe(original);
  await page.reload();expect(await modelCopy(page)).toBe(original);
});

test('individual lessons have ordered navigation and restore model and undo history',async({page},testInfo)=>{
  await open(page);
  await page.getByLabel('Beam length',{exact:true}).fill('8');await page.getByLabel('Beam length',{exact:true}).press('Tab');
  await page.getByLabel('Beam length',{exact:true}).fill('9');await page.getByLabel('Beam length',{exact:true}).press('Tab');
  await act(page,'undo').click();
  await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('8');
  await act(page,'compare').click();
  const original=await modelCopy(page),history=await page.locator('#history-count').textContent();
  const saved=await page.evaluate(()=>localStorage.getItem('beamlab:studio:3.2'));
  await flow(page,'learn');await page.locator('.lesson-list button').first().click();
  await expect(page.locator('.learning-model-notice')).toContainText('Return to your model to restore');
  await expect(page.locator('#toast')).not.toContainText('Example loaded');
  const nav=page.getByRole('navigation',{name:'Lesson navigation',exact:true});
  await expect(nav.getByRole('button',{name:'Previous',exact:true})).toBeDisabled();
  await nav.getByRole('button',{name:'Next',exact:true}).click();await expect(nav).toContainText('2 of');
  await nav.getByRole('button',{name:'Previous',exact:true}).click();await expect(nav).toContainText('1 of');
  await noOverflow(page);await page.screenshot({path:testInfo.outputPath('focused-lesson.png'),fullPage:true});
  expect(await page.evaluate(()=>localStorage.getItem('beamlab:studio:3.2'))).toBe(saved);
  await nav.getByRole('button',{name:'All lessons',exact:false}).click();
  await expect(page.locator('.lesson-list')).toBeVisible();expect(await modelCopy(page)).toBe(original);
  await page.locator('.lesson-list button').first().click();
  await flow(page,'build');expect(await modelCopy(page)).toBe(original);
  await expect(page.locator('#history-count')).toHaveText(history);
  await expect(page.getByRole('button',{name:'Clear comparison',exact:true}).first()).toBeVisible();
  await expect(act(page,'redo')).toBeEnabled();
  await act(page,'redo').click();await showTools(page);await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('9');
  await act(page,'undo').click();expect(await modelCopy(page)).toBe(original);
  await act(page,'undo').click();await showTools(page);await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('6');
  await act(page,'redo').click();await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('8');
});

test('challenge examples do not overwrite the browser model and reload preserves learning evidence',async({page})=>{
  await open(page);
  await page.getByLabel('Beam length',{exact:true}).fill('8');await page.getByLabel('Beam length',{exact:true}).press('Tab');
  const original=await modelCopy(page),saved=await page.evaluate(()=>localStorage.getItem('beamlab:studio:3.2'));
  await flow(page,'learn');await act(page,'learn-section:challenges').click();
  await page.locator('.challenge-list button').first().click();await act(page,'challenge-reveal').click();
  await expect(page.locator('.challenge-feedback')).toContainText('Reference answer');
  expect(await page.evaluate(()=>localStorage.getItem('beamlab:studio:3.2'))).toBe(saved);
  const evidence=await page.evaluate(()=>localStorage.getItem('beamlab:studio:3.2:learning-evidence'));
  expect(JSON.parse(evidence).some(e=>e.event==='reveal')).toBe(true);
  await page.reload();expect(await modelCopy(page)).toBe(original);
  await expect(act(page,'undo')).toBeDisabled();await expect(act(page,'redo')).toBeDisabled();
  await expect(page.getByRole('button',{name:'Freeze comparison',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('beamlab:studio:3.2:learning-evidence'))).toBe(evidence);
});

for(const method of ['saved','snapshot','json']) test(`opening a ${method} study during a lesson retains the opened model and undo returns to the original`,async({page})=>{
  await open(page);
  await page.getByLabel('Beam length',{exact:true}).fill('9');await page.getByLabel('Beam length',{exact:true}).press('Tab');
  const replacement=await modelCopy(page);
  const replacementJson=await page.evaluate(()=>localStorage.getItem('beamlab:studio:3.2'));
  if(method==='saved') {await act(page,'library').first().click();await act(page,'save-named').click();await act(page,'dialog-close').click();}
  await page.getByLabel('Beam length',{exact:true}).fill('8');await page.getByLabel('Beam length',{exact:true}).press('Tab');
  const original=await modelCopy(page);
  await flow(page,'learn');await page.locator('.lesson-list button').first().click();
  if(method==='saved') {await act(page,'library').first().click();await act(page,'open-named:0').click();}
  if(method==='snapshot') {await act(page,'share').first().click();await page.getByLabel('Paste model snapshot').fill(replacement);await act(page,'open-snapshot').click();}
  if(method==='json') {
    await page.locator('#model-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{invalid')});
    await expect(page.locator('.learning-model-notice')).toBeVisible();
    await expect(page.locator('#toast')).toContainText('File not opened');
    await page.locator('#model-file').setInputFiles({name:'replacement.json',mimeType:'application/json',buffer:Buffer.from(replacementJson)});
  }
  await expect(page.locator('.workflow-nav [aria-current]')).toContainText('Build / Explore');
  await expect(page.locator('.learning-model-notice')).toHaveCount(0);
  expect(await modelCopy(page)).toBe(replacement);
  await flow(page,'analyse');await flow(page,'build');expect(await modelCopy(page)).toBe(replacement);
  await act(page,'undo').click();expect(await modelCopy(page)).toBe(original);
  await act(page,'redo').click();expect(await modelCopy(page)).toBe(replacement);
  await page.reload();expect(await modelCopy(page)).toBe(replacement);
});

test('starting full practice from a standalone lesson still restores the original engineering model',async({page})=>{
  await open(page);
  await page.getByLabel('Beam length',{exact:true}).fill('8');await page.getByLabel('Beam length',{exact:true}).press('Tab');
  const original=await modelCopy(page);
  await flow(page,'learn');await page.locator('.lesson-list button').first().click();
  await act(page,'learn-section:session').click();await act(page,'session-start:practice').click();
  await act(page,'session-exit').click();await act(page,'session-exit-confirm').click();
  expect(await modelCopy(page)).toBe(original);
});

test('first-year reference, four destinations and aligned diagrams',async({page},testInfo)=>{
  await open(page);
  await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('6');
  await expect(page.locator('#metrics')).toContainText('30');
  for(const phase of ['build','analyse','learn','review']) {
    await flow(page,phase);
    await hideMobileTools(page);
    await expect(page.locator('.workflow-nav [aria-current]')).toContainText(phase==='analyse'?'Analyse':phase[0].toUpperCase()+phase.slice(1));
    await noOverflow(page);
    if(phase==='review') await expect(page.locator('.review-score')).toContainText('6/6');
    else await expect(page.locator('#graphs svg').first()).toBeVisible();
    await page.screenshot({path:testInfo.outputPath(`${phase}.png`),fullPage:true});
  }
  await flow(page,'analyse');
  const diagrams=await page.locator('#graphs .diagram-block>svg').evaluateAll(nodes=>nodes.map(n=>({x:n.getBoundingClientRect().x,width:n.getBoundingClientRect().width})));
  expect(diagrams.length).toBeGreaterThanOrEqual(3);
  for(const diagram of diagrams.slice(1)){expect(Math.abs(diagram.x-diagrams[0].x)).toBeLessThan(1);expect(Math.abs(diagram.width-diagrams[0].width)).toBeLessThan(1);}
});

test('genuine edit survives every learning level, navigation and reload',async({page})=>{
  await open(page);
  await page.locator('#controls').getByRole('button',{name:'Select P1',exact:true}).click();
  await page.getByLabel('Force',{exact:true}).fill('27');
  await act(page,'level:year2').click();
  await closeInspector(page);
  const edited=await modelCopy(page);
  for(const level of ['year3','all','year1']) {
    await act(page,`level:${level}`).click();expect(await modelCopy(page)).toBe(edited);
  }
  await flow(page,'review');expect(await modelCopy(page)).toBe(edited);
  await page.reload();expect(await modelCopy(page)).toBe(edited);
  await expect(page.locator('#metrics')).toContainText('40.5');
});

test('unchanged and invalid fields do not count as genuine model edits',async({page})=>{
  await open(page);
  await page.getByLabel('Beam length',{exact:true}).fill('6');
  await act(page,'level:year2').click();
  await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('10');
  await page.getByLabel('Beam length',{exact:true}).fill('0');
  await expect(page.getByLabel('Beam length',{exact:true})).toHaveAttribute('aria-invalid','true');
  await act(page,'level:year1').click();
  await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('6');
  await expect(page.locator('#error')).toBeHidden();
});

test('unstable model reports a fault and undo restores the reference',async({page})=>{
  await open(page);
  await page.locator('#controls').getByRole('button',{name:'Select B',exact:true}).click();
  await page.locator('#inspector').getByRole('button',{name:'Remove',exact:true}).click();
  await expect(page.locator('#error')).toBeVisible();
  await flow(page,'review');
  await expect(page.locator('#design-studio')).toContainText('Complete a stable model first');
  await flow(page,'build');
  await act(page,'undo').click();
  await expect(page.locator('#error')).toBeHidden();
  await expect(page.locator('#metrics')).toContainText('30');
});

test('Tab commits each numeric edit, keeps keyboard focus and saves before any action',async({page,isMobile,browserName})=>{
  await open(page);
  for(const [value,count] of [['8',1],['9',2]]) {
    await page.getByLabel('Beam length',{exact:true}).fill(value);
    await page.getByLabel('Beam length',{exact:true}).press('Tab');
    await expect(page.getByLabel('Example library',{exact:true})).toBeFocused();
    await expect(page.locator('#history-count')).toHaveText(`${count} edits`);
    await expect(act(page,'undo')).toBeEnabled();
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('beamlab:studio:3.2')).length)).toBe(Number(value));
  }
  await act(page,'undo').click();await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('8');
  await act(page,'undo').click();await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('6');
  await act(page,'redo').click();await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('8');
  await act(page,'redo').click();await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('9');
  await page.getByLabel('Beam length',{exact:true}).fill('10');
  await page.getByLabel('Beam length',{exact:true}).press('Shift+Tab');
  // Firefox includes the scrollable tools panel in its native tab order.
  // Preserve that destination, then verify keyboard navigation continues.
  const previousControl=page.getByRole('button',{name:isMobile?'Done with tools':'Studies',exact:true});
  await expect(browserName==='firefox'?page.locator('#controls'):previousControl).toBeFocused();
  if(browserName==='firefox') {
    await page.keyboard.press('Shift+Tab');
    await expect(previousControl).toBeFocused();
  }
  await expect(page.locator('#history-count')).toHaveText('3 edits');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('beamlab:studio:3.2')).length)).toBe(10);
  await act(page,'undo').click();await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('9');
  await page.reload();await showTools(page);
  await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('9');
  await expect(act(page,'undo')).toBeDisabled();await expect(act(page,'redo')).toBeDisabled();
});

test('returning to a field before its Tab timer runs preserves separate edits',async({page})=>{
  await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});
  await open(page);
  await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
  const length=page.getByLabel('Beam length',{exact:true});
  await length.fill('8');await length.press('Tab');
  await length.fill('9');await length.press('Tab');
  // Run the pending commits only after both user edits have arrived.
  await page.clock.runFor(1);
  await expect(page.locator('#history-count')).toHaveText('2 edits');
  await page.clock.resume();
  await act(page,'undo').click();await expect(length).toHaveValue('8');
  await act(page,'undo').click();await expect(length).toHaveValue('6');
  await act(page,'redo').click();await expect(length).toHaveValue('8');
  await act(page,'redo').click();await expect(length).toHaveValue('9');
  await page.reload();await showTools(page);await expect(length).toHaveValue('9');
});

test('Undo accepts the first pending edit and invalid Tab edits restore the committed model',async({page})=>{
  await open(page);
  await page.getByLabel('Beam length',{exact:true}).fill('8');
  await expect(act(page,'undo')).toBeEnabled();
  await act(page,'undo').click();await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('6');
  await expect(page.locator('#history-count')).toHaveText('0 edits');
  await act(page,'redo').click();await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('8');
  await page.getByLabel('Beam length',{exact:true}).fill('9');
  await page.getByLabel('Beam length',{exact:true}).fill('0');
  await expect(page.getByLabel('Beam length',{exact:true})).toHaveAttribute('aria-invalid','true');
  await page.getByLabel('Beam length',{exact:true}).press('Tab');
  await expect(page.getByLabel('Example library',{exact:true})).toBeFocused();
  await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('8');
  await expect(page.locator('#history-count')).toHaveText('1 edits');
  await expect(page.locator('#metrics')).toContainText('40.00 kN·m');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('beamlab:studio:3.2')).length)).toBe(8);
  await act(page,'undo').click();await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('6');
});

for(const value of ['6','8']) test(`numeric edit ${value} cannot remove a pressed navigation control`,async({page})=>{
  await open(page);
  await page.getByLabel('Beam length',{exact:true}).fill(value);
  const button=act(page,'level:year2');await button.scrollIntoViewIfNeeded();
  const handle=await button.elementHandle(),box=await button.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  expect(await handle.evaluate(node=>node.isConnected)).toBe(true);
  await page.mouse.up();
  await expect(act(page,'level:year2')).toHaveAttribute('aria-pressed','true');
  await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue(value==='6'?'10':'8');
});

test('responsive model tools leave the phone diagrams visible and close on object selection',async({page,isMobile})=>{
  await page.goto('/#workspace');
  const tools=page.locator('#controls'),toggle=page.locator('#mobile-tools button');
  if(!isMobile){await expect(toggle).toBeHidden();await expect(tools).toBeVisible();return;}
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await expect(tools).toBeHidden();
  await expect(page.getByRole('img',{name:'Structure and loads',exact:true})).toBeVisible();
  await toggle.click();await expect(tools).toBeVisible();
  const height=await tools.evaluate(node=>node.getBoundingClientRect().height);
  expect(height).toBeLessThanOrEqual(page.viewportSize().height*.6+1);
  await tools.getByRole('button',{name:'Select P1',exact:true}).click();
  await expect(tools).toBeHidden();await expect(page.getByLabel('Force',{exact:true})).toBeVisible();
  await closeInspector(page);await noOverflow(page);
});

test('section fibre explorer responds to position, cut side and fibre selection',async({page})=>{
  await open(page,'all');
  await page.getByLabel('Example library',{exact:true}).selectOption('simple');
  await act(page,'tab:section').click();
  await page.getByLabel('Section geometry',{exact:true}).selectOption('rectangle');
  await flow(page,'analyse');
  await showTools(page);
  await page.getByRole('switch',{name:'Bending stress',exact:true}).click();
  await expect(page.locator('#section-stress')).toBeVisible();
  await page.getByLabel('Inspection position in metres').fill('2');
  await page.getByLabel('Fibre position through section').focus();
  await page.getByLabel('Fibre position through section').press('End');
  await expect(page.locator('.fibre-results')).toContainText('compression');
  await expect(page.locator('.fibre-results')).toContainText('7.5');
  await act(page,'section-side:left').click();
  await expect(act(page,'section-side:left')).toHaveAttribute('aria-pressed','true');
  await noOverflow(page);
});

test('fixed-support rotation is editable, auditable and preserved at a lower level',async({page})=>{
  await open(page,'all');
  await page.getByLabel('Example library',{exact:true}).selectOption('fixed');
  await page.locator('#controls').getByRole('button',{name:'Select A',exact:true}).click();
  await page.getByLabel('Prescribed rotation',{exact:true}).fill('2');
  await closeInspector(page);
  const rotated=await modelCopy(page);
  await flow(page,'review');await expect(page.locator('.review-score')).toContainText('6/6');
  await act(page,'level:year1').click();expect(await modelCopy(page)).toBe(rotated);
  await flow(page,'build');
  await showTools(page);
  await page.locator('#controls').getByRole('button',{name:'Select A',exact:true}).click();
  await expect(page.locator('#inspector')).toContainText('Prescribed rotation active');
});

test('progress export, invalid import and confirmed restore leave the model unchanged',async({page})=>{
  await open(page);const original=await modelCopy(page);
  await flow(page,'learn');await act(page,'progress-transfer').click();
  const downloadEvent=page.waitForEvent('download');await act(page,'progress-export').click();
  const downloaded=await downloadEvent,progress=JSON.parse(await fs.readFile(await downloaded.path(),'utf8'));
  expect(progress.format).toBe('BeamLabLearning');
  await page.locator('#progress-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{no')});
  await expect(page.locator('#toast')).toContainText(/invalid|could not|JSON|expected|property/i);
  await page.locator('#progress-file').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(progress))});
  await expect(page.getByRole('dialog')).toContainText('Review learning-progress import');
  await act(page,'progress-import-confirm').click();
  expect(await modelCopy(page)).toBe(original);
});

test('session navigation is guarded and exiting restores the edited beam',async({page})=>{
  await open(page);
  await page.getByLabel('Beam length',{exact:true}).fill('8');await page.getByLabel('Beam length',{exact:true}).press('Tab');
  const original=await modelCopy(page);
  await flow(page,'learn');await act(page,'learn-section:session').click();
  await act(page,'session-start:practice').click();
  await flow(page,'build');
  await expect(page.locator('.workflow-nav [aria-current]')).toContainText('Learn');
  await act(page,'session-exit').click();await act(page,'session-exit-confirm').click();
  expect(await modelCopy(page)).toBe(original);
});

test('review exports carry the current model and numerical evidence',async({page})=>{
  await open(page);await flow(page,'review');
  const pending=page.waitForEvent('download');await act(page,'export-audit').click();
  const download=await pending,audit=JSON.parse(await fs.readFile(await download.path(),'utf8'));
  expect(audit.release).toBe('4.1.1');expect(audit.pass).toBe(true);expect(audit.checks).toHaveLength(6);expect(audit.model.length).toBe(6);
  const reportPending=page.waitForEvent('download');await page.locator('#design-studio [data-action="export:pdf"]').click();
  const report=await reportPending,pdf=await fs.readFile(await report.path(),'latin1');
  expect(pdf.startsWith('%PDF-1.4')).toBe(true);
  expect(pdf).toContain('Peak moment |M| = 30.0000 kN m');
  expect(pdf).toContain('Not design approval');
  expect(pdf.match(/\/Type \/Page\b/g)).toHaveLength(2);
  await act(page,'privacy').click();await expect(page.getByRole('dialog')).toContainText('encoded, readable snapshot');
  await page.getByRole('button',{name:'Close dialog',exact:true}).click();
  await act(page,'issue-report').click();await expect(page.getByLabel('Issue report JSON')).toHaveValue(/4\.1\.1/);
});

test('optional tutor health is honest and deterministic teaching stays available',async({page,request})=>{
  const health=await request.get('/api/tutor');expect(await health.json()).toEqual({message:'Success',release:'4.1.1',configured:false});
  await open(page);await act(page,'ai-open').click();
  await expect(page.getByRole('dialog')).toContainText('Online tutor is not connected');
  await expect(act(page,'ai-send')).toBeDisabled();
  await act(page,'explain-here').click();
  await expect(page.getByRole('dialog')).toContainText('Why does the beam behave like this here?');
  await expect(page.getByRole('dialog')).toContainText('generated deterministically');
});

test('criteria entry keeps keyboard focus, ratios and sources across navigation and reload',async({page})=>{
  await open(page,'all');
  await page.getByLabel('Example library',{exact:true}).selectOption('reference');
  const original=await modelCopy(page);
  await flow(page,'review');await act(page,'design-open').click();
  await page.getByRole('button',{name:'Continue →',exact:true}).click();
  const bending=page.getByLabel('Bending design capacity |φMb|',{exact:true});
  const shear=page.getByLabel('Shear design capacity |φVv|',{exact:true});
  await bending.fill('40');await bending.press('Tab');await expect(shear).toBeFocused();
  await shear.fill('20');
  await page.getByLabel('Serviceability criterion',{exact:true}).selectOption('direct');
  await page.getByLabel('Displacement limit',{exact:true}).fill('10');
  await page.getByLabel('Yield stress fy',{exact:true}).fill('300');
  await expect(page.locator('#design-elastic-reference')).toContainText('525.00');
  await page.getByPlaceholder('Capacity source, calculation reference, clause, software run...').fill('QA demonstration values only');
  await page.getByRole('button',{name:'Continue →',exact:true}).click();
  await expect(page.locator('.design-ratio').nth(0)).toContainText('0.750');
  await expect(page.locator('.design-ratio').nth(1)).toContainText('0.500');
  await expect(page.locator('.design-step-card.design-step-3')).toContainText('QA demonstration values only');
  await noOverflow(page);await page.reload();
  await flow(page,'review');await act(page,'design-open').click();
  await act(page,'design-step:3').click();
  await expect(page.locator('.design-ratio').nth(0)).toContainText('0.750');
  expect(await modelCopy(page)).toBe(original);
  await act(page,'design-step:2').click();
  await bending.fill('-1');await expect(bending).toHaveAttribute('aria-invalid','true');
  await page.getByLabel('Serviceability criterion',{exact:true}).selectOption('ratio');
  await page.getByLabel('Limit denominator n',{exact:true}).fill('');
  await page.getByRole('button',{name:'Continue →',exact:true}).click();
  await expect(page.locator('.design-ratio').nth(0)).toContainText('Not assessed');
  await expect(page.locator('.design-ratio').nth(2)).toContainText('Not assessed');
});
