'use strict';
const {influenceLine,envelope,envelopeCsv,prepareMoving,validateConfig}=require('../engine/moving');
const {solveStudy,clone}=require('../model/study');
const {isSupport}=require('../model/validation');
const {fingerprint,RELEASE}=require('./verification');
const {esc,fmt,signed}=require('./common');
const {download,raster}=require('./export');
const button=(action,text,cls='secondary',disabled=false)=>`<button type="button" data-lab="${action}" class="${cls}" ${disabled?'disabled':''}>${text}</button>`;
const field=(key,label,value,min,max,unit='')=>`<label class="field"><span>${esc(label)}</span><div><input type="number" data-lab-field="${key}" aria-label="${esc(label)}" value="${Number.isFinite(value)?value:''}" min="${min}" max="${max}" step="any"><small>${unit}</small></div></label>`;
const select=(key,label,value,options)=>`<label class="field"><span>${label}</span><select data-lab-field="${key}" aria-label="${label}">${options.map(([v,t])=>`<option value="${esc(v)}" ${String(value)===String(v)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
class MovingLab {
    constructor(root,close) {
        this.root=root;this.close=close;this.mode='influence';this.config={target:'M',station:3,supportId:'',steps:120,includeBase:false,axles:[{offset:0,force:20}]};
        this.result=null;this.message='';this.running=false;this.controller=null;this.key='';this.lead=0;this.response='M';this.row=0;this.exporting=false;
        root.addEventListener('click',e=>{const b=e.target.closest('[data-lab]');if(b){e.stopPropagation();void this.action(b.dataset.lab);}});
        root.addEventListener('change',e=>{if(e.target.dataset.labField)this.change(e.target);});
        root.addEventListener('input',e=>{if(e.target.dataset.labRange==='lead'){this.lead=Number(e.target.value);this.updatePreview();}});
        root.addEventListener('click',e=>{const svg=e.target.closest('svg[data-lab-chart]');if(!svg||!this.result)return;const r=svg.getBoundingClientRect();const ratio=Math.max(0,Math.min(1,((e.clientX-r.left)/r.width*this.scale.W-this.scale.left)/(this.scale.right-this.scale.left)));
            if(this.result.kind==='envelope'){const x=ratio*this.model.length;this.row=this.result.rows.reduce((best,rr,i)=>Math.abs(rr.x-x)<Math.abs(this.result.rows[best].x-x)?i:best,0);this.renderResults();}
            else{this.lead=ratio*this.model.length;this.updatePreview();}
        });
        this.resizeObserver=new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width>0&&Math.abs(width-(this.lastWidth||0))>1){this.lastWidth=width;if(this.result&&!this.running&&!root.hidden)this.renderResults();}});
        this.resizeObserver.observe(root);
    }
    update(model,visible){
        const visibilityChanged=this.visible!==visible;
        this.visible=visible;this.root.hidden=!visible;
        if(!visible&&this.running){this.cancel();this.message='Calculation cancelled. Reopen and calculate to get a complete result.';}
        const key=JSON.stringify(model);
        if(key!==this.key){
            const previous=!!this.key;this.cancel();this.model=clone(model);this.key=key;this.result=null;this.prepared=null;this.base=null;this.error='';
            this.config.station=Math.min(this.config.station,model.length);
            const supports=model.items.filter(i=>isSupport(i.kind));
            if(!supports.some(i=>i.id===this.config.supportId))this.config.supportId=supports[0]?.id||'';
            this.message=previous?'Model changed. Recalculate before using a moving-load result.':'';
            this.render();
        }else if(visible&&(visibilityChanged||!this.root.firstChild))this.render();
    }
    cancel(){if(this.controller)this.controller.abort();this.controller=null;this.running=false;}
    snapshot(){return {mode:this.mode,config:clone(this.config),result:this.result,key:this.key,lead:this.lead,response:this.response,row:this.row,message:this.message};}
    restore(s){this.cancel();Object.assign(this,s);this.prepared=null;this.base=null;this.render();}
    demo(){this.cancel();this.mode='envelope';this.config={...this.config,steps:120,station:this.model.length/2,includeBase:false,axles:[{offset:0,force:20},{offset:2,force:20}]};this.result=null;this.render();void this.run();}
    change(el){
        const k=el.dataset.labField;
        this.cancel();this.result=null;this.prepared=null;this.base=null;this.error='';this.message='Inputs changed. Run the calculation to update the result.';
        if(k==='target'||k==='supportId')this.config[k]=el.value;
        else if(k==='includeBase')this.config.includeBase=el.checked;
        else if(k==='preset'){
            this.config.axles=el.value==='tandem'?[{offset:0,force:20},{offset:2,force:20}]:el.value==='triple'?[{offset:0,force:40},{offset:3,force:60},{offset:6,force:60}]:[{offset:0,force:20}];
        }else if(k.startsWith('axle:')){const [,idx,prop]=k.split(':');this.config.axles[Number(idx)][prop]=el.valueAsNumber;}
        else this.config[k]=el.tagName==='INPUT'?el.valueAsNumber:Number(el.value);
        this.render();
    }
    async action(key){
        if(key==='close'){this.cancel();this.close();return;}
        if(key==='cancel'){this.cancel();this.result=null;this.message='Calculation cancelled. No new result was retained.';this.render();return;}
        if(key==='influence'||key==='envelope'){this.cancel();this.mode=key;this.result=null;this.error='';this.message='';this.render();return;}
        if(key==='run'){await this.run();return;}
        if(key==='refine'){if(this.config.steps<480){this.config.steps*=2;await this.run(true);}return;}
        if(key==='add-axle'){if(this.config.axles.length<4){this.config.axles.push({offset:Math.min(200,this.config.axles.at(-1).offset+2),force:20});this.result=null;this.render();}return;}
        if(key==='remove-axle'){if(this.config.axles.length>1){this.config.axles.pop();this.result=null;this.render();}return;}
        if(key.startsWith('field:')){this.response=key.slice(6);this.renderResults();return;}
        if(key==='go-min'||key==='go-max'){
            if(this.result?.kind==='envelope'){const r=this.result.rows[this.row];this.lead=r[this.response][key==='go-min'?'minAt':'maxAt'];this.updatePreview();}
            else if(this.result){this.lead=this.result[key==='go-min'?'min':'max'].z;this.updatePreview();}
            return;
        }
        if(key.startsWith('export-')){await this.export(key.slice(7));}
    }
    async run(refine=false){
        this.cancel();const old=refine?this.result:null;this.result=null;this.error='';this.message='';
        try{validateConfig(this.model,this.config);prepareMoving(this.model);}catch(e){this.error=e.message;this.render();return;}
        const controller=new AbortController();this.controller=controller;this.running=true;this.progress=0;this.render();
        const key=this.key, config=clone(this.config), mode=this.mode;
        try{
            const r=await (mode==='influence'?influenceLine:envelope)(this.model,config,{signal:controller.signal,progress:p=>{
                if(this.controller!==controller)return;this.progress=p;const out=this.root.querySelector('#lab-progress');if(out)out.textContent=`Calculating ${Math.floor(p*100)}%`;const bar=this.root.querySelector('.lab-progress-fill');if(bar)bar.style.width=p*100+'%';
            }});
            if(controller.signal.aborted||this.controller!==controller||key!==this.key)return;
            this.running=false;this.controller=null;this.result=r;this.lead=mode==='envelope'?r.extrema.M.maxAt:r.max.z;
            this.row=mode==='envelope'?r.rows.reduce((best,rr,i)=>Math.abs(rr.x-config.station)<Math.abs(r.rows[best].x-config.station)?i:best,0):0;
            if(old?.kind==='envelope'&&r.kind==='envelope'){
                let delta=0;r.rows.forEach((row,i)=>{delta=Math.max(delta,Math.abs(row.M.min-old.rows[i].M.min),Math.abs(row.M.max-old.rows[i].M.max));});
                this.message=`Refinement: largest change in sampled moment bounds = ${fmt(delta,6)} kN·m. This is a convergence indication, not a bound on the unsampled error.`;
            }else this.message=`Completed ${r.positionCount} static positions${r.kind==='envelope'?` at ${r.stationCount} one-sided section stations`:''}. Original model unchanged.`;
            this.render();
        }catch(e){if(this.controller!==controller)return;this.running=false;this.controller=null;this.result=null;this.error=e.name==='AbortError'?'':e.message;this.message=e.name==='AbortError'?'Calculation cancelled.':'';this.render();}
    }
    render(){
        if(!this.model)return;
        const c=this.config, infl=this.mode==='influence', supports=this.model.items.filter(i=>isSupport(i.kind));
        this.root.innerHTML=`<header class="lab-head"><div><span class="eyebrow">OPTIONAL EXPLORATION / STATIC RESPONSE</span><h3>One structure. A thousand positions.</h3><p>Explore what changes when a force travels. Your original study stays untouched.</p></div>${button('close','Close lab','text-button')}</header>
        <div class="lab-tabs" role="tablist" aria-label="Moving-load modes"><button role="tab" aria-selected="${infl}" data-lab="influence">Influence line</button><button role="tab" aria-selected="${!infl}" data-lab="envelope">Axle envelopes</button></div>
        <div class="lab-body"><fieldset ${this.running?'disabled':''}><div class="lab-inputs">
        ${infl?select('target','Influence response',c.target,[['M','Moment at a section'],['V','Shear at a section (right side)'],['v','Displacement at a section'],['reaction','Support reaction']]):select('preset','Axle example','custom',[['custom','Custom / current axle set'],['single','One 20 kN axle'],['tandem','Two 20 kN axles, 2 m apart'],['triple','40 / 60 / 60 kN, 3 m gaps']])}
        ${infl&&c.target==='reaction'?select('supportId','Observed support',c.supportId,supports.map(s=>[s.id,`${s.label} at ${fmt(s.x)} m`])):field('station',infl?'Observed section':'Inspect section',c.station,0,this.model.length,'m')}
        ${select('steps','Travel intervals',c.steps,[[60,'60 / quick'],[120,'120 / normal'],[240,'240 / fine'],[480,'480 / finer']])}</div>
        ${infl?'<p class="lab-definition">The horizontal axis is the <b>unit-load position z</b>, not the section being inspected. Existing loads and self-weight are excluded.</p>':`<div class="axle-grid"><div class="axle-heading"><b>Axle</b><b>Force / kN</b><b>Distance behind lead / m</b></div>${c.axles.map((q,i)=>`<div class="axle-row"><span><i style="background:${['#efbd6a','#79bbef','#bd9af0','#f196a7'][i]}"></i>${i+1}</span>${field(`axle:${i}:force`,`Axle ${i+1} force`,q.force,-100000,100000)}${i===0?'<span class="lead-offset">0.00 / leading</span>':field(`axle:${i}:offset`,`Axle ${i+1} offset`,q.offset,.001,200)}</div>`).join('')}</div><div class="lab-axle-actions">${button('add-axle','+ Add axle','text-button',c.axles.length>=4)}${button('remove-axle','Remove last','text-button',c.axles.length===1)}</div><label class="lab-check"><input type="checkbox" data-lab-field="includeBase" ${c.includeBase?'checked':''}> Include current active static cases and self-weight</label><p class="lab-definition">Axle forces are entered directly, without case factors. Positive = down, negative = up. Off-beam axles do not act. This is <b>not a prescribed code vehicle or dynamic analysis</b>.</p>`}
        </fieldset>
        <div class="lab-run">${this.running?button('cancel','Cancel calculation','secondary'):button('run',infl?'Calculate influence line':'Calculate envelopes','primary')}${this.running?'<span id="lab-progress" role="status">Calculating 0%</span>':`<span>${esc(this.message||'No automatic background scan. Calculate when ready.')}</span>`}</div>
        ${this.running?'<div class="lab-progress"><i class="lab-progress-fill"></i></div>':''}
        ${this.error?`<div class="lab-error" role="alert">${esc(this.error)}</div>`:''}<div id="lab-results"></div>
        <details class="lab-method"><summary>Method, sampling and limitations</summary><p>Independent fixed-topology Hermite point-load assembly with exact section recovery between actions. Influence ordinates and individual static solves use linear elasticity. Envelopes search a finite set of travel positions and section stations, including axle/section crossings and near-event samples. Displayed maxima are sampled, not mathematically certified global extrema.</p><p>Each envelope point may come from a different axle position. Refining travel intervals can improve results but does not prove convergence everywhere. No dynamic amplification, lane distribution, torsion, speed or code load factors are added.</p><p><a href="https://archive.nptel.ac.in/content/storage2/courses/105101085/Slides/Module-6/Lecture-1/6.1_3.html" target="_blank" rel="noopener noreferrer">Reference: NPTEL / definition of influence lines</a></p></details></div>`;
        this.renderResults();
    }
    chartSvg(exportWidth){
        const r=this.result;if(!r)return '';
        const W=exportWidth||Math.max(290,Math.min(1000,this.root.clientWidth-(innerWidth<=640?32:48))),H=285,left=W<450?49:58,right=W-25,base=135,amp=89;
        const narrow=W<450;
        const xp=x=>left+x/this.model.length*(right-left);
        const values=r.kind==='influence'?r.data.flatMap(p=>[p.value]):r.rows.flatMap(p=>[p[this.response].min,p[this.response].max]);
        const max=Math.max(1e-9,...values.map(Math.abs)),yp=v=>base-v/max*amp;
        const path=(data,key)=>data.map((p,i)=>`${i?'L':'M'}${xp(r.kind==='influence'?p.z:p.x).toFixed(3)},${yp(r.kind==='influence'?p.value:p[this.response][key]).toFixed(3)}`).join(' ');
        const units=r.kind==='influence'?r.unit:this.response==='v'?'mm':this.response==='M'?'kN·m':'kN';
        let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" data-lab-chart="1" role="img" aria-label="${r.kind==='influence'?'Influence line':'Sampled '+this.response+' envelopes'}"><rect width="${W}" height="285" fill="#0c141b"/><text x="${left}" y="22" fill="#a4b5bf" font-size="12">${r.kind==='influence'?'Influence / '+esc(this.config.target):'Sampled '+this.response+' envelopes'} / ${esc(units)}</text><text x="${right}" y="${narrow?37:22}" text-anchor="end" fill="#90a4b2" font-size="${narrow?9:11}">${r.positionCount} travel positions</text>`;
        [1,0,-1].forEach(k=>{const y=yp(k*max);svg+=`<line x1="${left}" x2="${right}" y1="${y}" y2="${y}" stroke="#33444e" stroke-dasharray="${k?'2 5':'none'}"/><text x="${left-7}" y="${y+4}" text-anchor="end" fill="#93a9b7" font-size="10">${signed(k*max,2)}</text>`;});
        const ticks=narrow?4:6;for(let i=0;i<=ticks;i++){const x=this.model.length*i/ticks;svg+=`<line x1="${xp(x)}" x2="${xp(x)}" y1="39" y2="237" stroke="#283743" opacity=".55"/><text x="${xp(x)}" y="257" text-anchor="middle" fill="#91a5b3" font-size="11">${fmt(x,2)}</text>`;}
        if(r.kind==='influence')svg+=`<path d="${path(r.data)} L${right},${base} L${left},${base} Z" fill="#b39cee" opacity=".12"/><path d="${path(r.data)}" fill="none" stroke="#b39cee" stroke-width="2.2"/>`;
        else svg+=`<path d="${path(r.rows,'max')} ${path([...r.rows].reverse(),'min').replace(/^M/,'L')} Z" fill="#83dcc5" opacity=".09"/><path d="${path(r.rows,'max')}" fill="none" stroke="#83dcc5" stroke-width="2"/><path d="${path(r.rows,'min')}" fill="none" stroke="#eca1aa" stroke-width="2"/>`;
        if(r.kind==='envelope'){const row=r.rows[this.row];svg+=`<line x1="${xp(row.x)}" x2="${xp(row.x)}" y1="37" y2="235" stroke="#efbd6a" stroke-dasharray="4 4"/><circle cx="${xp(row.x)}" cy="${yp(row[this.response].max)}" r="4" fill="#83dcc5"/><circle cx="${xp(row.x)}" cy="${yp(row[this.response].min)}" r="4" fill="#eca1aa"/>`;}
        svg+=`<g id="lab-cursor"><line x1="0" x2="0" y1="38" y2="235" stroke="#efbd6a" stroke-dasharray="4 5"/><circle cx="0" cy="0" r="4.5" fill="#efbd6a"/></g><text x="${W/2}" y="280" text-anchor="middle" fill="#b4c4cc" font-size="11">${r.kind==='influence'?'Unit-force position z / m':narrow?'Section x / m (tap to inspect)':'Section position x / m (click to inspect)'}</text></svg>`;
        if(!exportWidth)this.scale={xp,yp,max,W,left,right};return svg;
    }
    renderResults(){
        const root=this.root.querySelector('#lab-results');if(!root)return;if(!this.result){root.innerHTML='';return;}
        const r=this.result,inf=r.kind==='influence',units=inf?r.unit:this.response==='M'?'kN·m':this.response==='v'?'mm':'kN';
        const row=inf?null:r.rows[this.row];
        root.innerHTML=`<div class="lab-results-head"><div><span class="eyebrow">${inf?'UNIT RESPONSE':'SAMPLED STATIC ENVELOPE'}</span><h4>${inf?'Fix the section. Move the force.':'Every section has its own governing position.'}</h4></div>${!inf?`<div class="lab-field-tabs">${['M','V','v'].map(k=>button('field:'+k,k==='M'?'Moment':k==='V'?'Shear':'Deflection',this.response===k?'active':'')).join('')}</div>`:''}</div>
        <div class="lab-chart">${this.chartSvg()}</div><div class="lab-summary">${inf?`<article><small>Minimum sampled ordinate</small><b>${signed(r.min.value,4)} ${esc(units)}</b><span>load z = ${fmt(r.min.z,4)} m</span></article><article><small>Maximum sampled ordinate</small><b>${signed(r.max.value,4)} ${esc(units)}</b><span>load z = ${fmt(r.max.z,4)} m</span></article>`:`<article><small>Section x = ${fmt(row.x,3)} m / ${row.side}</small><b class="pink">${signed(row[this.response].min,4)} ${units}</b><span>minimum / lead at ${fmt(row[this.response].minAt,4)} m</span></article><article><small>Same section / maximum</small><b>${signed(row[this.response].max,4)} ${units}</b><span>maximum / lead at ${fmt(row[this.response].maxAt,4)} m</span></article>`}</div>
        <div class="lab-critical-actions">${button('go-min','Show minimum position','text-button')}${button('go-max','Show maximum position','text-button')}</div>
        <div id="lab-preview"></div><label class="lab-slider">${inf?'Unit-force position':'Leading axle position'}<input type="range" data-lab-range="lead" aria-label="${inf?'Unit-force position':'Leading axle position'}" min="0" max="${inf?this.model.length:r.travel}" step="${this.model.length/1000}" value="${this.lead}"><output id="lab-lead"></output></label><div id="lab-live" class="lab-live" aria-live="off"></div>
        <p class="lab-disclaimer">${esc(r.scope)}</p><div class="lab-downloads">${button('refine','Refine travel '+Math.min(480,this.config.steps*2),'secondary',this.config.steps>=480)}${button('export-json','Evidence JSON','secondary')}${button('export-csv','CSV','secondary')}${button('export-svg','SVG','secondary')}${button('export-png','PNG','secondary')}</div><p class="hint">Lab exports are separate from the ordinary model report. A static report never silently includes an envelope.</p>`;
        this.updatePreview();
    }
    updatePreview(){
        if(!this.result)return;
        try{
            this.prepared ||= prepareMoving(this.model);if(this.result.kind==='envelope'&&this.config.includeBase)this.base ||=solveStudy(this.model);
            const forces=this.result.kind==='influence'?[{x:this.lead,value:1}]:this.config.axles.map(q=>({x:this.lead-q.offset,value:q.force}));
            const a=this.prepared.solve(forces),station=this.result.kind==='influence'?this.config.station:this.result.rows[this.row].x;
            const side=this.result.kind==='influence'?'right':this.result.rows[this.row].side;
            const rr=a.sample(station,side),b=this.base?.sample(station,side);
            const target=this.result.kind==='influence'?this.config.target:this.response;
            const value=target==='reaction'?a.reactions.find(r=>r.id===this.config.supportId).force:(rr[target]+(this.result.kind==='envelope'?(b?.[target]||0):0))*(target==='v'?1000:1);
            const live=this.root.querySelector('#lab-live');if(live)live.innerHTML=`<b>${this.result.kind==='influence'?'Live ordinate':'Response at inspected section'}: ${signed(value,4)} ${this.result.kind==='influence'?esc(this.result.unit):target==='v'?'mm':target==='M'?'kN·m':'kN'}</b><span>${forces.filter(q=>q.x>=0&&q.x<=this.model.length).length} ${this.result.kind==='influence'?'unit force':'axle(s)'} on the beam / positive forces act down</span>`;
            const W=this.scale.W,left=this.scale.left,right=this.scale.right,xp=x=>left+x/this.model.length*(right-left),colours=['#efbd6a','#79bbef','#bd9af0','#f196a7'];
            let mini=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 144" aria-label="Live moving load positions"><line x1="${left}" x2="${right}" y1="80" y2="80" stroke="#adcdc7" stroke-width="5"/>`;
            this.prepared.supports.forEach(s=>{const x=xp(s.x);mini+=s.kind==='fixed'?`<rect x="${x-5}" y="64" width="10" height="38" fill="#a5bdb9"/>`:`<path d="M${x},84 l-9,17 h18 z" fill="#a5bdb9"/>`;mini+=`<text x="${x}" y="120" text-anchor="middle" fill="#9fb7bf" font-size="10">${esc(s.label)}</text>`;});
            this.prepared.hinges.forEach(h=>{mini+=`<circle cx="${xp(h.x)}" cy="80" r="5" fill="#101b20" stroke="#bd9af0" stroke-width="2"/>`;});
            forces.forEach((q,i)=>{if(q.x<0||q.x>this.model.length)return;const x=xp(q.x),down=q.value>=0;mini+=`<line x1="${x}" x2="${x}" y1="${down?36:72}" y2="${down?72:36}" stroke="${colours[i]}" stroke-width="2"/><path d="M${x-4},${down?62:46}L${x},${down?72:36}L${x+4},${down?62:46}" fill="${colours[i]}"/><text x="${Math.max(46,Math.min(W-46,x))}" y="${18+(i%2)*12}" text-anchor="middle" fill="${colours[i]}" font-size="11">${i+1}: ${signed(q.value,1)} kN</text>`;});
            mini+=`<line x1="${xp(station)}" x2="${xp(station)}" y1="30" y2="125" stroke="#efbd6a" stroke-dasharray="2 4" opacity=".6"/><text x="${W/2}" y="141" text-anchor="middle" fill="#8b9eaa" font-size="10">${this.config.includeBase&&this.result.kind==='envelope'?'Axles shown; static base included.':'Moving actions; study unchanged.'}</text></svg>`;
            const preview=this.root.querySelector('#lab-preview');if(preview)preview.innerHTML=mini;
            const out=this.root.querySelector('#lab-lead');if(out)out.textContent=fmt(this.lead,3)+' m';
            const slider=this.root.querySelector('[data-lab-range]');if(slider&&document.activeElement!==slider)slider.value=String(this.lead);
            const cursor=this.root.querySelector('#lab-cursor');if(cursor){cursor.style.display=this.result.kind==='influence'?'':'none';if(this.result.kind==='influence'){cursor.querySelector('line').setAttribute('x1',this.scale.xp(this.lead));cursor.querySelector('line').setAttribute('x2',this.scale.xp(this.lead));cursor.querySelector('circle').setAttribute('cx',this.scale.xp(this.lead));cursor.querySelector('circle').setAttribute('cy',this.scale.yp(value));}}
        }catch(e){const out=this.root.querySelector('#lab-live');if(out)out.textContent='Preview unavailable: '+e.message;}
    }
    async export(kind){
        if(!this.result||this.running||this.exporting)return;this.exporting=true;
        try{
            const r=this.result,ref=fingerprint(this.model),name='beamlab-'+r.kind+'-'+ref;
            if(kind==='json')download(JSON.stringify({release:RELEASE,reference:ref,createdAt:new Date().toISOString(),model:this.model,result:r},null,2),name+'.json','application/json');
            if(kind==='csv'){const csv=r.kind==='envelope'?envelopeCsv(r):['load_position_z_m,ordinate_'+r.unit.replace(/[^a-zA-Z0-9]/g,'_'),...r.data.map(p=>p.z+','+p.value)].join('\n');download(csv,name+'.csv','text/csv');}
            if(kind==='svg'||kind==='png'){
                const svg=this.chartSvg(1000).replace('<svg ','<svg width="1200" height="342" ').replace('<g id="lab-cursor">','<g id="lab-cursor" display="none">');
                if(kind==='svg')download(svg,name+'.svg','image/svg+xml');
                else{const canvas=await raster(svg,2);const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG encoding failed')),'image/png'));download(blob,name+'.png','image/png');}
            }
        }catch(e){this.message='Export failed: '+e.message;this.render();}finally{this.exporting=false;}
    }
}
module.exports={MovingLab};
