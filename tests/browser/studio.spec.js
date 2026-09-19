import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

const act=(page,name)=>page.locator(`[data-action="${name}"]`);
async function open(page,level='year1') {
  await page.goto('/#workspace');
  await expect(page.locator('#graphs svg').first()).toBeVisible();
  const setup=act(page,`level-setup:${level}`);
  if(await setup.isVisible()) await setup.click();
  else await act(page,`level:${level}`).click();
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

test('first-year reference, four destinations and aligned diagrams',async({page},testInfo)=>{
  await open(page);
  await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('6');
  await expect(page.locator('#metrics')).toContainText('30');
  for(const phase of ['build','analyse','learn','review']) {
    await flow(page,phase);
    await expect(page.locator('.workflow-nav [aria-current="step"]')).toContainText(phase==='analyse'?'Analyse':phase[0].toUpperCase()+phase.slice(1));
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

test('section fibre explorer responds to position, cut side and fibre selection',async({page})=>{
  await open(page,'all');
  await page.getByLabel('Example library',{exact:true}).selectOption('simple');
  await act(page,'tab:section').click();
  await page.getByLabel('Section geometry',{exact:true}).selectOption('rectangle');
  await flow(page,'analyse');
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
  await expect(page.locator('.workflow-nav [aria-current="step"]')).toContainText('Learn');
  await act(page,'session-exit').click();await act(page,'session-exit-confirm').click();
  expect(await modelCopy(page)).toBe(original);
});

test('review exports carry the current model and numerical evidence',async({page})=>{
  await open(page);await flow(page,'review');
  const pending=page.waitForEvent('download');await act(page,'export-audit').click();
  const download=await pending,audit=JSON.parse(await fs.readFile(await download.path(),'utf8'));
  expect(audit.release).toBe('4.1.0');expect(audit.pass).toBe(true);expect(audit.checks).toHaveLength(6);expect(audit.model.length).toBe(6);
  await act(page,'privacy').click();await expect(page.getByRole('dialog')).toContainText('encoded, readable snapshot');
  await page.getByRole('button',{name:'Close dialog',exact:true}).click();
  await act(page,'issue-report').click();await expect(page.getByLabel('Issue report JSON')).toHaveValue(/4\.1\.0/);
});

test('optional tutor health is honest and deterministic teaching stays available',async({page,request})=>{
  const health=await request.get('/api/tutor');expect(await health.json()).toEqual({message:'Success',release:'4.1.0',configured:false});
  await open(page);await act(page,'ai-open').click();
  await expect(page.getByRole('dialog')).toContainText('Online tutor is not connected');
  await expect(act(page,'ai-send')).toBeDisabled();
  await act(page,'explain-here').click();
  await expect(page.getByRole('dialog')).toContainText('Why does the beam behave like this here?');
  await expect(page.getByRole('dialog')).toContainText('generated deterministically');
});
