import {test,expect} from '@playwright/test';

const act=(p,a)=>p.locator(`[data-action="${a}"]`);
const flow=(p,a)=>p.locator(`.workflow-nav [data-action="workflow:${a}"]`).click();
async function tools(p){const t=p.locator('#mobile-tools button');if(await t.isVisible()&&await t.getAttribute('aria-expanded')==='false')await t.click();}
async function boxes(locator){return locator.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));}
function separate(rs){for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const a=rs[i],b=rs[j];expect(a.x+a.w<=b.x+1||b.x+b.w<=a.x+1||a.y+a.h<=b.y+1||b.y+b.h<=a.y+1,'controls must not overlap').toBe(true);}}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);}
test.beforeEach(async({page})=>{page.__errors=[];page.on('pageerror',e=>page.__errors.push(e.message));});
test.afterEach(async({page})=>{expect(page.__errors).toEqual([]);});

test('homepage actions share a rhythm and pointer navigation lands below the header',async({page},info)=>{
  // Exercise ordinary motion preferences too: navigation must not keep moving
  // under the next press simply because most other tests reduce animation.
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  const actions=await boxes(page.locator('.hero-actions>a,.hero-actions>button'));
  expect(actions).toHaveLength(3);separate(actions);
  expect(Math.max(...actions.map(r=>r.h))-Math.min(...actions.map(r=>r.h))).toBeLessThanOrEqual(1);
  for(const r of actions)expect(r.h).toBeGreaterThanOrEqual(48);
  const header=await boxes(page.locator('.header-actions>.share-button,.header-actions>.launch,.header-actions .export-button'));
  expect(Math.max(...header.map(r=>r.h))-Math.min(...header.map(r=>r.h))).toBeLessThanOrEqual(1);separate(header);
  await noOverflow(page);
  await page.screenshot({path:info.outputPath('polished-home.png'),fullPage:false});
  await page.locator('.hero-cta').click();
  await expect(page.locator('.workflow-nav [aria-current]')).toContainText('Build / Explore');
  const position=await page.evaluate(()=>({nav:document.querySelector('.workflow-nav').getBoundingClientRect().top,header:document.querySelector('.topbar').getBoundingClientRect().bottom}));
  expect(position.nav).toBeGreaterThanOrEqual(position.header+8);
  expect(position.nav).toBeLessThan(position.header+100);
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.screenshot({path:info.outputPath('polished-build.png'),fullPage:false});
});

test('fields contain their inputs and editor actions remain reachable',async({page},info)=>{
  await page.goto('/#workspace');await tools(page);
  const length=page.getByLabel('Beam length',{exact:true});
  const fit=await length.evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return {input:r.height,parent:p.height,font:parseFloat(getComputedStyle(e).fontSize)};});
  expect(fit.parent).toBeGreaterThanOrEqual(44);expect(fit.input).toBeLessThanOrEqual(fit.parent-1);
  if(page.viewportSize().width<=780)expect(fit.font).toBeGreaterThanOrEqual(16);
  await length.fill('8');await length.press('Tab');await expect(page.locator('#history-count')).toHaveText('1 edits');
  await page.locator('.object-list [data-select-object]').last().click();
  const force=page.getByLabel('Force',{exact:true});await force.fill('24');await force.press('Tab');
  await expect(page.locator('#metrics')).toContainText('48.00 kN·m');
  await act(page,'undo').scrollIntoViewIfNeeded();
  expect(await act(page,'undo').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
  await act(page,'undo').click();await expect(force).toHaveValue('20');
  const toolbar=await boxes(page.locator('#toolbar button'));separate(toolbar);
  const actions=await boxes(page.locator('#inspector .action-grid button'));separate(actions);
  for(const r of actions)expect(r.h).toBeGreaterThanOrEqual(44);
  await noOverflow(page);await page.screenshot({path:info.outputPath('polished-editor.png'),fullPage:false});
  await act(page,'share').first().click();await expect(page.getByRole('dialog')).toBeVisible();
  const close=await page.getByRole('button',{name:'Close dialog',exact:true}).boundingBox();
  expect(close.width).toBeGreaterThanOrEqual(44);expect(close.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button',{name:'Close dialog',exact:true}).click();
});

test('learning tabs, lesson navigation and review actions wrap coherently',async({page},info)=>{
  await page.goto('/#workspace');await flow(page,'learn');
  const tabs=await boxes(page.locator('.learn-subtabs button'));expect(tabs).toHaveLength(3);separate(tabs);
  expect(Math.max(...tabs.map(r=>r.y))-Math.min(...tabs.map(r=>r.y))).toBeLessThanOrEqual(1);
  expect(Math.max(...tabs.map(r=>r.h))-Math.min(...tabs.map(r=>r.h))).toBeLessThanOrEqual(1);
  await page.locator('.lesson-list button').first().click();
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.getByRole('button',{name:'Previous',exact:true}).click();
  const nav=await boxes(page.locator('.activity-navigation button'));separate(nav);for(const r of nav)expect(r.h).toBeGreaterThanOrEqual(44);
  await noOverflow(page);
  await page.locator('.activity-navigation').scrollIntoViewIfNeeded();
  await page.screenshot({path:info.outputPath('polished-lesson.png'),fullPage:false});
  await page.getByRole('button',{name:'← All lessons',exact:true}).click();
  await expect(page.locator('.lesson-list')).toBeVisible();
  await flow(page,'review');await expect(page.locator('.review-hub')).toBeVisible();
  const cards=await boxes(page.locator('.review-export-grid button'));separate(cards);
  expect(Math.max(...cards.map(r=>r.h))-Math.min(...cards.map(r=>r.h))).toBeLessThanOrEqual(1);
  await noOverflow(page);await page.locator('.review-export-grid').scrollIntoViewIfNeeded();
  await page.screenshot({path:info.outputPath('polished-review.png'),fullPage:false});
});
