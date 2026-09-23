import {test,expect} from '@playwright/test';
const act=(p,a)=>p.locator(`[data-action="${a}"]`);
const flow=(p,a)=>p.locator(`.workflow-nav [data-action="workflow:${a}"]`).click();
async function tools(p){const t=p.locator('#mobile-tools button');if(await t.isVisible()&&await t.getAttribute('aria-expanded')==='false')await t.click();}
async function snapshot(p){await act(p,'share').first().click();const s=await p.locator('#share-code').inputValue();await act(p,'dialog-close').click();return s;}
async function start(p){await p.goto('/#workspace');await tools(p);await p.getByLabel('Beam length',{exact:true}).fill('8');await p.getByLabel('Beam length',{exact:true}).press('Tab');await expect(p.locator('#history-count')).toHaveText('1 edits');}
test.beforeEach(async({page})=>{page.__errors=[];page.on('pageerror',e=>page.__errors.push(e.message));});
test.afterEach(async({page})=>{expect(page.__errors).toEqual([]);});

test('legacy hidden-result preference and first-year learning never restrict engineering',async({page},info)=>{
  await start(page);const original=await snapshot(page);
  await page.evaluate(()=>{localStorage.setItem('beamlab:studio:3.2:view',JSON.stringify({practice:true,teaching:true}));localStorage.setItem('beamlab:studio:3.2:learning',JSON.stringify({level:'year1',teachMe:true}));});
  await page.reload();await tools(page);
  await expect(page.locator('#metrics')).toContainText('40.00 kN·m');
  await expect(page.locator('.practice-cover')).toHaveCount(0);
  await expect(act(page,'tab:section')).toBeVisible();await expect(act(page,'tab:cases')).toBeVisible();
  await act(page,'advanced').click();await expect(page.getByRole('button',{name:'Add applied couple',exact:true})).toBeVisible();
  await flow(page,'analyse');await tools(page);
  for(const layer of ['deformation','stress','shear','moving'])await act(page,'toggle:'+layer).click();
  await flow(page,'learn');await expect(act(page,'level:year1')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('switch',{name:'Practice mode',exact:true}).click();
  await expect(page.locator('#metrics')).toContainText('Predict first');
  await expect(page.locator('#teaching')).toHaveText('');
  await flow(page,'analyse');await expect(page.locator('#metrics')).toContainText('40.00 kN·m');
  for(const panel of ['section-stress','shear-stress','moving-lab'])await expect(page.locator('#'+panel)).toBeVisible();
  await expect(page.locator('#graphs')).toContainText('Deformed shape');
  await expect(act(page,'working')).toBeEnabled();
  await flow(page,'build');expect(await snapshot(page)).toBe(original);
  await flow(page,'learn');await expect(act(page,'level:year1')).toHaveAttribute('aria-pressed','true');
  await page.locator('.lesson-list button').first().click();
  await page.locator('.launch').click();expect(await snapshot(page)).toBe(original);
  await expect(page.locator('#metrics')).toContainText('40.00 kN·m');
  await flow(page,'learn');await expect(act(page,'level:year1')).toHaveAttribute('aria-pressed','true');
  await flow(page,'build');await page.screenshot({path:info.outputPath('unrestricted-build.png'),fullPage:true});
  await page.reload();expect(await snapshot(page)).toBe(original);
  await expect(page.locator('#metrics')).toContainText('40.00 kN·m');
});

test('prediction masks all answer surfaces until an explicit reveal',async({page})=>{
  await start(page);await act(page,'compare').click();await act(page,'working').click();
  await flow(page,'learn');await page.getByRole('switch',{name:'Show why overlays',exact:true}).click();
  await page.getByRole('switch',{name:'Practice mode',exact:true}).click();
  await expect(act(page,'working')).toBeDisabled();await expect(page.locator('#working')).toHaveText('');
  await expect(page.locator('#teaching')).toHaveText('');await expect(page.locator('#compare-note')).toHaveText('');
  await expect(page.locator('#toolbar [data-action="ai-open"]')).toBeDisabled();
  await act(page,'explain-here').click();await expect(page.getByRole('dialog')).toContainText('free-body diagram');
  await expect(page.getByRole('dialog')).not.toContainText('V =');await act(page,'dialog-close').click();
  await act(page,'export-menu').click();await act(page,'export:csv').click();
  await expect(page.locator('#toast')).toContainText('hidden results');
  await act(page,'export-menu').click();
  for(let i=0;i<4;i++) {
    await act(page,'practice-next').click();
    await page.getByLabel('Inspection position in metres',{exact:true}).fill('2');
    await page.getByLabel('Inspection position in metres',{exact:true}).press('Enter');
    if(i<3)await expect(page.locator('#trace-readout em')).toHaveCount(0);
  }
  await expect(page.locator('#metrics')).toContainText('40.00 kN·m');
  await expect(act(page,'working')).toBeEnabled();
  await expect(page.locator('#teaching')).toContainText('SHOW WHY');
  const download=page.waitForEvent('download');await act(page,'export-menu').click();await act(page,'export:csv').click();
  expect((await download).suggestedFilename()).toBe('beamlab-results.csv');
});

test('exam preserves its question under history, pointer, imports and navigation, then restores the original study',async({page},info)=>{
  await start(page);const original=await snapshot(page),saved=await page.evaluate(()=>localStorage.getItem('beamlab:studio:3.2'));
  await page.getByLabel('Beam length',{exact:true}).fill('9');await page.getByLabel('Beam length',{exact:true}).press('Tab');
  await act(page,'undo').click();await expect(act(page,'redo')).toBeEnabled();
  await act(page,'compare').click();await act(page,'working').click();
  await flow(page,'learn');await act(page,'learn-section:session').click();await act(page,'session-start:exam').click();
  const given=await snapshot(page);
  await expect(act(page,'undo')).toBeDisabled();await expect(act(page,'redo')).toBeDisabled();
  await expect(page.getByLabel('Study name',{exact:true})).toHaveAttribute('readonly','');
  await expect(act(page,'working')).toBeDisabled();await expect(page.locator('#working')).toHaveText('');
  await page.locator('#workspace').focus();await page.keyboard.press('Control+z');
  await page.keyboard.press('Control+Shift+z');expect(await snapshot(page)).toBe(given);
  const object=page.locator('#graphs [data-object]').first();await object.click();await page.keyboard.press('Delete');
  expect(await snapshot(page)).toBe(given);await expect(page.locator('#inspector')).toBeHidden();
  await page.locator('#model-file').setInputFiles({name:'beam.json',mimeType:'application/json',buffer:Buffer.from(saved)});
  await expect(page.locator('#toast')).toContainText('before opening another study');expect(await snapshot(page)).toBe(given);
  await act(page,'export-menu').click();await act(page,'export:pdf').click();await expect(page.locator('#toast')).toContainText('until you submit the exam');
  await act(page,'export-menu').click();
  await page.screenshot({path:info.outputPath('exam-protection.png'),fullPage:true});
  await flow(page,'build');await expect(page.getByRole('dialog')).toContainText('Exit this learning session?');
  await page.getByRole('button',{name:'Stay in Learn',exact:true}).click();expect(await snapshot(page)).toBe(given);
  await flow(page,'build');await act(page,'session-exit-confirm').click();expect(await snapshot(page)).toBe(original);
  await expect(page.locator('#metrics')).toContainText('40.00 kN·m');await expect(act(page,'redo')).toBeEnabled();
  await expect(page.getByRole('button',{name:'Clear comparison',exact:true}).first()).toBeVisible();
  await act(page,'redo').click();await tools(page);await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('9');
});

test('selected-object editor leaves Undo physically reachable and only one editor open',async({page},info)=>{
  await start(page);
  await page.locator('#controls').getByRole('button',{name:'Select P1',exact:true}).click();
  await expect(page.locator('#controls')).toBeHidden();await expect(page.locator('#inspector')).toBeVisible();
  await page.getByLabel('Force',{exact:true}).fill('27');await page.getByLabel('Force',{exact:true}).press('Enter');
  await expect(page.locator('#inspector')).toHaveCSS('position', /static|sticky/);
  await act(page,'undo').scrollIntoViewIfNeeded();
  const hit=await act(page,'undo').evaluate(button=>{const b=button.getBoundingClientRect(),top=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {receivesClick:button.contains(top),button:{x:b.x,y:b.y,width:b.width,height:b.height},cover:top?.outerHTML.slice(0,300),viewport:{width:innerWidth,height:innerHeight}};});
  await page.screenshot({path:info.outputPath('reserved-object-editor.png'),fullPage:true});
  await page.screenshot({path:info.outputPath('editor-viewport.png')});
  expect(hit.receivesClick,JSON.stringify(hit)).toBe(true);
  await act(page,'undo').click();await expect(page.getByLabel('Force',{exact:true})).toHaveValue('20');
  await act(page,'redo').click();await expect(page.getByLabel('Force',{exact:true})).toHaveValue('27');
  await page.locator('#inspector [data-action="deselect"]').click();
  await tools(page);await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('8');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
});

test('invalid lesson edit preserves its question; a committed edit announces exploration and can restart',async({page},info)=>{
  await start(page);const original=await snapshot(page);
  await flow(page,'learn');await act(page,'level:year1').click();await act(page,'lesson-start:l1-point-shear').click();
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await expect(page.locator('.activity-changed')).toHaveCount(0);
  await page.getByRole('button',{name:'Previous',exact:true}).click();
  await expect(page.locator('.activity-changed')).toHaveCount(0);
  await page.evaluate(()=>{window.__labelEvents=[];for(const type of ['pointerdown','pointerup','dblclick'])document.addEventListener(type,e=>{const t=e.target.closest('[data-object]'),label=document.querySelector('#graphs [data-inline="value"]'),box=label?.getBoundingClientRect();window.__labelEvents.push({type,target:e.target.tagName,object:t?.dataset.object,inline:e.target.closest('[data-inline]')?.dataset.inline,x:e.clientX,y:e.clientY,scrollY,label:box?{x:box.x,y:box.y}:null,editor:!!document.querySelector('#inline-edit input')});},true);});
  const label=page.locator('#graphs [data-inline="value"]').first();
  // Retain the real double click: the first press must not reflow its second target.
  await label.scrollIntoViewIfNeeded();
  await label.dblclick();
  await expect(page.locator('#inspector')).toBeHidden();
  const events=await page.evaluate(()=>window.__labelEvents);
  console.log('Lesson label pointer evidence',info.project.name,JSON.stringify(events));
  // Compare the two real presses, excluding pre-click hover and editor focus.
  const presses=events.filter(e=>e.type==='pointerdown');
  expect(presses).toHaveLength(2);
  expect(presses[0].object).toBeTruthy();
  expect(presses[1].object).toBe(presses[0].object);
  expect(presses.map(e=>e.inline)).toEqual(['value','value']);
  expect(Math.abs(presses[1].label.x-presses[0].label.x)).toBeLessThan(1);
  expect(Math.abs(presses[1].label.y-presses[0].label.y)).toBeLessThan(1);
  const input=page.locator('#inline-edit').getByLabel('Nominal magnitude',{exact:true});
  await input.fill('27');await input.fill('999999999999');await input.press('Enter');
  await expect(page.locator('.activity-navigation')).toBeVisible();
  await expect(page.locator('.activity-changed')).toHaveCount(0);
  await expect(label).toContainText('20.0 kN');
  await label.dblclick();await input.fill('27');await input.press('Enter');
  await expect(label).toContainText('27.0 kN');
  await page.locator('#workspace').press('Escape');
  await expect(page.locator('.activity-changed')).toContainText('This learning example was edited');
  await expect(page.locator('.practice-cover')).toHaveCount(0);
  await act(page,'activity-restart').click();
  await expect(page.locator('.activity-navigation')).toBeVisible();await expect(label).toContainText('20.0 kN');
  await expect(page.locator('.activity-changed')).toHaveCount(0);
  await flow(page,'build');expect(await snapshot(page)).toBe(original);
  await act(page,'undo').click();await tools(page);await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('6');
  await flow(page,'learn');await act(page,'lesson-start:l1-point-shear').click();
  await act(page,'level:year2').click();
  await expect(page.locator('.workflow-nav [data-action="workflow:learn"]')).toHaveAttribute('aria-current','page');
  await expect(page.locator('.activity-changed')).toHaveCount(0);
  await flow(page,'build');await tools(page);await expect(page.getByLabel('Beam length',{exact:true})).toHaveValue('6');
});

test('revealing extra response layers after a correct study question does not change learning evidence',async({page})=>{
  await start(page);await flow(page,'learn');await act(page,'level:year1').click();
  await act(page,'learn-section:session').click();await page.getByRole('button',{name:'Start guided study block',exact:true}).click();
  await act(page,'lesson-choice:step-down').click();await act(page,'lesson-check').click();
  await expect(page.locator('.challenge-feedback.pass')).toContainText('Correct');
  const before=await page.evaluate(()=>({mastery:localStorage.getItem('beamlab:studio:3.2:mastery'),events:localStorage.getItem('beamlab:studio:3.2:learning-evidence')}));
  await act(page,'activity-reveal-all').click();
  await expect(act(page,'working')).toBeEnabled();
  expect(await page.evaluate(()=>({mastery:localStorage.getItem('beamlab:studio:3.2:mastery'),events:localStorage.getItem('beamlab:studio:3.2:learning-evidence')}))).toEqual(before);
  await act(page,'session-next').click();await expect(act(page,'session-exit')).toBeEnabled();
  await expect(page.locator('.challenge-feedback.pass')).toHaveCount(0);
});
