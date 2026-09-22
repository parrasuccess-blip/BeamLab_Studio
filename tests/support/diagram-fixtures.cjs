'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../dist/index.html'),'utf8');
const start=html.indexOf('const modules = {'),end=html.indexOf("load('studio/app');",start);
const ctx=vm.createContext({TextEncoder,TextDecoder,setTimeout,clearTimeout,console,AbortController,btoa,atob});
new vm.Script(html.slice(start,end)+';globalThis.productionLoad=load;').runInContext(ctx);
const load=ctx.productionLoad;
const {example,makeItem}=load('model/examples');
const {normalise}=load('model/study');
function fixture(key) {
    const m=normalise(example(key==='crowded'?'fixed':key));
    if(key==='crowded') {
        m.items[0].settlementMm=-.3;m.items[0].rotationMrad=.2;
        m.items.push(makeItem('roller',4.9),makeItem('roller',5.1),makeItem('point',.05,undefined,23),makeItem('point',.15,undefined,-17),makeItem('moment',9.95,undefined,30));
        m.items.forEach((i,n)=>{i.label=['West fixed support','East fixed support','Full-span load','Near centre B','Near centre C','Left point load','Neighbour point load','End couple'][n];});
    }
    m.items.forEach((i,n)=>{i.id=`fixture-${n}`;});
    return normalise(m);
}
module.exports={load,fixture};
