import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import fixtures from '../support/diagram-fixtures.cjs';

const act=(page,name)=>page.locator(`[data-action="${name}"]`);
async function openFixture(page,key) {
  await page.goto('/#workspace');
  await expect(page.locator('#graphs svg').first()).toBeVisible();
  await page.locator('#model-file').setInputFiles({name:`${key}.json`,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixtures.fixture(key)))});
  await expect(page.locator('#error')).toBeHidden();
  const toggle=page.locator('#mobile-tools button');
  if(await toggle.isVisible()&&await toggle.getAttribute('aria-expanded')==='true')await toggle.click();
}
async function inspect(page,x) {
  await page.getByLabel('Inspection position in metres',{exact:true}).fill(String(x));
  await page.getByLabel('Inspection position in metres',{exact:true}).press('Tab');
}
async function checkLabels(page) {
  const faults=await page.locator('#graphs .diagram-block>svg').evaluateAll(svgs=>{
    const problems=[];
    for(const svg of svgs) {
      const bounds=svg.viewBox.baseVal;
      const labels=Array.from(svg.querySelectorAll('[data-annotation]')).map(g=>({g,b:g.querySelector('rect').getBBox()}));
      for(let n=0;n<labels.length;n++) {
        const {g,b}=labels[n];
        if(b.x < -1 || b.y < -1 || b.x+b.width>bounds.width+1 || b.y+b.height>bounds.height+1)problems.push(`outside: ${g.textContent}`);
        for(const t of g.querySelectorAll('text')) {
          const r=t.getBBox();
          if(r.x<b.x-1||r.y<b.y-1||r.x+r.width>b.x+b.width+1||r.y+r.height>b.y+b.height+1)problems.push(`text escaped box: ${t.textContent}`);
        }
        for(const {g:other,b:c} of labels.slice(n+1))if(b.x<c.x+c.width&&b.x+b.width>c.x&&b.y<c.y+c.height&&b.y+b.height>c.y)problems.push(`overlap: ${g.textContent} / ${other.textContent}`);
      }
    }
    return problems;
  });
  expect(faults).toEqual([]);
  const sizes=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  expect(sizes.width).toBeLessThanOrEqual(sizes.viewport+1);
}
test.beforeEach(async({page})=>{page.__diagramErrors=[];page.on('pageerror',e=>page.__diagramErrors.push(e.message));});
test.afterEach(async({page})=>expect(page.__diagramErrors).toEqual([]));

test('endpoint inspection never covers fixed moment labels and reports independent reference values',async({page},testInfo)=>{
  await openFixture(page,'fixed');
  await inspect(page,0);
  const block=page.locator('.diagram-block[data-kind="M"]');
  // wL²/12 = 41.6667 kN·m hogging at either fixed end.
  await expect(block.locator('.trace-label')).toContainText('M -41.667 kN·m');
  await expect(block.locator('[data-annotation="critical"]')).toHaveCount(3);
  const geometry=await block.evaluate(el=>({plot:el.querySelector('svg').getBoundingClientRect().bottom,readout:el.querySelector('.trace-label').getBoundingClientRect().top}));
  expect(geometry.readout).toBeGreaterThanOrEqual(geometry.plot);
  await checkLabels(page);
  await block.screenshot({path:testInfo.outputPath('endpoint-moment.png')});
  await inspect(page,5);await expect(block.locator('.trace-label')).toContainText('M +20.833 kN·m');
  await page.getByLabel('Diagram zoom',{exact:true}).selectOption('2');
  await inspect(page,10);await expect(block.locator('.trace-label')).toContainText('outside zoomed view');
  await expect(block.locator('.trace-marker')).toBeHidden();
  await checkLabels(page);
});

test('crowded supports, prescribed movements and endpoint loads remain legible and editable',async({page},testInfo)=>{
  await openFixture(page,'crowded');
  await checkLabels(page);
  const structure=page.locator('#structure-block');
  await expect(structure).toContainText('θ +0.20 mrad');await expect(structure).toContainText('Δ -0.30 mm');
  await expect(structure.locator('[data-annotation="structure"]')).toHaveCount(4);
  await structure.screenshot({path:testInfo.outputPath('crowded-structure.png')});
  const label=page.locator('#graphs [data-object="fixture-5"] [data-inline="value"]');
  await label.dblclick();
  const input=page.locator('#inline-edit').getByLabel('Nominal magnitude',{exact:true});
  await expect(input).toBeVisible();
  await expect(page.locator('#inspector')).toBeHidden();
  await input.fill('27');await input.press('Enter');
  await expect(label).toContainText('+27.0 kN');
  await act(page,'undo').click();await expect(label).toContainText('+23.0 kN');
  // Undo must also work before Enter, close the obsolete editor, and retain Redo.
  await label.dblclick();await input.fill('29');
  await act(page,'undo').click();await expect(label).toContainText('+23.0 kN');
  await expect(input).toHaveCount(0);
  await act(page,'redo').click();await expect(label).toContainText('+29.0 kN');
  await act(page,'undo').click();await expect(label).toContainText('+23.0 kN');
  await checkLabels(page);
});

test('detailed hinge and response labels remain separate across views and SVG export',async({page},testInfo)=>{
  await openFixture(page,'suspended');
  await act(page,'annotation-cycle').click();
  await expect(act(page,'annotation-cycle')).toContainText('Detailed');
  await inspect(page,6);
  await checkLabels(page);
  await expect(page.locator('.diagram-block[data-kind="M"] [data-annotation="critical"]').filter({hasText:'M=0'})).toHaveCount(2);
  await page.locator('.diagram-block[data-kind="M"]').screenshot({path:testInfo.outputPath('detailed-hinges.png')});
  await act(page,'export-menu').click();
  const downloadPromise=page.waitForEvent('download');
  await act(page,'export:svg').click();
  const download=await downloadPromise;
  const svg=await fs.readFile(await download.path(),'utf8');
  expect(svg).toContain('data-annotation="critical"');expect(svg).toContain('data-annotation="structure"');
  expect(svg).not.toContain('diagram-inspection');expect(svg).not.toContain('NaN');
  await act(page,'annotation-cycle').click();
  await expect(page.locator('#graphs [data-annotation="critical"]')).toHaveCount(0);
  await inspect(page,9);await expect(page.locator('.diagram-block[data-kind="M"] .trace-label')).toContainText('x = 9.00 m');
  await checkLabels(page);
});
