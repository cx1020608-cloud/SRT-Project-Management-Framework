// ============================================================
// PM Project Intelligence Platform — app.js (i18n + Glassmorphism)
// ============================================================
let RAW=[],DATA=[];
let currentView='overview';
let sortField='id',sortDir='asc';
let projPage=1;
const PG=40;

const PROGRESS=['01-确认商机','02-明确需求','03-方案设计','04-投标报价','05-合同谈判','06-订单签订','07-暂停跟进','08-项目取消','09-丢标输单','10-项目移交'];
const P_KEY={
    '01-确认商机':'p01','02-明确需求':'p02','03-方案设计':'p03','04-投标报价':'p04',
    '05-合同谈判':'p05','06-订单签订':'p06','07-暂停跟进':'p07','08-项目取消':'p08',
    '09-丢标输单':'p09','10-项目移交':'p10'
};
function PS(p){return t(P_KEY[p])||p}
const P_COLOR={'01-确认商机':'#94a3b8','02-明确需求':'#60a5fa','03-方案设计':'#818cf8','04-投标报价':'#a78bfa','05-合同谈判':'#fbbf24','06-订单签订':'#34d399','07-暂停跟进':'#636e83','08-项目取消':'#f87171','09-丢标输单':'#e17055','10-项目移交':'#2dd4bf'};
const C=['#7c6aef','#2dd4bf','#60a5fa','#34d399','#fbbf24','#f472b6','#f87171','#e17055','#a78bfa','#22d3ee','#818cf8','#4ade80','#fb923c','#c084fc','#38bdf8','#94a3b8'];
const SC_C={SRL:'#60a5fa',SRT:'#f472b6',SRA:'#34d399',AGF:'#7c6aef',SRD:'#fbbf24',Others:'#636e72'};

function esc(s){return s==null?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function pB(p){if(!p)return'b-gray';if(p.includes('移交'))return'b-cyan';if(p.includes('签订'))return'b-green';if(p.includes('报价')||p.includes('方案'))return'b-purple';if(p.includes('谈判'))return'b-orange';if(p.includes('取消')||p.includes('丢标'))return'b-red';if(p.includes('暂停'))return'b-gray';return'b-blue'}
function pct(n,d){return d?Math.round(n/d*100):0}
function cnt(a,fn){return a.filter(fn).length}
function grp(a,k){const m={};a.forEach(d=>{const v=typeof k==='function'?k(d):d[k];if(v!=null)m[v]=(m[v]||0)+1});return m}
function topN(o,n){return Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n)}
function pXY(cx,cy,r,deg){const rad=(deg-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)}}

// ============================================================
// DATA
// ============================================================
fetch('data.json').then(r=>r.json()).then(d=>{
    RAW=d;DATA=[...RAW];
    document.getElementById('updateTime').textContent=new Date().toLocaleDateString();
    initGF();applyGF();renderView();
});

// ============================================================
// NAV
// ============================================================
document.querySelectorAll('.nav-item').forEach(el=>{
    el.addEventListener('click',e=>{
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
        el.classList.add('active');
        currentView=el.dataset.view;
        const titleKey='nav_'+currentView;
        document.getElementById('headerTitle').textContent=t(titleKey);
        document.getElementById('headerTitle').dataset.i18n=titleKey;
        projPage=1;renderView();
    });
});
document.getElementById('sidebarToggle').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('collapsed'));

// ============================================================
// GLOBAL FILTER
// ============================================================
function initGF(){
    const yrs=[...new Set(RAW.map(d=>d.year).filter(Boolean))].sort();
    const s=document.getElementById('gfYear');
    yrs.forEach(y=>{const o=document.createElement('option');o.value=y;o.textContent=y;s.appendChild(o)});
}
['gfYear','gfQuarter'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{applyGF();renderView()}));
document.getElementById('globalSearch').addEventListener('input',()=>{applyGF();renderView()});

function applyGF(){
    const y=document.getElementById('gfYear').value;
    const q=document.getElementById('gfQuarter').value;
    const s=document.getElementById('globalSearch').value.toLowerCase().trim();
    DATA=RAW.filter(d=>{
        if(y&&String(d.year)!==y)return false;
        if(q&&String(d.quarter)!==q)return false;
        if(s){const h=[d.crmNo,d.endUser,d.projectName,d.channel,d.sales,d.salesEngineer,d.hardware1,d.pjtNo,d.scenario,d.progress,d.remarks].filter(Boolean).join(' ').toLowerCase();if(!h.includes(s))return false}
        return true;
    });
}

// ============================================================
// RENDER ROUTER
// ============================================================
function renderView(){
    const c=document.getElementById('contentArea');
    switch(currentView){
        case'overview':c.innerHTML=vOverview();break;
        case'pipeline':c.innerHTML=vPipeline();break;
        case'performance':c.innerHTML=vPerformance();break;
        case'projects':c.innerHTML=vProjects();bindProjTbl();break;
        case'channels':c.innerHTML=vChannels();break;
        case'hardware':c.innerHTML=vHardware();break;
        case'market':c.innerHTML=vMarket();break;
        case'funnel':c.innerHTML=vFunnel();break;
        case'channelroi':c.innerHTML=vChannelROI();break;
        case'pmfit':c.innerHTML=vPMFit();break;
        case'matrix':c.innerHTML=vMatrix();break;
        case'decisions':c.innerHTML=vDecisions();break;
        case'news':c.innerHTML=vNews();break;
        case'weekly':c.innerHTML=vWeekly();break;
    }
}

// ============================================================
// OVERVIEW
// ============================================================
function vOverview(){
    const T=DATA.length;
    const tr=cnt(DATA,d=>d.progress==='10-项目移交');
    const sg=cnt(DATA,d=>d.progress==='06-订单签订');
    const ac=cnt(DATA,d=>!['10-项目移交','08-项目取消','09-丢标输单','07-暂停跟进'].includes(d.progress));
    const ca=cnt(DATA,d=>d.progress==='08-项目取消');
    const lo=cnt(DATA,d=>d.progress==='09-丢标输单');
    const wr=T?pct(tr+sg,T):0;
    const cu=cnt(DATA,d=>d.customization==='〇');
    const cr=T?pct(cu,T):0;
    const yr=new Date().getFullYear();
    const ly=RAW.filter(d=>d.year===yr-1),ty=RAW.filter(d=>d.year===yr);
    const yoy=ly.length?Math.round((ty.length-ly.length)/ly.length*100):0;

    const pC={};PROGRESS.forEach(p=>pC[p]=cnt(DATA,d=>d.progress===p));
    const pM=Math.max(...Object.values(pC),1);
    const sC=grp(DATA,'scenario');
    const sE=Object.entries(sC).sort((a,b)=>b[1]-a[1]);

    const years=[...new Set(DATA.map(d=>d.year).filter(Boolean))].sort();
    const qD={};years.forEach(y=>{qD[y]={};[1,2,3,4].forEach(q=>{qD[y][q]=cnt(DATA,d=>d.year===y&&d.quarter===q)})});

    const recent=[...DATA].sort((a,b)=>(b.orderDate||'').localeCompare(a.orderDate||'')).slice(0,10);
    const topCh=topN(grp(DATA,'channel'),6);

    return`
    <div class="kpi-row c6">
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">${t('total_projects')}</span><span class="kpi-trend ${yoy>=0?'up':'down'}">${yoy>=0?'↑':'↓'}${Math.abs(yoy)}% ${t('yoy')}</span></div><div class="kpi-val">${T}</div><div class="kpi-sub">${ty.length} ${yr}${t('projects_in')}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">${t('active_pipeline')}</span></div><div class="kpi-val" style="color:var(--blue)">${ac}</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${pct(ac,T)}%;background:var(--blue)"></div></div><div class="kpi-sub">${pct(ac,T)}% ${t('of_total')}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">${t('transferred')}</span></div><div class="kpi-val" style="color:var(--accent)">${tr}</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${pct(tr,T)}%;background:var(--accent)"></div></div><div class="kpi-sub">${pct(tr,T)}% ${t('completion')}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">${t('win_rate')}</span></div><div class="kpi-val" style="color:var(--green)">${wr}%</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${wr}%;background:var(--green)"></div></div><div class="kpi-sub">${tr+sg} ${t('won_total')} ${T}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">${t('cancelled_lost')}</span></div><div class="kpi-val" style="color:var(--red)">${ca+lo}</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${pct(ca+lo,T)}%;background:var(--red)"></div></div><div class="kpi-sub">${ca} ${t('cancelled')}, ${lo} ${t('lost')}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">${t('customized')}</span></div><div class="kpi-val" style="color:var(--primary2)">${cr}%</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${cr}%;background:var(--primary)"></div></div><div class="kpi-sub">${cu} ${t('of')} ${T} ${t('of_projects')}</div></div>
    </div>
    <div class="grid g32">
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('pipeline_stage')}</span><span class="panel-badge">${T} ${t('projects')}</span></div><div class="panel-b">
            <div class="vbar">${PROGRESS.map(p=>{const v=pC[p];return`<div class="vbar-g"><div class="vbar-v">${v}</div><div class="vbar-b" style="height:${Math.max((v/pM)*145,2)}px;background:${P_COLOR[p]}" onclick="goFilter('progress','${p}')"></div><div class="vbar-lb">${PS(p)}</div></div>`}).join('')}</div>
            <div style="margin-top:12px"><div class="sbar">${PROGRESS.map(p=>`<div class="sbar-s" style="width:${pct(pC[p],T)}%;background:${P_COLOR[p]}" title="${PS(p)}: ${pC[p]}"></div>`).join('')}</div></div>
        </div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('scenario_quarter')}</span></div><div class="panel-b">
            ${mkDonut(sE,125)}
            <div style="margin-top:14px"><div style="font-size:9.5px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${t('quarterly_heatmap')}</div>
            <table class="tbl" style="font-size:11px"><thead><tr><th>${t('year')}</th><th class="n">Q1</th><th class="n">Q2</th><th class="n">Q3</th><th class="n">Q4</th><th class="n">${t('total')}</th></tr></thead>
            <tbody>${years.map(y=>{const tt=Object.values(qD[y]).reduce((a,b)=>a+b,0);return`<tr><td style="font-weight:600">${y}</td>${[1,2,3,4].map(q=>`<td class="n"><span class="hcell" style="background:${heatC(qD[y][q],pM)}">${qD[y][q]}</span></td>`).join('')}<td class="n" style="font-weight:700">${tt}</td></tr>`}).join('')}</tbody></table>
            </div>
        </div></div>
    </div>
    <div class="grid g2" style="margin-top:12px">
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('recent_projects')}</span><a class="panel-link" onclick="switchView('projects')">${t('view_all')} →</a></div><div class="panel-b np"><div class="tscroll" style="max-height:320px"><table class="tbl"><thead><tr><th>${t('crm_no')}</th><th>${t('end_user')}</th><th>${t('scenario')}</th><th>${t('progress')}</th><th>${t('channel')}</th></tr></thead>
        <tbody>${recent.map(d=>`<tr onclick="openDetail(${d.id})"><td class="mono">${esc(d.crmNo)}</td><td>${esc(d.endUser)}</td><td><span class="badge b-accent">${esc(d.scenario)}</span></td><td><span class="badge ${pB(d.progress)}">${PS(d.progress)}</span></td><td class="dim">${esc(d.channel)}</td></tr>`).join('')}</tbody></table></div></div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('top_channels')}</span><a class="panel-link" onclick="switchView('channels')">${t('details')} →</a></div><div class="panel-b">
            <div class="hbar">${topCh.map(([k,v],i)=>`<div class="hbar-r" onclick="goFilter('channel','${esc(k)}')"><div class="hbar-l">${esc(k)}</div><div class="hbar-t"><div class="hbar-f" style="width:${pct(v,topCh[0][1])}%;background:${C[i%C.length]}"><span>${v}</span></div></div><div class="hbar-e">${pct(v,T)}%</div></div>`).join('')}</div>
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--glass-border)"><div style="font-size:9.5px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${t('by_country')}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">${Object.entries(grp(DATA,d=>d.country?d.country.trim():null)).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v],i)=>`<div style="background:var(--glass2);border:1px solid var(--glass-border);padding:3px 10px;border-radius:8px;font-size:11px;cursor:pointer;backdrop-filter:blur(6px)" onclick="goFilter('country','${esc(k)}')" title="${esc(k)}"><span style="color:var(--text2)">${esc(k)}</span> <span style="font-weight:700;color:${C[i%C.length]}">${v}</span></div>`).join('')}</div>
            </div>
        </div></div>
    </div>`;
}

// ============================================================
// PIPELINE
// ============================================================
function vPipeline(){
    const T=DATA.length;
    const pC={};PROGRESS.forEach(p=>pC[p]=cnt(DATA,d=>d.progress===p));
    const funnel=PROGRESS.slice(0,6);
    const fM=Math.max(...funnel.map(p=>pC[p]),1);
    const conv=[];
    for(let i=1;i<funnel.length;i++){const pr=pC[funnel[i-1]]||1;conv.push({from:PS(funnel[i-1]),to:PS(funnel[i]),rate:pr>0?Math.round(pC[funnel[i]]/pr*100):0,fN:pC[funnel[i-1]],tN:pC[funnel[i]]})}
    const scenarios=[...new Set(DATA.map(d=>d.scenario).filter(Boolean))].sort();
    const years=[...new Set(DATA.map(d=>d.year).filter(Boolean))].sort();
    const yP={};years.forEach(y=>{yP[y]={};PROGRESS.forEach(p=>yP[y][p]=cnt(DATA,d=>d.year===y&&d.progress===p))});

    return`
    <div class="kpi-row c5">${funnel.map(p=>`<div class="kpi click" onclick="goFilter('progress','${p}')"><div class="kpi-top"><span class="kpi-label">${PS(p)}</span></div><div class="kpi-val" style="color:${P_COLOR[p]}">${pC[p]}</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${pct(pC[p],T)}%;background:${P_COLOR[p]}"></div></div><div class="kpi-sub">${pct(pC[p],T)}% ${t('of_pipeline')}</div></div>`).join('')}
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">${PS('06-订单签订')}</span></div><div class="kpi-val" style="color:${P_COLOR['06-订单签订']}">${pC['06-订单签订']}</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${pct(pC['06-订单签订'],T)}%;background:${P_COLOR['06-订单签订']}"></div></div><div class="kpi-sub">${pct(pC['06-订单签订'],T)}% ${t('of_pipeline')}</div></div>
    </div>
    <div class="grid g2">
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('sales_funnel')}</span></div><div class="panel-b">
            ${funnel.map(p=>{const w=fM?pct(pC[p],fM):0;return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:5px"><div style="width:44px;font-size:11px;color:var(--text3);text-align:right">${PS(p)}</div><div style="flex:1;height:26px;background:rgba(255,255,255,.04);border-radius:6px;overflow:hidden;cursor:pointer" onclick="goFilter('progress','${p}')"><div style="height:100%;width:${Math.max(w,3)}%;background:${P_COLOR[p]};border-radius:6px;display:flex;align-items:center;padding:0 10px"><span style="font-size:10.5px;font-weight:700;color:#fff">${pC[p]}</span></div></div><div style="width:34px;font-size:10px;color:var(--text3);text-align:right">${pct(pC[p],T)}%</div></div>`}).join('')}
            <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--glass-border)"><div style="font-size:9.5px;color:var(--text3);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">${t('closed_inactive')}</div>
            ${PROGRESS.slice(6).map(p=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:3px"><div style="width:44px;font-size:11px;color:var(--text3);text-align:right">${PS(p)}</div><div style="flex:1"><div class="mbar"><div class="mbar-track"><div class="mbar-fill" style="width:${pct(pC[p],T)}%;background:${P_COLOR[p]}"></div></div><div class="mbar-val" style="color:${P_COLOR[p]}">${pC[p]}</div></div></div></div>`).join('')}
            </div>
        </div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('conversion_rates')}</span></div><div class="panel-b">
            ${conv.map(c=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px;background:var(--glass2);border:1px solid var(--glass-border);border-radius:10px">
                <div style="text-align:center;min-width:44px"><div style="font-size:17px;font-weight:800">${c.fN}</div><div style="font-size:9px;color:var(--text3)">${c.from}</div></div>
                <div style="flex:1;text-align:center"><div style="font-size:20px;font-weight:800;color:${c.rate>=50?'var(--green)':c.rate>=25?'var(--orange)':'var(--red)'}">${c.rate}%</div><div style="font-size:8.5px;color:var(--text3)">${t('conversion')}</div><div style="height:3px;background:rgba(255,255,255,.06);border-radius:2px;margin-top:5px"><div style="height:100%;width:${Math.min(c.rate,100)}%;background:${c.rate>=50?'var(--green)':c.rate>=25?'var(--orange)':'var(--red)'};border-radius:2px"></div></div></div>
                <div style="text-align:center;min-width:44px"><div style="font-size:17px;font-weight:800">${c.tN}</div><div style="font-size:9px;color:var(--text3)">${c.to}</div></div>
            </div>`).join('')}
        </div></div>
    </div>
    <div class="panel" style="margin-top:12px"><div class="panel-h"><span class="panel-t">${t('scenario_stage_matrix')}</span></div><div class="panel-b np"><div class="tscroll"><table class="tbl"><thead><tr><th>${t('scenario')}</th>${PROGRESS.map(p=>`<th class="n" style="font-size:9px">${PS(p)}</th>`).join('')}<th class="n">${t('total')}</th></tr></thead>
    <tbody>${scenarios.map(s=>{const row=PROGRESS.map(p=>cnt(DATA,d=>d.scenario===s&&d.progress===p));const tt=row.reduce((a,b)=>a+b,0);return`<tr><td><span class="badge" style="background:${SC_C[s]||'var(--glass3)'};color:#fff">${s}</span></td>${row.map((v,i)=>`<td class="n"><span class="hcell" style="background:${v?P_COLOR[PROGRESS[i]]+'33':'transparent'};color:${v?'var(--text)':'var(--text3)'}">${v||'-'}</span></td>`).join('')}<td class="n" style="font-weight:700">${tt}</td></tr>`}).join('')}
    <tr style="background:rgba(255,255,255,.03)"><td style="font-weight:700">${t('total')}</td>${PROGRESS.map(p=>`<td class="n" style="font-weight:700">${pC[p]}</td>`).join('')}<td class="n" style="font-weight:800;color:var(--accent)">${T}</td></tr>
    </tbody></table></div></div></div>
    <div class="panel" style="margin-top:12px"><div class="panel-h"><span class="panel-t">${t('yearly_pipeline_trend')}</span></div><div class="panel-b np"><div class="tscroll"><table class="tbl"><thead><tr><th>${t('year')}</th>${PROGRESS.map(p=>`<th class="n" style="font-size:9px">${PS(p)}</th>`).join('')}<th class="n">${t('total')}</th></tr></thead>
    <tbody>${years.map(y=>{const tt=Object.values(yP[y]).reduce((a,b)=>a+b,0);return`<tr><td style="font-weight:600">${y}</td>${PROGRESS.map(p=>`<td class="n">${yP[y][p]||'-'}</td>`).join('')}<td class="n" style="font-weight:700">${tt}</td></tr>`}).join('')}</tbody></table></div></div></div>`;
}

// ============================================================
// PERFORMANCE
// ============================================================
function vPerformance(){
    const T=DATA.length;
    const years=[...new Set(DATA.map(d=>d.year).filter(Boolean))].sort();
    const scenarios=[...new Set(DATA.map(d=>d.scenario).filter(Boolean))].sort();
    const channels=topN(grp(DATA,'channel'),15);
    const yWL=years.map(y=>{const yd=DATA.filter(d=>d.year===y);const w=cnt(yd,d=>['10-项目移交','06-订单签订'].includes(d.progress));const l=cnt(yd,d=>['08-项目取消','09-丢标输单'].includes(d.progress));const a=cnt(yd,d=>!['10-项目移交','06-订单签订','08-项目取消','09-丢标输单','07-暂停跟进'].includes(d.progress));return{y,t:yd.length,w,l,a,r:yd.length?pct(w,yd.length):0}});
    const probB={'100%':0,'90%':0,'30%':0,'0%':0,'N/A':0};
    DATA.forEach(d=>{if(d.acceptProb==null)probB['N/A']++;else if(d.acceptProb>=1)probB['100%']++;else if(d.acceptProb>=.9)probB['90%']++;else if(d.acceptProb>=.3)probB['30%']++;else probB['0%']++});
    const inst=topN(grp(DATA,'installation'),10);
    const loss=topN(grp(DATA.filter(d=>d.lossReason),'lossReason'),8);
    const sPerf=scenarios.map(s=>{const sd=DATA.filter(d=>d.scenario===s);const w=cnt(sd,d=>['10-项目移交','06-订单签订'].includes(d.progress));return{s,t:sd.length,w,r:sd.length?pct(w,sd.length):0}});

    return`
    <div class="panel" style="margin-bottom:12px"><div class="panel-h"><span class="panel-t">${t('yearly_comparison')}</span></div><div class="panel-b np"><table class="tbl"><thead><tr><th>${t('year')}</th><th class="n">${t('total')}</th><th class="n">${t('won')}</th><th class="n">${t('lost')}</th><th class="n">${t('active')}</th><th class="n">${t('win_rate')}</th><th style="width:180px">${t('distribution')}</th></tr></thead>
    <tbody>${yWL.map(r=>`<tr><td style="font-weight:700">${r.y}</td><td class="n">${r.t}</td><td class="n" style="color:var(--green)">${r.w}</td><td class="n" style="color:var(--red)">${r.l}</td><td class="n" style="color:var(--blue)">${r.a}</td><td class="n"><span class="badge ${r.r>=50?'b-green':r.r>=30?'b-orange':'b-red'}">${r.r}%</span></td><td><div class="sbar">${r.w?`<div class="sbar-s" style="width:${pct(r.w,r.t)}%;background:var(--green)"></div>`:''}${r.a?`<div class="sbar-s" style="width:${pct(r.a,r.t)}%;background:var(--blue)"></div>`:''}${r.l?`<div class="sbar-s" style="width:${pct(r.l,r.t)}%;background:var(--red)"></div>`:''}</div></td></tr>`).join('')}</tbody></table></div></div>
    <div class="grid g2">
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('scenario_win_rate')}</span></div><div class="panel-b">
            ${sPerf.map(r=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span class="badge" style="background:${SC_C[r.s]||'var(--glass3)'};color:#fff;min-width:46px;justify-content:center">${r.s}</span><div style="flex:1"><div class="mbar"><div class="mbar-track"><div class="mbar-fill" style="width:${r.r}%;background:${SC_C[r.s]||'var(--primary)'}"></div></div><div class="mbar-val">${r.r}%</div></div></div><div style="font-size:10px;color:var(--text3)">${r.w}/${r.t}</div></div>`).join('')}
        </div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('acceptance_prob')}</span></div><div class="panel-b">
            ${mkDonut(Object.entries(probB).filter(([,v])=>v>0),115)}
            <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--glass-border)"><div style="font-size:9.5px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${t('installation_status')}</div>
            ${inst.map(([k,v],i)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px"><span style="font-size:11px;color:var(--text2);flex:1">${esc(k)}</span><span style="font-size:12px;font-weight:700;color:${C[i%C.length]}">${v}</span></div>`).join('')}</div>
        </div></div>
    </div>
    <div class="panel" style="margin-top:12px"><div class="panel-h"><span class="panel-t">${t('channel_year_matrix')} (Top 15)</span></div><div class="panel-b np"><div class="tscroll"><table class="tbl"><thead><tr><th>${t('channel')}</th>${years.map(y=>`<th class="n">${y}</th>`).join('')}<th class="n">${t('total')}</th><th style="width:100px">${t('trend')}</th></tr></thead>
    <tbody>${channels.map(([ch,tt])=>{const byY=years.map(y=>cnt(DATA,d=>d.channel===ch&&d.year===y));const mx=Math.max(...byY,1);return`<tr onclick="goFilter('channel','${esc(ch)}')"><td>${esc(ch)}</td>${byY.map(v=>`<td class="n">${v||'-'}</td>`).join('')}<td class="n" style="font-weight:700">${tt}</td><td><div style="display:flex;align-items:flex-end;gap:2px;height:18px">${byY.map(v=>`<div style="flex:1;height:${Math.max(pct(v,mx)*.18,1)}px;background:var(--primary);border-radius:1px"></div>`).join('')}</div></td></tr>`}).join('')}</tbody></table></div></div></div>
    ${loss.length?`<div class="panel" style="margin-top:12px"><div class="panel-h"><span class="panel-t">${t('loss_reasons')}</span><span class="panel-badge">${DATA.filter(d=>d.lossReason).length} ${t('records')}</span></div><div class="panel-b"><div class="hbar">${loss.map(([k,v],i)=>`<div class="hbar-r"><div class="hbar-l">${esc(k)}</div><div class="hbar-t"><div class="hbar-f" style="width:${pct(v,loss[0][1])}%;background:${C[i%C.length]}"><span>${v}</span></div></div></div>`).join('')}</div></div></div>`:''}`;
}

// ============================================================
// PROJECTS
// ============================================================
function vProjects(){
    const pOpts=[...new Set(DATA.map(d=>d.progress).filter(Boolean))].sort();
    const sOpts=[...new Set(DATA.map(d=>d.scenario).filter(Boolean))].sort();
    const cOpts=[...new Set(DATA.map(d=>d.channel).filter(Boolean))].sort();
    const coOpts=[...new Set(DATA.map(d=>d.country?d.country.trim():null).filter(Boolean))].sort();
    const sorted=[...DATA].sort((a,b)=>{let va=a[sortField],vb=b[sortField];if(va==null)va='';if(vb==null)vb='';if(typeof va==='number'&&typeof vb==='number')return sortDir==='asc'?va-vb:vb-va;return sortDir==='asc'?String(va).localeCompare(String(vb)):String(vb).localeCompare(String(va))});
    const tP=Math.ceil(sorted.length/PG);
    const pg=sorted.slice((projPage-1)*PG,projPage*PG);

    return`
    <div class="fbar">
        <select class="f-sel" id="fpP" onchange="projPage=1;renderView()"><option value="">${t('all_progress')}</option>${pOpts.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select>
        <select class="f-sel" id="fpS" onchange="projPage=1;renderView()"><option value="">${t('all_scenarios')}</option>${sOpts.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select>
        <select class="f-sel" id="fpC" onchange="projPage=1;renderView()"><option value="">${t('all_channels')}</option>${cOpts.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
        <select class="f-sel" id="fpCo" onchange="projPage=1;renderView()"><option value="">${t('all_countries')}</option>${coOpts.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
        <button class="f-btn" onclick="exportCSV()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>${t('export')}</button>
        <span class="f-cnt">${sorted.length} ${t('projects')}</span>
    </div>
    <div class="panel"><div class="panel-b np"><div class="tscroll" style="max-height:calc(100vh - 220px)"><table class="tbl" id="pTbl"><thead><tr>
        <th class="sortable${sortField==='id'?' '+sortDir:''}" data-sort="id">#</th>
        <th class="sortable${sortField==='year'?' '+sortDir:''}" data-sort="year">${t('year')}</th><th>Q</th>
        <th class="sortable${sortField==='crmNo'?' '+sortDir:''}" data-sort="crmNo">${t('crm_no')}</th>
        <th class="sortable${sortField==='endUser'?' '+sortDir:''}" data-sort="endUser">${t('end_user')}</th>
        <th>${t('project_name')}</th><th>${t('country')}</th><th>${t('channel')}</th><th>${t('sales')}</th><th>${t('se')}</th>
        <th class="sortable${sortField==='scenario'?' '+sortDir:''}" data-sort="scenario">${t('scenario')}</th>
        <th class="sortable${sortField==='progress'?' '+sortDir:''}" data-sort="progress">${t('progress')}</th>
        <th>${t('hardware')}</th><th class="n">${t('qty')}</th><th>${t('pjt_no')}</th><th>${t('status')}</th>
    </tr></thead><tbody>${pg.map(d=>`<tr onclick="openDetail(${d.id})">
        <td class="dim">${esc(d.id)}</td><td>${esc(d.year)}</td><td>Q${esc(d.quarter)}</td>
        <td class="mono">${esc(d.crmNo)}</td><td style="font-weight:600">${esc(d.endUser)}</td>
        <td style="max-width:190px;overflow:hidden;text-overflow:ellipsis">${esc(d.projectName)}</td>
        <td>${esc(d.country)}</td><td>${esc(d.channel)}</td><td>${esc(d.sales)}</td><td class="dim">${esc(d.salesEngineer)}</td>
        <td><span class="badge b-accent">${esc(d.scenario)}</span></td>
        <td><span class="badge ${pB(d.progress)}">${PS(d.progress)}</span></td>
        <td class="dim" style="max-width:130px;overflow:hidden;text-overflow:ellipsis">${esc(d.hardware1)}</td>
        <td class="n">${d.qty1||''}</td><td class="mono">${esc(d.pjtNo)}</td>
        <td class="dim" style="max-width:120px;overflow:hidden;text-overflow:ellipsis">${esc(d.projectStatus)}</td>
    </tr>`).join('')}</tbody></table></div></div>
    <div class="paging"><div class="paging-info">${t('showing')} ${sorted.length?((projPage-1)*PG+1):0}-${Math.min(projPage*PG,sorted.length)} ${t('of')} ${sorted.length}</div><div class="paging-btns">
        <button class="pg" onclick="projPage=1;renderView()" ${projPage===1?'disabled':''}>«</button>
        <button class="pg" onclick="projPage--;renderView()" ${projPage===1?'disabled':''}>‹</button>
        ${mkPgBtns(projPage,tP)}
        <button class="pg" onclick="projPage++;renderView()" ${projPage>=tP?'disabled':''}>›</button>
        <button class="pg" onclick="projPage=${tP};renderView()" ${projPage>=tP?'disabled':''}>»</button>
    </div></div></div>`;
}
function bindProjTbl(){document.querySelectorAll('#pTbl .sortable').forEach(th=>{th.addEventListener('click',()=>{const f=th.dataset.sort;if(sortField===f)sortDir=sortDir==='asc'?'desc':'asc';else{sortField=f;sortDir='asc'}renderView()})})}
function mkPgBtns(c,t){let h='';const s=Math.max(1,c-2),e=Math.min(t,c+2);for(let i=s;i<=e;i++)h+=`<button class="pg${i===c?' active':''}" onclick="projPage=${i};renderView()">${i}</button>`;return h}

// ============================================================
// CHANNELS
// ============================================================
function vChannels(){
    const T=DATA.length;
    const channels=topN(grp(DATA,'channel'),20);
    const sales=topN(grp(DATA,d=>d.sales?d.sales.replace(/\s+/g,''):null),15);
    const se=topN(grp(DATA,d=>d.salesEngineer?d.salesEngineer.replace(/\s+/g,''):null),10);
    const regions=topN(grp(DATA,'region'),15);
    const chD=channels.map(([ch,tt])=>{const cd=DATA.filter(d=>d.channel===ch);const w=cnt(cd,d=>['10-项目移交','06-订单签订'].includes(d.progress));const a=cnt(cd,d=>!['10-项目移交','06-订单签订','08-项目取消','09-丢标输单','07-暂停跟进'].includes(d.progress));const sc=[...new Set(cd.map(d=>d.scenario).filter(Boolean))];return{ch,t:tt,w,a,r:pct(w,tt),sc}});

    return`
    <div class="grid g2">
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('channel_ranking')}</span><span class="panel-badge">${channels.length} ${t('channels_count')}</span></div><div class="panel-b np"><div class="tscroll" style="max-height:400px"><table class="tbl"><thead><tr><th>#</th><th>${t('channel')}</th><th class="n">${t('total')}</th><th class="n">${t('won')}</th><th class="n">${t('active')}</th><th class="n">${t('win_rate')}</th><th>${t('scenarios_label')}</th></tr></thead>
        <tbody>${chD.map((r,i)=>`<tr onclick="goFilter('channel','${esc(r.ch)}')"><td class="dim">${i+1}</td><td style="font-weight:600">${esc(r.ch)}</td><td class="n">${r.t}</td><td class="n" style="color:var(--green)">${r.w}</td><td class="n" style="color:var(--blue)">${r.a}</td><td class="n"><span class="badge ${r.r>=50?'b-green':r.r>=30?'b-orange':'b-red'}">${r.r}%</span></td><td>${r.sc.map(s=>`<span class="badge b-accent" style="margin-right:2px;font-size:9px">${s}</span>`).join('')}</td></tr>`).join('')}</tbody></table></div></div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('sales_team')}</span></div><div class="panel-b"><div class="hbar">${sales.map(([k,v],i)=>`<div class="hbar-r"><div class="hbar-l">${esc(k)}</div><div class="hbar-t"><div class="hbar-f" style="width:${pct(v,sales[0][1])}%;background:${C[i%C.length]}"><span>${v}</span></div></div><div class="hbar-e">${pct(v,T)}%</div></div>`).join('')}</div></div></div>
    </div>
    <div class="grid g2" style="margin-top:12px">
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('sales_engineers')}</span></div><div class="panel-b"><div class="hbar">${se.map(([k,v],i)=>`<div class="hbar-r"><div class="hbar-l">${esc(k)}</div><div class="hbar-t"><div class="hbar-f" style="width:${pct(v,se[0][1])}%;background:${C[(i+5)%C.length]}"><span>${v}</span></div></div><div class="hbar-e">${pct(v,T)}%</div></div>`).join('')}</div></div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('region_distribution')}</span></div><div class="panel-b"><div class="hbar">${regions.map(([k,v],i)=>`<div class="hbar-r"><div class="hbar-l">${esc(k)}</div><div class="hbar-t"><div class="hbar-f" style="width:${pct(v,regions[0][1])}%;background:${C[(i+2)%C.length]}"><span>${v}</span></div></div><div class="hbar-e">${pct(v,T)}%</div></div>`).join('')}</div></div></div>
    </div>`;
}

// ============================================================
// HARDWARE
// ============================================================
function vHardware(){
    const T=DATA.length;
    const hw1=topN(grp(DATA,'hardware1'),20);
    const hw2=topN(grp(DATA.filter(d=>d.hardware2),'hardware2'),10);
    const sw=topN(grp(DATA.filter(d=>d.software),'software'),10);
    const scenarios=[...new Set(DATA.map(d=>d.scenario).filter(Boolean))].sort();
    const hwM=hw1.slice(0,12).map(([h])=>h);
    const qD=DATA.filter(d=>d.qty1!=null&&!isNaN(d.qty1));
    const tQ=qD.reduce((s,d)=>s+(parseInt(d.qty1)||0),0);
    const aQ=qD.length?(tQ/qD.length).toFixed(1):0;
    const mQ=qD.reduce((m,d)=>Math.max(m,parseInt(d.qty1)||0),0);

    return`
    <div class="kpi-row c4">
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">${t('hw_models')}</span></div><div class="kpi-val" style="color:var(--primary2)">${hw1.length}</div><div class="kpi-sub">${t('unique_models')}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">${t('total_units')}</span></div><div class="kpi-val" style="color:var(--accent)">${tQ}</div><div class="kpi-sub">${qD.length} ${t('across_projects')}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">${t('avg_qty')}</span></div><div class="kpi-val" style="color:var(--green)">${aQ}</div><div class="kpi-sub">${t('mean_units')}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">${t('max_order')}</span></div><div class="kpi-val" style="color:var(--orange)">${mQ}</div><div class="kpi-sub">${t('largest_deploy')}</div></div>
    </div>
    <div class="grid g2">
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('primary_hw_ranking')}</span><span class="panel-badge">${hw1.length} ${t('models')}</span></div><div class="panel-b"><div class="hbar">${hw1.map(([k,v],i)=>`<div class="hbar-r"><div class="hbar-l" style="width:140px">${esc(k)}</div><div class="hbar-t"><div class="hbar-f" style="width:${pct(v,hw1[0][1])}%;background:${C[i%C.length]}"><span>${v}</span></div></div><div class="hbar-e">${pct(v,T)}%</div></div>`).join('')}</div></div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">${t('sw_secondary')}</span></div><div class="panel-b">
            <div style="font-size:9.5px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${t('software')}</div>
            ${sw.length?sw.map(([k,v],i)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><span style="font-size:11px;color:var(--text2);flex:1">${esc(k)}</span><div class="mbar" style="width:110px"><div class="mbar-track"><div class="mbar-fill" style="width:${pct(v,sw[0][1])}%;background:${C[(i+3)%C.length]}"></div></div><div class="mbar-val">${v}</div></div></div>`).join(''):`<div style="color:var(--text3);font-size:11px">${t('no_data')}</div>`}
            <div style="font-size:9.5px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin:14px 0 6px">${t('secondary_hw')}</div>
            ${hw2.length?hw2.map(([k,v],i)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><span style="font-size:11px;color:var(--text2);flex:1">${esc(k)}</span><div class="mbar" style="width:110px"><div class="mbar-track"><div class="mbar-fill" style="width:${pct(v,hw2[0][1])}%;background:${C[(i+7)%C.length]}"></div></div><div class="mbar-val">${v}</div></div></div>`).join(''):`<div style="color:var(--text3);font-size:11px">${t('no_data')}</div>`}
        </div></div>
    </div>
    <div class="panel" style="margin-top:12px"><div class="panel-h"><span class="panel-t">${t('hw_scenario_matrix')}</span></div><div class="panel-b np"><div class="tscroll"><table class="tbl"><thead><tr><th>${t('hardware')}</th>${scenarios.map(s=>`<th class="n">${s}</th>`).join('')}<th class="n">${t('total')}</th></tr></thead>
    <tbody>${hwM.map(h=>{const row=scenarios.map(s=>cnt(DATA,d=>d.hardware1===h&&d.scenario===s));const tt=row.reduce((a,b)=>a+b,0);return`<tr><td style="font-size:11px">${esc(h)}</td>${row.map((v,i)=>`<td class="n"><span class="hcell" style="background:${v?SC_C[scenarios[i]]+'33':'transparent'};color:${v?'var(--text)':'var(--text3)'}">${v||'-'}</span></td>`).join('')}<td class="n" style="font-weight:700">${tt}</td></tr>`}).join('')}</tbody></table></div></div></div>`;
}

// ============================================================
// SHARED
// ============================================================
function mkDonut(entries,sz){
    const r=sz/2,ir=r*.55,cx=r,cy=r;
    const T=entries.reduce((s,[,v])=>s+v,0);
    let cum=0;
    const paths=entries.map(([k,v],i)=>{const a=(v/T)*360;const s=cum;cum+=a;const p1=pXY(cx,cy,r-4,s);const p2=pXY(cx,cy,r-4,s+a-.5);return`<path d="M${cx},${cy} L${p1.x},${p1.y} A${r-4},${r-4} 0 ${a>180?1:0},1 ${p2.x},${p2.y} Z" fill="${C[i%C.length]}" style="cursor:pointer"><title>${k}: ${v} (${pct(v,T)}%)</title></path>`});
    return`<div class="donut-w"><svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">${paths.join('')}<circle cx="${cx}" cy="${cy}" r="${ir}" fill="rgba(10,14,26,.6)"/><text x="${cx}" y="${cy-3}" text-anchor="middle" font-size="15" font-weight="800" fill="var(--text)">${T}</text><text x="${cx}" y="${cy+10}" text-anchor="middle" font-size="8.5" fill="var(--text3)">total</text></svg><div class="donut-legend">${entries.map(([k,v],i)=>`<div class="dl-i"><div class="dl-d" style="background:${C[i%C.length]}"></div><span class="dl-n">${esc(k)}</span><span class="dl-v">${v}</span><span class="dl-p">${pct(v,T)}%</span></div>`).join('')}</div></div>`;
}
function heatC(v,mx){if(!v)return'transparent';const a=Math.round(Math.min(v/mx,1)*.5*255).toString(16).padStart(2,'0');return`#7c6aef${a}`}

// ============================================================
// DETAIL
// ============================================================
window.openDetail=function(id){
    const d=RAW.find(r=>r.id===id);if(!d)return;
    document.getElementById('drawerTitle').textContent=d.endUser||d.projectName||'';
    document.getElementById('drawerSub').innerHTML=`<span class="mono" style="color:var(--accent)">${esc(d.crmNo)}</span> · <span class="badge ${pB(d.progress)}">${esc(d.progress)}</span>`;
    document.getElementById('drawerBody').innerHTML=`
    <div class="dsec"><div class="dsec-t">${t('basic_info')}</div><div class="dgrid">
        <div class="ditem"><div class="dlbl">${t('crm_no')}</div><div class="dval" style="font-family:monospace;color:var(--accent)">${esc(d.crmNo)}</div></div>
        <div class="ditem"><div class="dlbl">${t('pjt_no')}</div><div class="dval" style="font-family:monospace;color:var(--accent)">${esc(d.pjtNo)}</div></div>
        <div class="ditem"><div class="dlbl">${t('end_user')}</div><div class="dval" style="font-weight:600">${esc(d.endUser)}</div></div>
        <div class="ditem full"><div class="dlbl">${t('project_name')}</div><div class="dval">${esc(d.projectName)}</div></div>
        <div class="ditem"><div class="dlbl">${t('year')} / Q</div><div class="dval">${d.year} / Q${d.quarter}</div></div>
        <div class="ditem"><div class="dlbl">${t('progress')}</div><div class="dval"><span class="badge ${pB(d.progress)}">${esc(d.progress)}</span></div></div>
    </div></div>
    <div class="dsec"><div class="dsec-t">${t('sales_channel')}</div><div class="dgrid">
        <div class="ditem"><div class="dlbl">${t('country')}</div><div class="dval">${esc(d.country)}</div></div>
        <div class="ditem"><div class="dlbl">${t('region')}</div><div class="dval">${esc(d.region)}</div></div>
        <div class="ditem"><div class="dlbl">${t('channel')}</div><div class="dval" style="font-weight:600">${esc(d.channel)}</div></div>
        <div class="ditem"><div class="dlbl">${t('channel_contact')}</div><div class="dval">${esc(d.channelContact)}</div></div>
        <div class="ditem"><div class="dlbl">${t('sales')}</div><div class="dval">${esc(d.sales)}</div></div>
        <div class="ditem"><div class="dlbl">${t('sales_engineer')}</div><div class="dval">${esc(d.salesEngineer)}</div></div>
    </div></div>
    <div class="dsec"><div class="dsec-t">${t('product_tech')}</div><div class="dgrid">
        <div class="ditem"><div class="dlbl">${t('scenario')}</div><div class="dval"><span class="badge b-accent">${esc(d.scenario)}</span></div></div>
        <div class="ditem"><div class="dlbl">${t('customization_label')}</div><div class="dval">${d.customization==='〇'?`<span class="badge b-green">${t('customization_yes')}</span>`:`<span class="badge b-gray">${t('customization_no')}</span>`}</div></div>
        <div class="ditem"><div class="dlbl">${t('hw1')}</div><div class="dval">${esc(d.hardware1)}${d.qty1?' <span class="badge b-purple">× '+d.qty1+'</span>':''}</div></div>
        <div class="ditem"><div class="dlbl">${t('hw2')}</div><div class="dval">${esc(d.hardware2)}${d.qty2?' <span class="badge b-purple">× '+d.qty2+'</span>':''}</div></div>
        <div class="ditem"><div class="dlbl">${t('software')}</div><div class="dval">${esc(d.software)}${d.softQty?' <span class="badge b-purple">× '+d.softQty+'</span>':''}</div></div>
        <div class="ditem"><div class="dlbl">${t('order_date')}</div><div class="dval">${d.orderDate?d.orderDate.split(' ')[0]:'-'}</div></div>
    </div></div>
    <div class="dsec"><div class="dsec-t">${t('project_status')}</div><div class="dgrid">
        <div class="ditem"><div class="dlbl">${t('status')}</div><div class="dval">${esc(d.projectStatus)}</div></div>
        <div class="ditem"><div class="dlbl">${t('accept_prob')}</div><div class="dval">${d.acceptProb!=null?(d.acceptProb*100)+'%':'-'}</div></div>
        <div class="ditem"><div class="dlbl">${t('installation')}</div><div class="dval">${esc(d.installation)}</div></div>
        <div class="ditem"><div class="dlbl">${t('loss_reason')}</div><div class="dval">${esc(d.lossReason)||'-'}</div></div>
    </div></div>
    ${d.presalesDoc?`<div class="dsec"><div class="dsec-t">${t('documents')}</div><div class="dval"><a href="${esc(d.presalesDoc)}" target="_blank">${esc(d.presalesDoc)}</a></div></div>`:''}
    ${d.remarks?`<div class="dsec"><div class="dsec-t">${t('remarks')}</div><div class="rbox">${esc(d.remarks)}</div></div>`:''}
    ${d.remark?`<div class="dsec"><div class="dsec-t">${t('additional_notes')}</div><div class="rbox">${esc(d.remark)}</div></div>`:''}`;
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('show');
};

document.getElementById('drawerClose').addEventListener('click',closeD);
document.getElementById('drawerOverlay').addEventListener('click',closeD);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeD()});
function closeD(){document.getElementById('drawer').classList.remove('open');document.getElementById('drawerOverlay').classList.remove('show')}

// ============================================================
// ACTIONS
// ============================================================
window.switchView=function(v){
    currentView=v;
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===v));
    const k='nav_'+v;
    document.getElementById('headerTitle').textContent=t(k);
    document.getElementById('headerTitle').dataset.i18n=k;
    projPage=1;renderView();
};

window.goFilter=function(type,val){
    currentView='projects';
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view==='projects'));
    document.getElementById('headerTitle').textContent=t('nav_projects');
    document.getElementById('headerTitle').dataset.i18n='nav_projects';
    projPage=1;renderView();
    setTimeout(()=>{
        const map={progress:'fpP',scenario:'fpS',channel:'fpC',country:'fpCo'};
        const sel=document.getElementById(map[type]);
        if(sel){sel.value=val;applyPF()}
    },10);
};

window.exportCSV=function(){
    const h=['ID','Year','Q','CRM No.','End User','Project Name','Country','Region','Channel','Sales','SE','Scenario','Progress','Hardware1','Qty1','PJT No.','Status'];
    const rows=DATA.map(d=>[d.id,d.year,d.quarter,d.crmNo,d.endUser,d.projectName,d.country,d.region,d.channel,d.sales,d.salesEngineer,d.scenario,d.progress,d.hardware1,d.qty1,d.pjtNo,d.projectStatus]);
    const csv='\uFEFF'+[h,...rows].map(r=>r.map(c=>`"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='projects_export.csv';a.click();
};

function applyPF(){
    const p=document.getElementById('fpP')?.value||'';
    const s=document.getElementById('fpS')?.value||'';
    const c=document.getElementById('fpC')?.value||'';
    const co=document.getElementById('fpCo')?.value||'';
    let f=DATA;
    if(p)f=f.filter(d=>d.progress===p);if(s)f=f.filter(d=>d.scenario===s);
    if(c)f=f.filter(d=>d.channel===c);if(co)f=f.filter(d=>d.country&&d.country.trim()===co);
    f.sort((a,b)=>{let va=a[sortField],vb=b[sortField];if(va==null)va='';if(vb==null)vb='';if(typeof va==='number'&&typeof vb==='number')return sortDir==='asc'?va-vb:vb-va;return sortDir==='asc'?String(va).localeCompare(String(vb)):String(vb).localeCompare(String(va))});
    const tP=Math.ceil(f.length/PG);if(projPage>tP)projPage=Math.max(1,tP);
    const pg=f.slice((projPage-1)*PG,projPage*PG);
    const tb=document.querySelector('#pTbl tbody');
    if(tb)tb.innerHTML=pg.map(d=>`<tr onclick="openDetail(${d.id})"><td class="dim">${esc(d.id)}</td><td>${esc(d.year)}</td><td>Q${esc(d.quarter)}</td><td class="mono">${esc(d.crmNo)}</td><td style="font-weight:600">${esc(d.endUser)}</td><td style="max-width:190px;overflow:hidden;text-overflow:ellipsis">${esc(d.projectName)}</td><td>${esc(d.country)}</td><td>${esc(d.channel)}</td><td>${esc(d.sales)}</td><td class="dim">${esc(d.salesEngineer)}</td><td><span class="badge b-accent">${esc(d.scenario)}</span></td><td><span class="badge ${pB(d.progress)}">${PS(d.progress)}</span></td><td class="dim" style="max-width:130px;overflow:hidden;text-overflow:ellipsis">${esc(d.hardware1)}</td><td class="n">${d.qty1||''}</td><td class="mono">${esc(d.pjtNo)}</td><td class="dim" style="max-width:120px;overflow:hidden;text-overflow:ellipsis">${esc(d.projectStatus)}</td></tr>`).join('');
    const info=document.querySelector('.paging-info');if(info)info.textContent=`${t('showing')} ${f.length?((projPage-1)*PG+1):0}-${Math.min(projPage*PG,f.length)} ${t('of')} ${f.length}`;
    const ct=document.querySelector('.f-cnt');if(ct)ct.textContent=`${f.length} ${t('projects')}`;
}
document.addEventListener('change',e=>{if(['fpP','fpS','fpC','fpCo'].includes(e.target.id)){projPage=1;applyPF()}});
