import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {chromium} from '@playwright/test';

const base='https://beam-lab-studio.vercel.app';
const expected=fs.readFileSync('dist/SHA256.txt','utf8').trim();
const version=JSON.parse(fs.readFileSync('dist/release.json','utf8')).version;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ready=false;
for(let attempt=1;attempt<=18;attempt++){
  try{
    const suffix='?verify='+Date.now();
    const responses=await Promise.all(['/', '/SHA256.txt', '/release.json'].map(async p=>{
      const r=await fetch(base+p+suffix,{headers:{'Cache-Control':'no-cache'},cache:'no-store'});
      if(!r.ok)throw Error(p+' HTTP '+r.status);
      return Buffer.from(await r.arrayBuffer());
    }));
    const actual=crypto.createHash('sha256').update(responses[0]).digest('hex');
    const servedHash=responses[1].toString('utf8').trim();
    const metadata=JSON.parse(responses[2].toString('utf8'));
    console.log('Public attempt '+attempt+': version='+metadata.version+', HTML SHA-256='+actual+', claimed='+servedHash);
    if(actual===expected&&servedHash===expected&&metadata.sha256===expected&&metadata.version===version){ready=true;break;}
  }catch(error){console.log('Public attempt '+attempt+': '+error.message);}
  if(attempt<18)await pause(5000);
}
if(!ready)throw Error('Production did not serve the tested '+version+' artifact and matching metadata.');
console.log('VERIFIED public '+version+' HTML byte-for-byte, SHA-256 '+expected);

fs.mkdirSync('test-results/public-release',{recursive:true});
const browser=await chromium.launch();
try{
  for(const layout of [
    {name:'desktop',viewport:{width:1440,height:1000},mobile:false},
    {name:'phone',viewport:{width:390,height:844},mobile:true}
  ]){
    const context=await browser.newContext({viewport:layout.viewport,isMobile:layout.mobile,deviceScaleFactor:layout.mobile?2:1});
    const page=await context.newPage();
    try{
      await page.goto(base+'/#workspace',{waitUntil:'domcontentloaded'});
      await page.locator('.workflow-nav [data-action="workflow:build"]').click();
      await page.locator('#metrics').getByText('30.00 kN·m').waitFor({timeout:15000});
      await page.locator('.workflow-nav [data-action="workflow:learn"]').click();
      await page.locator('.lesson-list button').first().click();
      await page.locator('.activity-navigation').waitFor();
      await page.screenshot({path:path.join('test-results/public-release',layout.name+'-lesson.png')});
      await page.locator('.activity-navigation [data-action="workflow:build"]').click();
      await page.locator('#metrics').getByText('30.00 kN·m').waitFor();
      const fit=await page.evaluate(()=>({title:document.querySelector('.workspace-heading').getBoundingClientRect().top,header:document.querySelector('.topbar').getBoundingClientRect().bottom,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
      if(fit.title<fit.header+8||fit.overflow>1)throw Error(layout.name+' returned heading overlap or overflow: '+JSON.stringify(fit));
      await page.screenshot({path:path.join('test-results/public-release',layout.name+'-build.png')});
      console.log('VERIFIED '+layout.name+' Build → lesson → original model, heading and width.');
    }finally{await context.close();}
  }
}finally{await browser.close();}
