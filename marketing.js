// ============================================================
// Strategic Analysis Views — marketing.js
// ============================================================

// ── Helpers ──
function pQty(v){if(v==null)return 0;if(typeof v==='number')return v;const s=String(v).replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0));const n=parseFloat(s);return isNaN(n)?0:n}
function hhi(counts){const t=counts.reduce((a,b)=>a+b,0);if(!t)return 0;return Math.round(counts.reduce((s,c)=>s+Math.pow(c/t*100,2),0))}

const EARLY=['01-确认商机','02-明确需求'];
const MID=['03-方案设计','04-投标报价'];
const LATE=['05-合同谈判','06-订单签订'];
const CLOSED=['07-暂停跟进','08-项目取消','09-丢标输单','10-项目移交'];
const WON_P=['06-订单签订','10-项目移交'];
function isWon(d){return WON_P.includes(d.progress)}
function isLost(d){return d.progress==='09-丢标输单'}
function isActive(d){return!CLOSED.includes(d.progress)}
function stageGroup(p){if(EARLY.includes(p))return'early';if(MID.includes(p))return'mid';if(LATE.includes(p))return'late';return'closed'}
function stageLabel(g){return{early:'前期',mid:'中期',late:'后期',closed:'关闭'}[g]||g}
function stageColor(g){return{early:'var(--blue)',mid:'var(--purple)',late:'var(--green)',closed:'var(--text3)'}[g]||'var(--text3)'}

// Alert card helper
function alertCard(level,title,body){
    const colors={danger:'var(--red)',warning:'var(--orange)',info:'var(--blue)',success:'var(--green)'};
    const bgs={danger:'var(--red-bg)',warning:'var(--orange-bg)',info:'var(--blue-bg)',success:'var(--green-bg)'};
    const icons={danger:'⚠',warning:'⚡',info:'ℹ',success:'✓'};
    return`<div style="padding:12px 14px;background:${bgs[level]};border-left:3px solid ${colors[level]};border-radius:6px;margin-bottom:8px"><div style="display:flex;align-items:center;gap:6px;margin-bottom:3px"><span style="font-size:12px">${icons[level]}</span><span style="font-size:11px;font-weight:700;color:${colors[level]}">${title}</span></div><div style="font-size:11px;color:var(--text2);line-height:1.6">${body}</div></div>`;
}

// ════════════════════════════════════════════════════════════
// VIEW 1: 经营层总览 (Executive Dashboard)
// ════════════════════════════════════════════════════════════
function vMarket(){
    const T=DATA.length;
    const won=cnt(DATA,isWon), lost=cnt(DATA,isLost), active=cnt(DATA,isActive);
    const years=[...new Set(DATA.map(d=>d.year).filter(Boolean))].sort();

    // ── Conclusion 1: 渠道驱动判断 ──
    const chGrp=grp(DATA,'channel');
    const chEntries=Object.entries(chGrp).sort((a,b)=>b[1]-a[1]);
    const top3Ch=chEntries.slice(0,3).reduce((a,[,v])=>a+v,0);
    const top3Pct=T?pct(top3Ch,T):0;
    const chHHI=hhi(Object.values(chGrp));

    // ── Conclusion 2: Pipeline前端膨胀 ──
    const earlyN=cnt(DATA,d=>EARLY.includes(d.progress));
    const midN=cnt(DATA,d=>MID.includes(d.progress));
    const lateN=cnt(DATA,d=>LATE.includes(d.progress));
    const earlyPct=T?pct(earlyN,T):0;
    const frontHeavy=earlyN>(midN+lateN);

    // ── Conclusion 3: 概率体系缺失 ──
    const noProb=cnt(DATA,d=>d.acceptProb==null||d.acceptProb==='');
    const noProbPct=T?pct(noProb,T):0;

    // ── Conclusion 4: 场景分散度 ──
    const scGrp=grp(DATA,'scenario');
    const scEntries=Object.entries(scGrp).sort((a,b)=>b[1]-a[1]);
    const topScPct=T&&scEntries.length?pct(scEntries[0][1],T):0;
    const scHHI=hhi(Object.values(scGrp));

    // ── Conclusion 5: 售前瓶颈 ──
    const seGrp=grp(DATA,'salesEngineer');
    const seEntries=Object.entries(seGrp).sort((a,b)=>b[1]-a[1]);
    const topSEPct=seEntries.length?pct(seEntries[0][1],T):0;

    // ── Chart 1: Pipeline × Channel stacked ──
    const stageCh={};PROGRESS.forEach(p=>{stageCh[p]={};chEntries.slice(0,5).forEach(([ch])=>{stageCh[p][ch]=cnt(DATA,d=>d.progress===p&&d.channel===ch)});stageCh[p]['其他']=cnt(DATA,d=>d.progress===p&&!chEntries.slice(0,5).map(([c])=>c).includes(d.channel))});
    const topChNames=[...chEntries.slice(0,5).map(([c])=>c),'其他'];
    const stageMax=Math.max(...PROGRESS.map(p=>topChNames.reduce((a,ch)=>a+(stageCh[p][ch]||0),0)),1);

    // ── Chart 2: Sales × Stage stacked ──
    const salesGrp=grp(DATA,'sales');
    const salesList=Object.entries(salesGrp).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([s])=>s);
    const salesStage={};salesList.forEach(s=>{
        salesStage[s]={early:cnt(DATA,d=>d.sales===s&&EARLY.includes(d.progress)),mid:cnt(DATA,d=>d.sales===s&&MID.includes(d.progress)),late:cnt(DATA,d=>d.sales===s&&LATE.includes(d.progress)),closed:cnt(DATA,d=>d.sales===s&&CLOSED.includes(d.progress))};
    });
    const ssMax=Math.max(...salesList.map(s=>Object.values(salesStage[s]).reduce((a,b)=>a+b,0)),1);

    // ── Chart 3: Scenario × Hardware matrix ──
    const sList=[...new Set(DATA.map(d=>d.scenario).filter(Boolean))].sort();
    const hwGrp=grp(DATA,'hardware1');
    const topHW=topN(hwGrp,10).map(([h])=>h);
    const shM={};topHW.forEach(h=>{shM[h]={};sList.forEach(s=>{shM[h][s]=cnt(DATA,d=>d.hardware1===h&&d.scenario===s)})});
    const shMax=Math.max(...topHW.flatMap(h=>sList.map(s=>shM[h][s])),1);

    return`
    <div class="kpi-row c5">
        <div class="kpi kpi-gold"><div class="kpi-top"><span class="kpi-label">管线总量</span></div><div class="kpi-val gold-num">${T}</div><div class="kpi-sub">${active} 活跃 · ${won} 成单</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">渠道集中度</span></div><div class="kpi-val" style="color:${chHHI>2500?'var(--red)':chHHI>1500?'var(--orange)':'var(--green)'}">${chHHI}</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${Math.min(chHHI/50,100)}%;background:${chHHI>2500?'var(--red)':'var(--orange)'}"></div></div><div class="kpi-sub">Top3占比 ${top3Pct}%</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">概率缺失率</span></div><div class="kpi-val" style="color:${noProbPct>50?'var(--red)':'var(--orange)'}">${noProbPct}%</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${noProbPct}%;background:var(--red)"></div></div><div class="kpi-sub">${noProb} / ${T} 无预测</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">前端占比</span></div><div class="kpi-val" style="color:${earlyPct>40?'var(--orange)':'var(--green)'}">${earlyPct}%</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${earlyPct}%;background:${earlyPct>40?'var(--orange)':'var(--green)'}"></div></div><div class="kpi-sub">${earlyN} 前期项目</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">主力场景占比</span></div><div class="kpi-val" style="color:var(--blue)">${topScPct}%</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${topScPct}%;background:var(--blue)"></div></div><div class="kpi-sub">${scEntries[0]?scEntries[0][0]:'-'}</div></div>
    </div>

    <div class="panel panel-gold"><div class="panel-h"><span class="panel-t">经营诊断结论</span><span class="panel-badge">基于 ${T} 个项目数据</span></div><div class="panel-b">
        <div class="grid g2">
            <div>
                ${alertCard(chHHI>2500?'danger':'warning','结论1: 渠道驱动型组织，质量不透明',`Top3渠道(${chEntries.slice(0,3).map(([c])=>c).join('、')})占 <b>${top3Pct}%</b> 项目。HHI=${chHHI}，${chHHI>2500?'高度集中':'中度集中'}。<br>风险: 单点依赖、渠道议价权过强、销售失去主动权`)}
                ${alertCard(frontHeavy?'danger':'info','结论2: Pipeline结构 '+(frontHeavy?'前端膨胀':'相对均衡'),`前期 ${earlyN}(${earlyPct}%) · 中期 ${midN}(${T?pct(midN,T):0}%) · 后期 ${lateN}(${T?pct(lateN,T):0}%)。${frontHeavy?'<br>风险: 销售在堆数量，推进能力不足或渠道筛选差':'结构较健康，但需持续监控转化'}`)}
                ${alertCard(noProbPct>50?'danger':'warning','结论3: 概率体系 '+(noProbPct>50?'严重缺失':'部分缺失'),`${noProb}个项目(${noProbPct}%)无acceptProb预测。${noProbPct>50?'<br>这不仅是数据问题，是组织问题: 销售缺乏判断能力或不愿承担预测责任':'部分项目可能处于极早期阶段'}`)}
            </div>
            <div>
                ${alertCard(scHHI>4000?'warning':'info','结论4: 场景'+(scHHI>4000?'高度集中在'+scEntries[0][0]:'分布尚可'),`${sList.length}个场景，HHI=${scHHI}。#1 ${scEntries[0]?scEntries[0][0]+' ('+scEntries[0][1]+'件, '+topScPct+'%)':''}。${scHHI>4000?'<br>如果主场景市场饱和，增长将面临挑战':'场景有一定多元化，但需关注各场景深度'}`)}
                ${alertCard(topSEPct>50?'warning':'info','结论5: 售前资源'+(topSEPct>50?'存在隐性瓶颈':'分布中度集中'),`Top1 SE (${seEntries[0]?seEntries[0][0]:'-'}) 承担 ${topSEPct}% 项目。${topSEPct>50?'<br>风险: 关键人依赖，该SE离职或超负荷将直接影响业务':'建议持续监控工时数据'}`)}
                ${alertCard('info','数据局限提示','当前数据无金额(无法做收入/ROI)、无时间链路(无法做流程效率)、概率不稳定(Forecast不可用)。本分析聚焦<b>结构性问题</b>发现。')}
            </div>
        </div>
    </div></div>

    <div class="panel" style="margin-top:12px"><div class="panel-h"><span class="panel-t">关键图1: Pipeline阶段 × 渠道堆叠</span><span class="panel-badge">哪个渠道在哪个阶段堆积？</span></div><div class="panel-b">
        <div class="vbar" style="height:200px">${PROGRESS.map(p=>{const total=topChNames.reduce((a,ch)=>a+(stageCh[p][ch]||0),0);return`<div class="vbar-g"><div class="vbar-v">${total}</div><div style="width:90%;display:flex;flex-direction:column;align-items:center;gap:0">${topChNames.map((ch,ci)=>{const v=stageCh[p][ch]||0;if(!v)return'';return`<div style="width:100%;max-width:36px;height:${Math.max(v/stageMax*160,2)}px;background:${C[ci%C.length]}" title="${ch}: ${v}"></div>`}).join('')}</div><div class="vbar-lb" style="font-size:7.5px">${PS(p)}</div></div>`}).join('')}</div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:8px;flex-wrap:wrap">${topChNames.map((ch,i)=>`<span style="font-size:10px;color:var(--text3)"><span style="display:inline-block;width:8px;height:8px;background:${C[i%C.length]};border-radius:2px;margin-right:3px"></span>${esc(ch)}</span>`).join('')}</div>
    </div></div>

    <div class="grid g2" style="margin-top:12px">
        <div class="panel"><div class="panel-h"><span class="panel-t">关键图2: 销售 × 阶段分布</span><span class="panel-badge">谁在推进，谁在堆坑？</span></div><div class="panel-b">
            ${salesList.map(s=>{const d=salesStage[s];const total=d.early+d.mid+d.late+d.closed;return`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:55px;font-size:11px;font-weight:600;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s)}</div><div style="flex:1;height:22px;display:flex;border-radius:4px;overflow:hidden">${['early','mid','late','closed'].map(g=>{const v=d[g];if(!v)return'';return`<div style="width:${pct(v,total)}%;background:${stageColor(g)};display:flex;align-items:center;justify-content:center" title="${stageLabel(g)}: ${v}"><span style="font-size:8px;font-weight:700;color:#fff">${v}</span></div>`}).join('')}</div><div style="min-width:30px;text-align:right;font-size:11px;font-weight:700">${total}</div></div>`}).join('')}
            <div style="display:flex;gap:10px;justify-content:center;margin-top:8px">${['early','mid','late','closed'].map(g=>`<span style="font-size:10px;color:var(--text3)"><span style="display:inline-block;width:8px;height:8px;background:${stageColor(g)};border-radius:2px;margin-right:3px"></span>${stageLabel(g)}</span>`).join('')}</div>
        </div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">关键图3: 场景 × 硬件矩阵</span><span class="panel-badge">产品-场景匹配度</span></div><div class="panel-b np"><div class="tscroll" style="max-height:340px"><table class="tbl"><thead><tr><th>${t('hardware')}</th>${sList.map(s=>`<th class="n">${s}</th>`).join('')}<th class="n">${t('total')}</th></tr></thead>
            <tbody>${topHW.map(h=>{const row=sList.map(s=>shM[h][s]);const tt=row.reduce((a,b)=>a+b,0);return`<tr><td style="font-size:10px;font-weight:600">${esc(h)}</td>${row.map(v=>`<td class="n"><span class="hcell" style="background:${v?`rgba(16,185,129,${Math.max(v/shMax,.1)*0.5})`:'transparent'};color:${v?'var(--accent)':'var(--text3)'}">${v||'-'}</span></td>`).join('')}<td class="n" style="font-weight:700">${tt}</td></tr>`}).join('')}</tbody></table></div></div></div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
// VIEW 2: Pipeline健康度 & 销售人效 (Sales Director)
// ════════════════════════════════════════════════════════════
function vFunnel(){
    const T=DATA.length;
    const years=[...new Set(DATA.map(d=>d.year).filter(Boolean))].sort();

    // ── 1. 阶段分布结构 ──
    const pC={};PROGRESS.forEach(p=>pC[p]=cnt(DATA,d=>d.progress===p));
    const pM=Math.max(...Object.values(pC),1);
    const earlyN=cnt(DATA,d=>EARLY.includes(d.progress));
    const midN=cnt(DATA,d=>MID.includes(d.progress));
    const lateN=cnt(DATA,d=>LATE.includes(d.progress));
    const closedN=cnt(DATA,d=>CLOSED.includes(d.progress));

    // Detect bottleneck: find the stage with biggest drop-off
    const activeStages=PROGRESS.slice(0,6);
    let maxDrop=0,bottleneck='';
    for(let i=1;i<activeStages.length;i++){
        const drop=(pC[activeStages[i-1]]||0)-(pC[activeStages[i]]||0);
        if(drop>maxDrop){maxDrop=drop;bottleneck=activeStages[i-1]}
    }

    // ── 2. 概率 vs 阶段 ──
    const probStage={};['early','mid','late'].forEach(g=>{
        const items=DATA.filter(d=>stageGroup(d.progress)===g);
        probStage[g]={total:items.length,
            high:items.filter(d=>d.acceptProb==1).length,
            mid:items.filter(d=>d.acceptProb==0.3).length,
            low:items.filter(d=>d.acceptProb==0||d.acceptProb==='0').length,
            none:items.filter(d=>d.acceptProb==null||d.acceptProb==='').length};
    });

    // Anomaly detection
    const earlyHighProb=probStage.early.high;
    const lateNoProb=probStage.late.none;
    const anomalies=[];
    if(earlyHighProb>0)anomalies.push({type:'warning',msg:`${earlyHighProb}个前期项目标记高概率(100%) → 可能是销售拍脑袋`});
    if(lateNoProb>0)anomalies.push({type:'warning',msg:`${lateNoProb}个后期项目无概率 → 客户真实性存疑`});

    // ── 3. 无概率项目分析 ──
    const noProb=DATA.filter(d=>d.acceptProb==null||d.acceptProb==='');
    const noProbByStage={early:noProb.filter(d=>EARLY.includes(d.progress)).length,mid:noProb.filter(d=>MID.includes(d.progress)).length,late:noProb.filter(d=>LATE.includes(d.progress)).length,closed:noProb.filter(d=>CLOSED.includes(d.progress)).length};

    // ── 4. 销售人效 ──
    const salesGrp=grp(DATA,'sales');
    const salesList=Object.entries(salesGrp).sort((a,b)=>b[1]-a[1]).map(([s])=>s);
    const salesStats={};salesList.forEach(s=>{
        const items=DATA.filter(d=>d.sales===s);
        const early=items.filter(d=>EARLY.includes(d.progress)).length;
        const mid=items.filter(d=>MID.includes(d.progress)).length;
        const late=items.filter(d=>LATE.includes(d.progress)).length;
        const won=items.filter(isWon).length;
        const total=items.length;
        const earlyPct=total?pct(early,total):0;
        const latePct=total?pct(late+won,total):0;
        const type=earlyPct>50?'铺量型':latePct>50?'深耕型':'均衡型';
        const typeColor=type==='铺量型'?'var(--orange)':type==='深耕型'?'var(--green)':'var(--blue)';
        salesStats[s]={total,early,mid,late,won,lost:items.filter(isLost).length,active:items.filter(isActive).length,earlyPct,latePct,type,typeColor,wr:total?pct(won,total):0};
    });

    // ── 5. 阶段推进能力 ──
    // Which salesperson pushes most to late stage?
    const pushAbility=salesList.map(s=>{
        const st=salesStats[s];
        return{name:s,...st,pushRate:st.total?pct(st.late+st.won,st.total):0};
    }).sort((a,b)=>b.pushRate-a.pushRate);

    return`
    <div class="kpi-row c6">
        <div class="kpi kpi-gold"><div class="kpi-top"><span class="kpi-label">管线总量</span></div><div class="kpi-val gold-num">${T}</div><div class="kpi-sub">${earlyN} 前 · ${midN} 中 · ${lateN} 后</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">前期堆积</span></div><div class="kpi-val" style="color:${pct(earlyN,T)>40?'var(--red)':'var(--blue)'}">${earlyN}</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${pct(earlyN,T)}%;background:var(--blue)"></div></div><div class="kpi-sub">${pct(earlyN,T)}% 项目在前期</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">瓶颈阶段</span></div><div class="kpi-val" style="color:var(--orange);font-size:16px">${bottleneck?PS(bottleneck):'-'}</div><div class="kpi-sub">最大转化落差: -${maxDrop}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">无概率项目</span></div><div class="kpi-val" style="color:var(--red)">${noProb.length}</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${pct(noProb.length,T)}%;background:var(--red)"></div></div><div class="kpi-sub">${pct(noProb.length,T)}% 无预测</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">销售人数</span></div><div class="kpi-val" style="color:var(--purple)">${salesList.length}</div><div class="kpi-sub">人均 ${salesList.length?(T/salesList.length).toFixed(1):'0'} 项目</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">成单率</span></div><div class="kpi-val" style="color:var(--green)">${pct(cnt(DATA,isWon),T)}%</div><div class="kpi-sub">${cnt(DATA,isWon)} 成单</div></div>
    </div>

    <div class="grid g2">
        <div class="panel panel-gold"><div class="panel-h"><span class="panel-t">阶段分布结构</span><span class="panel-badge">是否存在堆积？</span></div><div class="panel-b">
            <div class="vbar" style="height:170px">${PROGRESS.map((p,i)=>{const v=pC[p];const sg=stageGroup(p);return`<div class="vbar-g"><div class="vbar-v">${v}</div><div class="vbar-b" style="height:${Math.max(v/pM*140,2)}px;background:${stageColor(sg)};${p===bottleneck?'box-shadow:0 0 0 2px var(--orange)':''}" title="${PS(p)}: ${v}"></div><div class="vbar-lb" style="font-size:7.5px">${PS(p)}</div></div>`}).join('')}</div>
            <div style="margin-top:10px"><div class="sbar" style="height:10px;border-radius:5px">${['early','mid','late','closed'].map(g=>{const n=g==='early'?earlyN:g==='mid'?midN:g==='late'?lateN:closedN;return`<div class="sbar-s" style="width:${pct(n,T)}%;background:${stageColor(g)}" title="${stageLabel(g)}: ${n} (${pct(n,T)}%)"></div>`}).join('')}</div></div>
            <div style="display:flex;gap:12px;margin-top:8px">${['early','mid','late','closed'].map(g=>{const n=g==='early'?earlyN:g==='mid'?midN:g==='late'?lateN:closedN;return`<div style="font-size:10px"><span style="display:inline-block;width:8px;height:8px;background:${stageColor(g)};border-radius:2px;margin-right:3px"></span>${stageLabel(g)} <b>${n}</b> (${pct(n,T)}%)</div>`}).join('')}</div>
            ${bottleneck?`<div style="margin-top:10px;padding:8px 10px;background:var(--orange-bg);border-radius:6px;font-size:11px;color:var(--text2)">⚡ 瓶颈: <b>${PS(bottleneck)}</b> → <b>${PS(PROGRESS[PROGRESS.indexOf(bottleneck)+1]||'')}</b> 落差最大(${maxDrop}件)，推进能力需关注</div>`:''}
        </div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">概率结构 vs 阶段结构</span><span class="panel-badge">异常检测</span></div><div class="panel-b">
            <table class="tbl"><thead><tr><th>阶段</th><th class="n">100%</th><th class="n">30%</th><th class="n">0%</th><th class="n" style="color:var(--red)">缺失</th><th class="n">合计</th></tr></thead>
            <tbody>${['early','mid','late'].map(g=>{const d=probStage[g];return`<tr><td><span style="display:inline-block;width:8px;height:8px;background:${stageColor(g)};border-radius:2px;margin-right:4px"></span>${stageLabel(g)}</td><td class="n" style="color:var(--green)">${d.high||'-'}</td><td class="n" style="color:var(--orange)">${d.mid||'-'}</td><td class="n" style="color:var(--red)">${d.low||'-'}</td><td class="n" style="color:var(--red);font-weight:700">${d.none||'-'}</td><td class="n" style="font-weight:700">${d.total}</td></tr>`}).join('')}</tbody></table>
            ${anomalies.length?`<div style="margin-top:10px">${anomalies.map(a=>alertCard(a.type,'概率异常',a.msg)).join('')}</div>`:''}
            <div class="gold-line"></div>
            <div style="font-size:9.5px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">无概率项目按阶段</div>
            ${['early','mid','late','closed'].map(g=>{const v=noProbByStage[g];const tot=g==='early'?earlyN:g==='mid'?midN:g==='late'?lateN:closedN;return`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div style="width:36px;font-size:11px;color:var(--text2)">${stageLabel(g)}</div><div style="flex:1;height:14px;background:var(--surface3);border-radius:3px;overflow:hidden"><div style="height:100%;width:${tot?pct(v,tot):0}%;background:var(--red);border-radius:3px;opacity:.7"></div></div><div style="min-width:50px;text-align:right;font-size:10px"><b>${v}</b>/${tot} (${tot?pct(v,tot):0}%)</div></div>`}).join('')}
        </div></div>
    </div>

    <div class="panel" style="margin-top:12px"><div class="panel-h"><span class="panel-t">销售人效分析</span><span class="panel-badge">铺量型 vs 深耕型</span></div><div class="panel-b np"><div class="tscroll" style="max-height:400px"><table class="tbl"><thead><tr><th>销售</th><th class="n">总数</th><th class="n">前期</th><th class="n">中期</th><th class="n">后期</th><th class="n">成单</th><th class="n">丢标</th><th class="n">成单率</th><th class="n">推进率</th><th>类型</th><th style="width:140px">阶段分布</th></tr></thead>
        <tbody>${pushAbility.map((s,i)=>`<tr><td style="font-weight:600">${esc(s.name)}</td><td class="n">${s.total}</td><td class="n" style="color:var(--blue)">${s.early}</td><td class="n" style="color:var(--purple)">${s.mid}</td><td class="n" style="color:var(--green)">${s.late}</td><td class="n" style="color:var(--green);font-weight:700">${s.won}</td><td class="n" style="color:var(--red)">${s.lost}</td><td class="n" style="color:${s.wr>=50?'var(--green)':'var(--text2)'}"><b>${s.wr}%</b></td><td class="n" style="color:${s.pushRate>=50?'var(--green)':'var(--text2)'}"><b>${s.pushRate}%</b></td><td><span class="badge" style="color:${s.typeColor};background:${s.typeColor}15">${s.type}</span></td><td><div style="height:14px;display:flex;border-radius:3px;overflow:hidden">${['early','mid','late','closed'].map(g=>{const v=s[g==='closed'?'lost':g];const w=s.total?pct(g==='closed'?s.lost+cnt(DATA,d=>d.sales===s.name&&CLOSED.includes(d.progress)):v,s.total):0;return w?`<div style="width:${w}%;background:${stageColor(g)}" title="${stageLabel(g)}: ${v}"></div>`:''}).join('')}</div></td></tr>`).join('')}</tbody></table></div></div></div>

    <div class="grid g2" style="margin-top:12px">
        <div class="panel"><div class="panel-h"><span class="panel-t">销售推进能力排名</span><span class="panel-badge">后期+成单占比</span></div><div class="panel-b">
            ${pushAbility.slice(0,8).map((s,i)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px"><span class="rank-num ${i<3?'rank-'+(i+1):''}">${i+1}</span><div style="width:55px;font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.name)}</div><div style="flex:1;height:20px;background:var(--surface3);border-radius:4px;overflow:hidden"><div style="height:100%;width:${s.pushRate}%;background:${s.pushRate>=50?'var(--green)':'var(--orange)'};border-radius:4px;display:flex;align-items:center;padding-left:6px"><span style="font-size:9px;font-weight:700;color:#fff">${s.pushRate}%</span></div></div><div style="min-width:70px;text-align:right;font-size:10px"><span style="font-weight:700">${s.late+s.won}</span>/${s.total} · <span class="badge" style="color:${s.typeColor};background:${s.typeColor}15;font-size:9px">${s.type}</span></div></div>`).join('')}
        </div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">年度阶段趋势</span></div><div class="panel-b np"><div class="tscroll"><table class="tbl"><thead><tr><th>${t('year')}</th><th class="n">前期</th><th class="n">中期</th><th class="n">后期</th><th class="n">关闭</th><th class="n">${t('total')}</th><th style="width:140px">结构</th></tr></thead>
            <tbody>${years.map(y=>{const e=cnt(DATA,d=>d.year===y&&EARLY.includes(d.progress));const m=cnt(DATA,d=>d.year===y&&MID.includes(d.progress));const l=cnt(DATA,d=>d.year===y&&LATE.includes(d.progress));const c=cnt(DATA,d=>d.year===y&&CLOSED.includes(d.progress));const tot=e+m+l+c;return`<tr><td style="font-weight:700">${y}</td><td class="n" style="color:var(--blue)">${e}</td><td class="n" style="color:var(--purple)">${m}</td><td class="n" style="color:var(--green)">${l}</td><td class="n">${c}</td><td class="n" style="font-weight:700">${tot}</td><td><div style="height:14px;display:flex;border-radius:3px;overflow:hidden">${[['early',e],['mid',m],['late',l],['closed',c]].map(([g,v])=>v?`<div style="width:${pct(v,tot)}%;background:${stageColor(g)}" title="${stageLabel(g)}: ${v}"></div>`:'').join('')}</div></td></tr>`}).join('')}</tbody></table></div></div></div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
// VIEW 3: 渠道结构分析 (Channel Structure)
// ════════════════════════════════════════════════════════════
function vChannelROI(){
    const T=DATA.length;
    const chGrp=grp(DATA,'channel');
    const channels=Object.entries(chGrp).sort((a,b)=>b[1]-a[1]);
    const sList=[...new Set(DATA.map(d=>d.scenario).filter(Boolean))].sort();
    const years=[...new Set(DATA.map(d=>d.year).filter(Boolean))].sort();

    // ── 1. 渠道集中度 ──
    const chHHI=hhi(channels.map(([,v])=>v));
    const top3=channels.slice(0,3);
    const top3Sum=top3.reduce((a,[,v])=>a+v,0);
    const top3Pct=T?pct(top3Sum,T):0;

    // Cumulative concentration (Pareto)
    let cumSum=0;
    const pareto=channels.map(([ch,v],i)=>{cumSum+=v;return{ch,v,cum:cumSum,cumPct:pct(cumSum,T),idx:i+1}});
    const p80=pareto.find(p=>p.cumPct>=80);

    // ── 2. 渠道 × 阶段质量 ──
    const topCh=channels.slice(0,12).map(([c])=>c);
    const chStage={};topCh.forEach(ch=>{
        const items=DATA.filter(d=>d.channel===ch);
        const tot=items.length;
        const early=items.filter(d=>EARLY.includes(d.progress)).length;
        const mid=items.filter(d=>MID.includes(d.progress)).length;
        const late=items.filter(d=>LATE.includes(d.progress)).length;
        const won=items.filter(isWon).length;
        const lost=items.filter(isLost).length;
        const wr=tot?pct(won,tot):0;
        const quality=tot?pct(late+won,tot):0; // late+won ratio
        chStage[ch]={tot,early,mid,late,won,lost,wr,quality,earlyPct:tot?pct(early,tot):0};
    });

    // Sort by quality
    const chByQuality=[...topCh].sort((a,b)=>chStage[b].quality-chStage[a].quality);

    // ── 3. 渠道 × 场景 ──
    const csMatrix={};topCh.forEach(ch=>{csMatrix[ch]={};sList.forEach(s=>{csMatrix[ch][s]=cnt(DATA,d=>d.channel===ch&&d.scenario===s)})});
    const chScenarioCount={};topCh.forEach(ch=>{chScenarioCount[ch]=sList.filter(s=>csMatrix[ch][s]>0).length});

    // ── 4. 渠道年度趋势 ──
    const chYr={};topCh.forEach(ch=>{chYr[ch]={};years.forEach(y=>{chYr[ch][y]=cnt(DATA,d=>d.channel===ch&&d.year===y)})});
    const chGrowth={};topCh.forEach(ch=>{
        if(years.length>=2){
            const prev=chYr[ch][years[years.length-2]]||0;
            const curr=chYr[ch][years[years.length-1]]||0;
            chGrowth[ch]=prev?Math.round((curr-prev)/prev*100):(curr>0?999:0);
        }else chGrowth[ch]=0;
    });

    // Classify channels
    const chClass={};topCh.forEach(ch=>{
        const q=chStage[ch].quality;
        const ep=chStage[ch].earlyPct;
        if(q>=50)chClass[ch]={label:'优质渠道',color:'var(--green)'};
        else if(ep>=60)chClass[ch]={label:'线索型渠道',color:'var(--orange)'};
        else chClass[ch]={label:'均衡渠道',color:'var(--blue)'};
    });

    return`
    <div class="kpi-row c5">
        <div class="kpi kpi-gold"><div class="kpi-top"><span class="kpi-label">渠道数</span></div><div class="kpi-val gold-num">${channels.length}</div><div class="kpi-sub">${T} 个项目</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">HHI集中度</span></div><div class="kpi-val" style="color:${chHHI>2500?'var(--red)':chHHI>1500?'var(--orange)':'var(--green)'}">${chHHI}</div><div class="kpi-sub">${chHHI>2500?'高度集中 ⚠':'中度集中'}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">Top3占比</span></div><div class="kpi-val" style="color:${top3Pct>70?'var(--red)':'var(--orange)'}">${top3Pct}%</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${top3Pct}%;background:var(--orange)"></div></div><div class="kpi-sub">${top3.map(([c])=>c).join(', ')}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">80%项目需</span></div><div class="kpi-val" style="color:var(--purple)">${p80?p80.idx:'-'}</div><div class="kpi-sub">个渠道 (共${channels.length})</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">单渠道最高</span></div><div class="kpi-val" style="color:var(--blue)">${channels[0]?channels[0][1]:0}</div><div class="kpi-sub">${channels[0]?channels[0][0]:'-'} (${channels[0]?pct(channels[0][1],T):0}%)</div></div>
    </div>

    <div class="grid g2">
        <div class="panel panel-gold"><div class="panel-h"><span class="panel-t">渠道集中度曲线 (Pareto)</span><span class="panel-badge">前${p80?p80.idx:'-'}个渠道贡献80%项目</span></div><div class="panel-b">
            ${pareto.slice(0,15).map((p,i)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><div style="width:15px;font-size:9px;color:var(--text3);text-align:right">${p.idx}</div><div style="width:65px;font-size:10.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.ch)}</div><div style="flex:1;height:16px;background:var(--surface3);border-radius:3px;overflow:hidden;position:relative"><div style="height:100%;width:${pct(p.v,T)}%;background:var(--accent);border-radius:3px;display:flex;align-items:center;padding-left:4px"><span style="font-size:8px;font-weight:700;color:#fff">${p.v}</span></div></div><div style="min-width:55px;text-align:right;font-size:10px"><span style="font-weight:700">${p.cumPct}%</span> <span style="color:var(--text3)">累计</span></div></div>`).join('')}
            ${channels.length>15?`<div style="font-size:10px;color:var(--text3);margin-top:6px;text-align:center">...另有 ${channels.length-15} 个渠道</div>`:''}
        </div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">渠道风险评估</span></div><div class="panel-b">
            ${alertCard(top3Pct>70?'danger':'warning','集中度风险',`Top3渠道(${top3.map(([c])=>c).join('、')})贡献${top3Pct}%项目。${top3Pct>70?'如任一渠道流失，业务将受严重冲击':'集中度中等，但需培育新渠道'}。HHI=${chHHI}`)}
            ${alertCard('info','渠道质量分层',topCh.slice(0,6).map(ch=>`<b>${ch}</b>: ${chClass[ch].label}(后期占${chStage[ch].quality}%，成单率${chStage[ch].wr}%)`).join('<br>'))}
            <div class="gold-line"></div>
            <div style="font-size:9.5px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">渠道分类</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">${topCh.map(ch=>`<span class="badge" style="color:${chClass[ch].color};background:${chClass[ch].color}12;border:1px solid ${chClass[ch].color}30">${esc(ch)} · ${chClass[ch].label}</span>`).join('')}</div>
        </div></div>
    </div>

    <div class="panel" style="margin-top:12px"><div class="panel-h"><span class="panel-t">渠道 × 阶段质量矩阵</span><span class="panel-badge">哪些渠道"只带垃圾线索"？哪些"直接带成交"？</span></div><div class="panel-b np"><div class="tscroll" style="max-height:400px"><table class="tbl"><thead><tr><th>渠道</th><th class="n">总数</th><th class="n">前期</th><th class="n">中期</th><th class="n">后期</th><th class="n">成单</th><th class="n">丢标</th><th class="n">成单率</th><th class="n">质量分</th><th>分类</th><th style="width:140px">阶段分布</th></tr></thead>
        <tbody>${chByQuality.map(ch=>{const s=chStage[ch];return`<tr onclick="goFilter('channel','${esc(ch)}')"><td style="font-weight:600">${esc(ch)}</td><td class="n">${s.tot}</td><td class="n" style="color:var(--blue)">${s.early}</td><td class="n" style="color:var(--purple)">${s.mid}</td><td class="n" style="color:var(--green)">${s.late}</td><td class="n" style="color:var(--green);font-weight:700">${s.won}</td><td class="n" style="color:var(--red)">${s.lost}</td><td class="n" style="color:${s.wr>=50?'var(--green)':'var(--text2)'}">${s.wr}%</td><td class="n gold-num">${s.quality}%</td><td><span class="badge" style="color:${chClass[ch].color};background:${chClass[ch].color}12">${chClass[ch].label}</span></td><td><div style="height:14px;display:flex;border-radius:3px;overflow:hidden">${[['early',s.early],['mid',s.mid],['late',s.late],['closed',s.lost]].map(([g,v])=>v?`<div style="width:${pct(v,s.tot)}%;background:${stageColor(g)}" title="${stageLabel(g)}: ${v}"></div>`:'').join('')}</div></td></tr>`}).join('')}</tbody></table></div></div></div>

    <div class="grid g2" style="margin-top:12px">
        <div class="panel"><div class="panel-h"><span class="panel-t">渠道 × 场景能力标签</span><span class="panel-badge">不是所有渠道都能卖所有产品</span></div><div class="panel-b np"><div class="tscroll" style="max-height:340px"><table class="tbl"><thead><tr><th>渠道</th>${sList.map(s=>`<th class="n">${s}</th>`).join('')}<th class="n">覆盖</th></tr></thead>
            <tbody>${topCh.map(ch=>{const row=sList.map(s=>csMatrix[ch][s]);return`<tr><td style="font-weight:600">${esc(ch)}</td>${row.map(v=>`<td class="n"><span class="hcell" style="background:${v?'var(--accent-bg)':'transparent'};color:${v?'var(--accent)':'var(--text3)'}">${v||'-'}</span></td>`).join('')}<td class="n" style="font-weight:700">${chScenarioCount[ch]}/${sList.length}</td></tr>`}).join('')}</tbody></table></div></div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">渠道年度趋势</span><span class="panel-badge">增长 vs 下降</span></div><div class="panel-b np"><div class="tscroll" style="max-height:340px"><table class="tbl"><thead><tr><th>渠道</th>${years.map(y=>`<th class="n">${y}</th>`).join('')}<th class="n">YoY</th><th style="width:100px">${t('trend')}</th></tr></thead>
            <tbody>${topCh.map(ch=>{const g=chGrowth[ch];return`<tr><td style="font-weight:600">${esc(ch)}</td>${years.map(y=>`<td class="n"><span class="hcell" style="background:${chYr[ch][y]?'var(--accent-bg)':'transparent'}">${chYr[ch][y]||'-'}</span></td>`).join('')}<td class="n" style="color:${g>0?'var(--green)':g<0?'var(--red)':'var(--text3)'}"><b>${g===999?'NEW':g>0?'+'+g+'%':g+'%'}</b></td><td><div style="height:10px;display:flex;gap:1px;align-items:flex-end;border-radius:2px">${years.map(y=>{const v=chYr[ch][y]||0;const max=Math.max(...years.map(y=>chYr[ch][y]||0),1);return`<div style="flex:1;height:${Math.max(v/max*10,1)}px;background:var(--accent);border-radius:1px"></div>`}).join('')}</div></td></tr>`}).join('')}</tbody></table></div></div></div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
// VIEW 4: 产品 & 售前 & 交付 (Product + PreSales + Delivery)
// ════════════════════════════════════════════════════════════
function vPMFit(){
    const T=DATA.length;
    const sList=[...new Set(DATA.map(d=>d.scenario).filter(Boolean))].sort();
    const years=[...new Set(DATA.map(d=>d.year).filter(Boolean))].sort();

    // ═══ SECTION A: 售前资源分析 ═══
    const seGrp=grp(DATA,'salesEngineer');
    const seList=Object.entries(seGrp).sort((a,b)=>b[1]-a[1]).map(([s])=>s);
    const seStats={};seList.forEach(s=>{
        const items=DATA.filter(d=>d.salesEngineer===s);
        const scenarios=[...new Set(items.map(d=>d.scenario).filter(Boolean))];
        const cuItems=items.filter(d=>d.customization==='〇');
        const multiHW=items.filter(d=>d.hardware2).length;
        const complexity=cuItems.length+multiHW; // proxy for complex projects
        seStats[s]={total:items.length,scenarios,cuCount:cuItems.length,cuRate:items.length?pct(cuItems.length,items.length):0,multiHW,complexity,won:items.filter(isWon).length,wr:items.length?pct(items.filter(isWon).length,items.length):0};
    });

    // ═══ SECTION B: 技术复杂度 proxy ═══
    // High: customization + multi-hardware
    // Medium: customization OR multi-hardware
    // Low: standard
    const complexHigh=cnt(DATA,d=>d.customization==='〇'&&d.hardware2);
    const complexMid=cnt(DATA,d=>(d.customization==='〇'||d.hardware2)&&!(d.customization==='〇'&&d.hardware2));
    const complexLow=T-complexHigh-complexMid;

    // Complexity by scenario
    const scComplex={};sList.forEach(s=>{
        const items=DATA.filter(d=>d.scenario===s);
        const cu=items.filter(d=>d.customization==='〇').length;
        const mh=items.filter(d=>d.hardware2).length;
        scComplex[s]={total:items.length,cu,mh,cuRate:items.length?pct(cu,items.length):0};
    });

    // ═══ SECTION C: 场景复用能力 ═══
    const scHHI=hhi(sList.map(s=>cnt(DATA,d=>d.scenario===s)));
    const scEntries=Object.entries(grp(DATA,'scenario')).sort((a,b)=>b[1]-a[1]);
    const isProjectBased=scHHI<2000&&sList.length>4; // dispersed = project-based

    // Scenario × year trend
    const scYr={};sList.forEach(s=>{scYr[s]={};years.forEach(y=>{scYr[s][y]=cnt(DATA,d=>d.scenario===s&&d.year===y)})});

    // ═══ SECTION D: 产品结构 ═══
    const hwGrp=grp(DATA,'hardware1');
    const topHW=topN(hwGrp,12);
    const hwMoving=topHW.filter(([,v])=>v>=3); // active models
    const hwDead=topHW.filter(([,v])=>v<3); // barely used

    // Software attachment
    const swCount=cnt(DATA,d=>d.software);
    const swRate=T?pct(swCount,T):0;
    const swGrp=grp(DATA.filter(d=>d.software),'software');
    const topSW=topN(swGrp,5);

    // ═══ SECTION E: 交付风险 ═══
    const lateStage=DATA.filter(d=>LATE.includes(d.progress)||d.progress==='10-项目移交');

    // 已后期但无installation
    const lateNoInst=lateStage.filter(d=>!d.installation);
    // 已后期但无projectStatus
    const lateNoStatus=lateStage.filter(d=>!d.projectStatus);

    // "假成熟项目": late stage + no installation + no status update
    const fakeMatured=DATA.filter(d=>LATE.includes(d.progress)&&!d.installation&&!d.projectStatus);

    // Installation breakdown
    const instGrp=grp(DATA.filter(d=>d.installation),'installation');
    const instEntries=Object.entries(instGrp).sort((a,b)=>b[1]-a[1]);
    const instTotal=instEntries.reduce((a,[,v])=>a+v,0);

    // AcceptProb
    const probGrp={};DATA.filter(d=>d.acceptProb!=null&&d.acceptProb!=='').forEach(d=>{const p=String(d.acceptProb);probGrp[p]=(probGrp[p]||0)+1});

    // Region structure
    const regGrp=grp(DATA,'region');
    const regEntries=Object.entries(regGrp).sort((a,b)=>b[1]-a[1]);
    const regHHI=hhi(regEntries.map(([,v])=>v));
    const topRegs=regEntries.slice(0,10);

    return`
    <div class="kpi-row c6">
        <div class="kpi kpi-gold"><div class="kpi-top"><span class="kpi-label">售前人数</span></div><div class="kpi-val gold-num">${seList.length}</div><div class="kpi-sub">人均 ${seList.length?(T/seList.length).toFixed(0):'0'} 项目</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">高复杂项目</span></div><div class="kpi-val" style="color:var(--red)">${complexHigh}</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${pct(complexHigh,T)}%;background:var(--red)"></div></div><div class="kpi-sub">定制+双硬件</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">场景HHI</span></div><div class="kpi-val" style="color:${scHHI>4000?'var(--orange)':'var(--blue)'}">${scHHI}</div><div class="kpi-sub">${scHHI>4000?'高集中':'多元分布'}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">硬件型号</span></div><div class="kpi-val" style="color:var(--purple)">${Object.keys(hwGrp).length}</div><div class="kpi-sub">${hwMoving.length}活跃 · ${hwDead.length}低频</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">假成熟项目</span></div><div class="kpi-val" style="color:${fakeMatured.length>0?'var(--red)':'var(--green)'}">${fakeMatured.length}</div><div class="kpi-sub">后期无据付无状态</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">软件搭载率</span></div><div class="kpi-val" style="color:var(--cyan)">${swRate}%</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${swRate}%;background:var(--cyan)"></div></div><div class="kpi-sub">${swCount} / ${T}</div></div>
    </div>

    <div class="panel panel-gold"><div class="panel-h"><span class="panel-t">售前工程师资源分布</span><span class="panel-badge">是否存在关键人依赖？</span></div><div class="panel-b np"><div class="tscroll"><table class="tbl"><thead><tr><th>售前</th><th class="n">项目数</th><th class="n">占比</th><th class="n">成单</th><th class="n">成单率</th><th class="n">定制化</th><th class="n">双硬件</th><th class="n">复杂度</th><th>覆盖场景</th></tr></thead>
        <tbody>${seList.map((s,i)=>{const d=seStats[s];return`<tr><td><span class="rank-num ${i<3?'rank-'+(i+1):''}" style="margin-right:4px">${i+1}</span><b>${esc(s)}</b></td><td class="n">${d.total}</td><td class="n" style="color:${pct(d.total,T)>40?'var(--red)':'var(--text2)'}">${pct(d.total,T)}%</td><td class="n" style="color:var(--green)">${d.won}</td><td class="n" style="color:${d.wr>=50?'var(--green)':'var(--text2)'}">${d.wr}%</td><td class="n">${d.cuCount} (${d.cuRate}%)</td><td class="n">${d.multiHW}</td><td class="n" style="font-weight:700;color:${d.complexity>10?'var(--red)':'var(--text2)'}">${d.complexity}</td><td style="font-size:10px">${d.scenarios.map(sc=>`<span class="badge b-accent" style="margin:1px">${sc}</span>`).join('')}</td></tr>`}).join('')}</tbody></table></div>
        ${seList.length&&pct(seStats[seList[0]].total,T)>40?`<div style="padding:10px 16px">${alertCard('warning','关键人依赖风险',`${seList[0]} 承担 ${pct(seStats[seList[0]].total,T)}% 项目(${seStats[seList[0]].total}件)，且复杂度指数${seStats[seList[0]].complexity}。该SE离职或超负荷将直接冲击业务。`)}</div>`:''}
    </div></div>

    <div class="grid g3" style="margin-top:12px">
        <div class="panel"><div class="panel-h"><span class="panel-t">技术复杂度分布</span></div><div class="panel-b">
            ${[['高: 定制+双硬件',complexHigh,'var(--red)'],['中: 定制或双硬件',complexMid,'var(--orange)'],['低: 标准配置',complexLow,'var(--green)']].map(([lbl,v,c])=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:100px;font-size:11px;color:var(--text2)">${lbl}</div><div style="flex:1;height:20px;background:var(--surface3);border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct(v,T)}%;background:${c};border-radius:4px;display:flex;align-items:center;padding-left:6px"><span style="font-size:9px;font-weight:700;color:#fff">${v}</span></div></div><div style="min-width:35px;text-align:right;font-size:11px;font-weight:700">${pct(v,T)}%</div></div>`).join('')}
            <div class="gold-line"></div>
            <div style="font-size:9.5px;font-weight:600;color:var(--text3);margin-bottom:6px">按场景复杂度</div>
            ${sList.map(s=>{const d=scComplex[s];return`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><div style="width:45px;font-size:11px;font-weight:600">${s}</div><div style="flex:1;height:14px;background:var(--surface3);border-radius:3px;overflow:hidden"><div style="height:100%;width:${d.cuRate}%;background:var(--purple);border-radius:3px"></div></div><div style="min-width:55px;text-align:right;font-size:10px">${d.cuRate}% <span style="color:var(--text3)">(${d.cu})</span></div></div>`}).join('')}
        </div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">场景复用分析</span></div><div class="panel-b">
            ${mkDonut(scEntries.slice(0,6),90)}
            <div style="margin-top:10px">${alertCard(isProjectBased?'warning':'info',isProjectBased?'偏项目制':'场景较集中',isProjectBased?`${sList.length}个场景，HHI=${scHHI}，分散度较高。<br>风险: 难以形成可复制解决方案，资源分散`:`主力场景 ${scEntries[0][0]} 占${pct(scEntries[0][1],T)}%，有一定产品化基础`)}</div>
            <div class="gold-line"></div>
            <div style="font-size:9.5px;font-weight:600;color:var(--text3);margin-bottom:6px">场景年度趋势</div>
            <table class="tbl" style="font-size:11px"><thead><tr><th>场景</th>${years.map(y=>`<th class="n">${y}</th>`).join('')}</tr></thead>
            <tbody>${sList.map(s=>`<tr><td style="font-weight:600">${s}</td>${years.map(y=>`<td class="n"><span class="hcell" style="background:${scYr[s][y]?'var(--accent-bg)':'transparent'}">${scYr[s][y]||'-'}</span></td>`).join('')}</tr>`).join('')}</tbody></table>
        </div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">交付风险检测</span></div><div class="panel-b">
            ${(()=>{const fakeList=fakeMatured.slice(0,5).map(d=>'· '+esc(d.crmNo||'')+' '+esc(d.endUser||'')+' ('+PS(d.progress)+')').join('<br>');return alertCard(fakeMatured.length>0?'danger':'success','假成熟项目: '+fakeMatured.length+'件',fakeMatured.length?'以下项目阶段≥合同谈判但无据付计划且无状态更新:<br>'+fakeList+(fakeMatured.length>5?'<br>...等':''):'所有后期项目均有据付或状态记录')})()}
            ${alertCard(lateNoInst.length>0?'warning':'success','后期无据付: '+lateNoInst.length+'件',lateNoInst.length?'已进入后期阶段但installation字段为空，交付规划可能缺失':'后期项目据付信息完整')}
            <div class="gold-line"></div>
            <div style="font-size:9.5px;font-weight:600;color:var(--text3);margin-bottom:6px">据付状态分布</div>
            ${instEntries.map(([k,v])=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div style="width:55px;font-size:11px">${esc(k)}</div><div style="flex:1;height:16px;background:var(--surface3);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct(v,instTotal)}%;background:${k==='完了'?'var(--green)':k==='必要なし'?'var(--blue)':'var(--orange)'};border-radius:3px"></div></div><div style="min-width:24px;text-align:right;font-size:11px;font-weight:700">${v}</div></div>`).join('')}
            <div class="gold-line"></div>
            <div style="font-size:9.5px;font-weight:600;color:var(--text3);margin-bottom:6px">验收概率分布</div>
            ${Object.entries(probGrp).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div style="width:35px;font-size:11px;font-weight:600;color:${k==='1'?'var(--green)':k==='0.3'?'var(--orange)':'var(--red)'}">${k==='1'?'100%':k==='0.3'?'30%':'0%'}</div><div style="flex:1;height:16px;background:var(--surface3);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct(v,Object.values(probGrp).reduce((a,b)=>a+b,0))}%;background:${k==='1'?'var(--green)':k==='0.3'?'var(--orange)':'var(--red)'};border-radius:3px"></div></div><div style="min-width:24px;text-align:right;font-size:11px;font-weight:700">${v}</div></div>`).join('')}
        </div></div>
    </div>

    <div class="grid g2" style="margin-top:12px">
        <div class="panel"><div class="panel-h"><span class="panel-t">产品结构: 硬件排名</span><span class="panel-badge">${hwMoving.length} 活跃 / ${hwDead.length} 低频</span></div><div class="panel-b">
            ${topHW.map(([h,v],i)=>`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><span class="rank-num ${i<3?'rank-'+(i+1):''}" style="font-size:9px">${i+1}</span><div style="flex:1;font-size:10.5px;font-weight:${v>=5?600:400};color:${v<3?'var(--text3)':'var(--text)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(h)}</div><div style="width:80px;height:14px;background:var(--surface3);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct(v,topHW[0][1])}%;background:${v>=5?'var(--accent)':'var(--text3)'};border-radius:3px"></div></div><span style="min-width:24px;text-align:right;font-weight:700;font-size:11px">${v}</span></div>`).join('')}
            <div class="gold-line"></div>
            <div style="font-size:9.5px;font-weight:600;color:var(--text3);margin-bottom:6px">软件搭载</div>
            ${topSW.length?topSW.map(([k,v],i)=>`<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span class="rank-num ${i<3?'rank-'+(i+1):''}" style="font-size:9px">${i+1}</span><div style="flex:1;font-size:11px">${esc(k)}</div><span style="font-weight:700">${v}</span></div>`).join(''):`<div style="color:var(--text3);font-size:11px">${t('no_data')}</div>`}
        </div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">区域结构</span><span class="panel-badge">HHI: ${regHHI}</span></div><div class="panel-b">
            ${topRegs.map(([r,v],i)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div style="width:70px;font-size:10.5px;color:var(--text2);text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r)}</div><div style="flex:1;height:18px;background:var(--surface3);border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct(v,topRegs[0][1])}%;background:${C[i%C.length]};border-radius:4px;display:flex;align-items:center;padding-left:5px"><span style="font-size:8.5px;font-weight:700;color:#fff">${v}</span></div></div><div style="min-width:35px;text-align:right;font-size:10.5px;font-weight:700">${pct(v,T)}%</div></div>`).join('')}
            ${regEntries.length>10?`<div style="font-size:10px;color:var(--text3);margin-top:6px">...另有 ${regEntries.length-10} 个地域</div>`:''}
            ${alertCard(regHHI>3000?'warning':'info','区域集中度: '+(regHHI>3000?'偏高':'适中'),regHHI>3000?`项目过度集中在${topRegs[0][0]}等少数区域。建议: 评估潜力区域拓展机会`:'区域分布较健康，继续保持多区域覆盖')}
        </div></div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
// VIEW 6: 决策看板 (Decision Board)
// ════════════════════════════════════════════════════════════
function vDecisions(){
    const T=DATA.length;
    const years=[...new Set(DATA.map(d=>d.year).filter(Boolean))].sort();
    const prevY=years.length>=2?years[years.length-2]:years[0];
    const currY=years[years.length-1];
    const sList=[...new Set(DATA.map(d=>d.scenario).filter(Boolean))].sort();

    // ═══ AARRR Funnel (B2B Adapted) ═══
    // Acquisition: total projects entering pipeline
    const acquired=T;
    // Activation: projects moving past early stage
    const activated=cnt(DATA,d=>!EARLY.includes(d.progress));
    // Revenue: won projects
    const revenue=cnt(DATA,isWon);
    // Retention: repeat customers (>1 project)
    const userFreq={};DATA.forEach(d=>{if(d.endUser)userFreq[d.endUser]=(userFreq[d.endUser]||0)+1});
    const totalUsers=Object.keys(userFreq).length;
    const retainedUsers=Object.values(userFreq).filter(v=>v>1).length;
    const retention=totalUsers?pct(retainedUsers,totalUsers):0;
    // Referral proxy: channel-introduced projects (multi-channel users = word of mouth proxy)
    const userCh={};DATA.forEach(d=>{if(d.endUser&&d.channel){if(!userCh[d.endUser])userCh[d.endUser]=new Set();userCh[d.endUser].add(d.channel)}});
    const multiChUsers=Object.values(userCh).filter(s=>s.size>1).length;
    const referralRate=totalUsers?pct(multiChUsers,totalUsers):0;

    const aarrr=[
        {stage:'Acquisition',label:'获客',value:acquired,sub:'进入管线项目数',rate:100,color:'var(--blue)'},
        {stage:'Activation',label:'激活',value:activated,sub:'推进至中期+',rate:pct(activated,acquired),color:'var(--purple)'},
        {stage:'Revenue',label:'变现',value:revenue,sub:'成单项目',rate:pct(revenue,acquired),color:'var(--green)'},
        {stage:'Retention',label:'留存',value:retainedUsers,sub:'复购客户数',rate:retention,color:'var(--orange)'},
        {stage:'Referral',label:'推荐',value:multiChUsers,sub:'多渠道客户(proxy)',rate:referralRate,color:'var(--pink)'}
    ];

    // ═══ Porter's Five Forces (Qualitative from data signals) ═══
    const chHHI=hhi(Object.values(grp(DATA,'channel')));
    const custHHI=hhi(Object.values(userFreq));
    const scHHI=hhi(Object.values(grp(DATA,'scenario')));
    const hwModels=Object.keys(grp(DATA,'hardware1')).length;
    const cuRate=T?pct(cnt(DATA,d=>d.customization==='〇'),T):0;
    const lostRate=T?pct(cnt(DATA,isLost),T):0;

    const forces=[
        {name:'渠道议价权',score:chHHI>2000?8:chHHI>1000?5:3,
         signal:'渠道HHI='+chHHI,
         detail:chHHI>2000?'高集中→渠道话语权强':'渠道分散→议价权适中',
         color:chHHI>2000?'var(--red)':'var(--green)'},
        {name:'客户议价权',score:custHHI>500?3:custHHI>200?5:7,
         signal:'客户HHI='+custHHI,
         detail:custHHI>500?'客户分散→单客议价权弱':'大客户集中→议价权强',
         color:custHHI>500?'var(--green)':'var(--orange)'},
        {name:'替代品威胁',score:cuRate>30?3:cuRate>15?5:7,
         signal:'定制化率='+cuRate+'%',
         detail:cuRate>30?'高定制=强壁垒→替代难':'标准化高→易被替代',
         color:cuRate>30?'var(--green)':'var(--red)'},
        {name:'新进入者威胁',score:hwModels>15?4:hwModels>8?6:8,
         signal:hwModels+'个硬件型号',
         detail:hwModels>15?'产品线宽→进入门槛高':'产品线窄→门槛适中',
         color:hwModels>15?'var(--green)':'var(--orange)'},
        {name:'行业竞争',score:lostRate>10?8:lostRate>5?5:3,
         signal:'丢标率='+lostRate+'%',
         detail:lostRate>10?'高丢标→竞争激烈':'丢标率低→竞争可控',
         color:lostRate>10?'var(--red)':'var(--green)'}
    ];

    // ═══ 3C Analysis ═══
    // Company
    const winRate=T?pct(cnt(DATA,isWon),T):0;
    const activeRate=T?pct(cnt(DATA,isActive),T):0;
    const totalQty=DATA.filter(d=>d.qty1).reduce((a,d)=>a+pQty(d.qty1),0);
    // Customer
    const topCustomers=topN(userFreq,5);
    const custConc=T?pct(topCustomers.reduce((a,[,v])=>a+v,0),T):0;
    // Competitor (proxy from loss data)
    const lostD=DATA.filter(isLost);
    const lostByScenario=topN(grp(lostD,'scenario'),5);

    // ═══ Strategic Decisions Summary ═══
    const decisions=[];

    // Scenario decisions
    sList.forEach(s=>{
        const n=cnt(DATA,d=>d.scenario===s);
        const prev=cnt(DATA,d=>d.scenario===s&&d.year===prevY);
        const curr=cnt(DATA,d=>d.scenario===s&&d.year===currY);
        const growth=prev?(curr-prev)/prev*100:(curr>0?100:0);
        const wr=n?pct(DATA.filter(d=>d.scenario===s).filter(isWon).length,n):0;
        let action,level;
        if(wr>=50&&growth>=0){action='加大投入';level='invest'}
        else if(wr>=30&&n>=10){action='维持投入';level='hold'}
        else if(growth<-20){action='评估收缩';level='divest'}
        else{action='选择性投入';level='selective'}
        decisions.push({dim:'场景',name:s,n,growth:Math.round(growth),wr,action,level});
    });

    // Channel decisions (top 8)
    const chEntries=Object.entries(grp(DATA,'channel')).sort((a,b)=>b[1]-a[1]).slice(0,8);
    chEntries.forEach(([ch,n])=>{
        const prev=cnt(DATA,d=>d.channel===ch&&d.year===prevY);
        const curr=cnt(DATA,d=>d.channel===ch&&d.year===currY);
        const growth=prev?(curr-prev)/prev*100:(curr>0?100:0);
        const wr=n?pct(DATA.filter(d=>d.channel===ch).filter(isWon).length,n):0;
        const quality=n?pct(DATA.filter(d=>d.channel===ch&&LATE.includes(d.progress)).length+DATA.filter(d=>d.channel===ch).filter(isWon).length,n):0;
        let action,level;
        if(wr>=50&&quality>=40){action='战略伙伴';level='invest'}
        else if(n>=10&&wr>=20){action='维持合作';level='hold'}
        else if(quality<20&&n<10){action='评估淘汰';level='divest'}
        else{action='重点培育';level='selective'}
        decisions.push({dim:'渠道',name:ch,n,growth:Math.round(growth),wr,action,level});
    });

    const levelColor={invest:'var(--green)',hold:'var(--blue)',selective:'var(--orange)',divest:'var(--red)'};
    const levelBg={invest:'var(--green-bg)',hold:'var(--blue-bg)',selective:'var(--orange-bg)',divest:'var(--red-bg)'};

    return`
    <div class="kpi-row c5">
        <div class="kpi kpi-gold"><div class="kpi-top"><span class="kpi-label">成单率</span></div><div class="kpi-val gold-num">${winRate}%</div><div class="kpi-sub">${cnt(DATA,isWon)} / ${T}</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">激活率</span></div><div class="kpi-val" style="color:var(--purple)">${pct(activated,acquired)}%</div><div class="kpi-sub">推进至中期+</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">客户留存</span></div><div class="kpi-val" style="color:var(--orange)">${retention}%</div><div class="kpi-sub">${retainedUsers} / ${totalUsers} 复购</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">竞争压力</span></div><div class="kpi-val" style="color:${lostRate>10?'var(--red)':'var(--green)'}">${lostRate}%</div><div class="kpi-sub">丢标率</div></div>
        <div class="kpi"><div class="kpi-top"><span class="kpi-label">总出货</span></div><div class="kpi-val" style="color:var(--cyan)">${totalQty}</div><div class="kpi-sub">台 (HW1)</div></div>
    </div>

    <div class="grid g2">
        <div class="panel panel-gold"><div class="panel-h"><span class="panel-t">AARRR 漏斗 (B2B适配)</span></div><div class="panel-b">
            ${aarrr.map((a,i)=>{const w=i===0?100:a.rate;return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><div style="width:60px;text-align:right"><div style="font-size:10px;font-weight:700;color:${a.color}">${a.stage}</div><div style="font-size:8px;color:var(--text3)">${a.label}</div></div><div style="flex:1"><div style="height:32px;background:var(--surface3);border-radius:6px;overflow:hidden;display:flex;justify-content:center"><div style="height:100%;width:${Math.max(w,5)}%;background:${a.color};border-radius:6px;display:flex;align-items:center;justify-content:center;transition:width .5s"><span style="font-size:11px;font-weight:800;color:#fff">${a.value}</span></div></div></div><div style="min-width:40px;text-align:right"><div style="font-size:14px;font-weight:800;color:${a.color}">${a.rate}%</div><div style="font-size:8px;color:var(--text3)">${a.sub}</div></div></div>`}).join('')}
            <div style="margin-top:6px;font-size:10px;color:var(--text3);text-align:center">Acquisition → Activation → Revenue → Retention → Referral</div>
        </div></div>
        <div class="panel"><div class="panel-h"><span class="panel-t">Porter五力模型</span><span class="panel-badge">数据信号推断</span></div><div class="panel-b">
            <div style="position:relative;width:100%;padding:20px 0">
                ${forces.map((f,i)=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:8px 12px;background:var(--surface2);border-radius:8px;border-left:3px solid ${f.color}"><div style="flex:1"><div style="font-size:12px;font-weight:700">${f.name}</div><div style="font-size:10px;color:var(--text3)">${f.signal} → ${f.detail}</div></div><div style="text-align:right"><div style="font-size:20px;font-weight:800;color:${f.color}">${f.score}/10</div><div style="font-size:9px;color:var(--text3)">${f.score>=7?'高威胁':f.score>=4?'中等':'低威胁'}</div></div><div style="width:60px;height:6px;background:var(--surface3);border-radius:3px;overflow:hidden"><div style="height:100%;width:${f.score*10}%;background:${f.color};border-radius:3px"></div></div></div>`).join('')}
            </div>
            <div style="padding:8px 12px;background:var(--surface2);border-radius:8px;font-size:11px;color:var(--text2)">
                <b>综合评估:</b> ${forces.filter(f=>f.score>=7).length>=2?'竞争环境严峻，需强化差异化壁垒':'竞争环境可控，但需持续关注渠道依赖风险'}
            </div>
        </div></div>
    </div>

    <div class="panel" style="margin-top:12px"><div class="panel-h"><span class="panel-t">3C分析: Company × Customer × Competitor</span></div><div class="panel-b">
        <div class="grid g3">
            <div style="padding:12px;background:var(--green-bg);border-radius:8px"><div style="font-size:11px;font-weight:700;color:var(--green);margin-bottom:8px">Company (自社)</div>
                <div style="font-size:10px;color:var(--text2);line-height:1.8">
                    成单率: <b>${winRate}%</b><br>
                    管线活跃率: <b>${activeRate}%</b><br>
                    总出货: <b>${totalQty}台</b><br>
                    硬件型号: <b>${hwModels}</b>个<br>
                    定制化能力: <b>${cuRate}%</b><br>
                    售前团队: <b>${Object.keys(grp(DATA,'salesEngineer')).length}</b>人
                </div>
            </div>
            <div style="padding:12px;background:var(--blue-bg);border-radius:8px"><div style="font-size:11px;font-weight:700;color:var(--blue);margin-bottom:8px">Customer (顧客)</div>
                <div style="font-size:10px;color:var(--text2);line-height:1.8">
                    独立客户: <b>${totalUsers}</b><br>
                    复购率: <b>${retention}%</b><br>
                    Top5集中度: <b>${custConc}%</b><br>
                    覆盖国家: <b>${[...new Set(DATA.map(d=>(d.country||'').trim()).filter(Boolean))].length}</b><br>
                    主力客户: ${topCustomers.slice(0,3).map(([u])=>'<b>'+esc(u)+'</b>').join(', ')}
                </div>
            </div>
            <div style="padding:12px;background:var(--red-bg);border-radius:8px"><div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:8px">Competitor (競合信号)</div>
                <div style="font-size:10px;color:var(--text2);line-height:1.8">
                    丢标项目: <b>${lostD.length}</b>件 (${lostRate}%)<br>
                    丢标场景: ${lostByScenario.map(([s,v])=>'<b>'+s+'</b>('+v+')').join(', ')||'数据不足'}<br>
                    丢标渠道: ${topN(grp(lostD,'channel'),3).map(([c,v])=>'<b>'+esc(c)+'</b>('+v+')').join(', ')||'数据不足'}<br>
                    <span style="color:var(--text3)">注: 无竞品名称数据，仅从丢标模式推断竞争热区</span>
                </div>
            </div>
        </div>
    </div></div>

    <div class="panel" style="margin-top:12px"><div class="panel-h"><span class="panel-t">战略决策汇总: 投 / 不投 / 扩 / 收</span><span class="panel-badge">所有模型收敛为明确结论</span></div><div class="panel-b np"><div class="tscroll" style="max-height:450px"><table class="tbl"><thead><tr><th>维度</th><th>对象</th><th class="n">项目数</th><th class="n">增长率</th><th class="n">成单率</th><th>决策</th><th>依据</th></tr></thead>
        <tbody>${decisions.map(d=>`<tr><td><span class="badge b-gray">${d.dim}</span></td><td style="font-weight:600">${esc(d.name)}</td><td class="n">${d.n}</td><td class="n" style="color:${d.growth>0?'var(--green)':d.growth<0?'var(--red)':'var(--text3)'}">${d.growth>0?'+':''}${d.growth}%</td><td class="n" style="color:${d.wr>=50?'var(--green)':'var(--text2)'}">${d.wr}%</td><td><span class="badge" style="background:${levelBg[d.level]};color:${levelColor[d.level]}">${d.action}</span></td><td style="font-size:10px;color:var(--text3)">${d.level==='invest'?'高成单+正增长→全力':''}${d.level==='hold'?'规模可观→维持现状':''}${d.level==='selective'?'需评估ROI后决定':''}${d.level==='divest'?'低效→减少资源投入':''}</td></tr>`).join('')}</tbody></table></div></div></div>

    <div class="panel" style="margin-top:12px"><div class="panel-h"><span class="panel-t">落地监控指标 (KPI体系建议)</span></div><div class="panel-b">
        <div class="grid g2">
            <div>
                ${alertCard('info','战略层 KPI','· 场景集中度(HHI): 当前 <b>'+hhi(sList.map(s=>cnt(DATA,d=>d.scenario===s)))+'</b> → 目标 <3000<br>· 新市场贡献比: 当前 <b>'+pct(cnt(DATA,d=>!new Set(DATA.filter(dd=>dd.year===years[0]).map(dd=>(dd.country||'').trim())).has((d.country||'').trim())&&d.year>years[0]),T)+'%</b><br>· 产品线宽度: <b>'+Object.keys(grp(DATA,'hardware1')).length+'</b>个型号')}
                ${alertCard('info','业务层 KPI','· 整体成单率: <b>'+winRate+'%</b> → 目标 >50%<br>· Pipeline前端占比: <b>'+pct(cnt(DATA,d=>EARLY.includes(d.progress)),T)+'%</b> → 目标 <30%<br>· 概率覆盖率: <b>'+pct(cnt(DATA,d=>d.acceptProb!=null&&d.acceptProb!==''),T)+'%</b> → 目标 >90%')}
            </div>
            <div>
                ${alertCard('info','渠道层 KPI','· 渠道HHI: <b>'+chHHI+'</b> → 警戒线 2500<br>· Top3依赖度: <b>'+pct(Object.entries(grp(DATA,'channel')).sort((a,b)=>b[1]-a[1]).slice(0,3).reduce((a,[,v])=>a+v,0),T)+'%</b> → 目标 <50%<br>· 渠道成单率差异: 最高 vs 最低')}
                ${alertCard('info','执行层 KPI','· 人均项目数: <b>'+(T/Math.max(Object.keys(grp(DATA,'sales')).length,1)).toFixed(1)+'</b><br>· 售前利用率: Top1 SE占比 <b>'+pct(Object.entries(grp(DATA,'salesEngineer')).sort((a,b)=>b[1]-a[1])[0][1],T)+'%</b> → 目标 <35%<br>· 假成熟项目: <b>'+cnt(DATA,d=>LATE.includes(d.progress)&&!d.installation&&!d.projectStatus)+'</b> → 目标 0')}
            </div>
        </div>
    </div></div>`;
}

// ============================================================
// vNews — Industry News (last 15 days)
// ============================================================
function vNews(){
    const lang = localStorage.getItem('lang')||'zh';
    const newsData = [
        {
            date:'2026-04-06',
            tag:'Labor',
            tagColor:'#ef4444',
            title_zh:'日本劳动力危机加速机器人替代进程',
            title_ja:'日本の労働力危機がロボット導入を加速',
            summary_zh:'Fortune报道：日本劳动力短缺问题持续恶化，制造业和物流业加速引入机器人和AI技术填补用工缺口。经产省目标2040年前占据全球物理AI市场30%份额，重点布局物流仓储、工厂和数据中心。',
            summary_ja:'Fortune報道：日本の労働力不足が深刻化し、製造業・物流業でロボット・AI導入が加速。経産省は2040年までに物理AI市場の世界シェア30%を目標に、物流倉庫・工場・データセンターに重点投資。',
            source:'Fortune',
            url:'https://fortune.com/2026/04/06/japan-labor-shortage-robots-ai-robotics-humanoid/'
        },
        {
            date:'2026-04-02',
            tag:'Event',
            tagColor:'#8b5cf6',
            title_zh:'LogiMAT 2026：人形机器人登场，AMR仍为主角',
            title_ja:'LogiMAT 2026：ヒューマノイドロボット登場、AMRが依然主役',
            summary_zh:'德国斯图加特LogiMAT 2026展会上，人形机器人首次与AMR共同展出。但业界共识是AMR仍是仓储自动化的核心技术，人形机器人尚处于探索阶段。展会聚焦AI驱动的自主导航与多机协同调度。',
            summary_ja:'ドイツ・シュトゥットガルトのLogiMAT 2026で、ヒューマノイドロボットがAMRと初共演。業界のコンセンサスはAMRが倉庫自動化の中核技術であり、ヒューマノイドはまだ探索段階。AI駆動の自律走行と群制御に注目。',
            source:'DirectIndustry',
            url:'https://emag.directindustry.com/2026/04/02/humanoid-robots-hype-or-the-future-of-automation-insights-from-logimat-2026/'
        },
        {
            date:'2026-03-31',
            tag:'Product',
            tagColor:'#10b981',
            title_zh:'丰田发布Swarm自动搬运系统',
            title_ja:'トヨタがSwarm自動搬送システムを発表',
            summary_zh:'丰田物料搬运欧洲推出Swarm Automation Transport系统，结合SAI125CB自动平衡堆垛车与T-ONE控制软件，支持托盘搬运、堆垛及补货多场景，可与现有人工操作混合运行。',
            summary_ja:'トヨタマテリアルハンドリングヨーロッパがSwarm Automation Transportを発表。SAI125CB自動カウンターバランススタッカーとT-ONEソフトウェアを統合し、パレット搬送・スタッキング・補充に対応、有人作業との混在運用が可能。',
            source:'Robotics & Automation News',
            url:'https://roboticsandautomationnews.com/2026/03/31/toyota-launches-swarm-automated-transport-system-for-warehouse-logistics/100298/'
        },
        {
            date:'2026-03-26',
            tag:'Tech',
            tagColor:'#3b82f6',
            title_zh:'MIT开发AI系统优化仓储机器人交通调度',
            title_ja:'MITがAIによる倉庫ロボット交通最適化システムを開発',
            summary_zh:'MIT研究团队发布新型机器学习方法，在模拟电商仓库布局中实现机器人调度吞吐量提升约25%。该技术可直接应用于AGV/AMR密集部署场景，缓解多机器人路径冲突问题。',
            summary_ja:'MITの研究チームが新しい機械学習手法を発表。ECモデル倉庫のシミュレーションで、ロボット調度のスループットを約25%向上。AGV/AMR高密度配備環境に直接適用可能で、マルチロボットの経路衝突問題を緩和。',
            source:'MIT News',
            url:'https://news.mit.edu/2026/ai-system-keeps-warehouse-robot-traffic-running-smoothly-0326'
        },
        {
            date:'2026-03-25',
            tag:'Market',
            tagColor:'#f59e0b',
            title_zh:'仓储机器人市场2035年将达66亿美元',
            title_ja:'倉庫ロボティクス市場、2035年に66億ドルへ',
            summary_zh:'全球仓储机器人市场预计从2025年18亿美元增长至2035年66亿美元，CAGR 13.8%。亚太地区以39.52%的收入份额领先，中国制造商积极出海，日本以机器人应对老龄化劳动力问题。',
            summary_ja:'グローバル倉庫ロボティクス市場は2025年の18億ドルから2035年に66億ドルへ成長見込み（CAGR 13.8%）。アジア太平洋が39.52%の収益シェアでリード、中国メーカーの積極的な海外展開と日本の高齢化対策としてのロボット導入が牽引。',
            source:'Morningstar / AccessWire',
            url:'https://www.morningstar.com/news/accesswire/1145074msn/global-warehouse-robotics-market-to-reach-usd-66-billion-by-2035-as-automation-reshapes-modern-logistics'
        },
        {
            date:'2026-03-20',
            tag:'Market',
            tagColor:'#f59e0b',
            title_zh:'亚太物流自动化市场份额达34.6%，CAGR 11.6%',
            title_ja:'アジア太平洋の物流自動化市場シェア34.6%、CAGR 11.6%',
            summary_zh:'亚太地区在全球物流机器人市场占据34.63%份额（2025年），规模达45.7亿美元。电商年增30%带动仓储基础设施现代化需求，中国与东南亚成为增长核心。',
            summary_ja:'アジア太平洋は世界物流ロボット市場の34.63%を占め（2025年）、規模は45.7億ドル。EC年間30%成長が倉庫インフラの近代化需要を牽引し、中国・東南アジアが成長の中心。',
            source:'Fortune Business Insights',
            url:'https://www.fortunebusinessinsights.com/logistics-robots-market-102923'
        },
        {
            date:'2026-03-15',
            tag:'Trend',
            tagColor:'#06b6d4',
            title_zh:'2026年仓储机器人：变革管理比单一技术更重要',
            title_ja:'2026年倉庫ロボティクス：チェンジマネジメントが技術より重要',
            summary_zh:'Modern Materials Handling分析指出，2026年仓储自动化的关键不再是单一技术突破，而是如何管理变革——包括人机协作流程优化、员工培训体系建设和分阶段部署策略。',
            summary_ja:'Modern Materials Handling分析：2026年の倉庫自動化の鍵は単一技術のブレイクスルーではなく、変革管理にあると指摘。人機協調プロセスの最適化、従業員研修体系の構築、段階的展開戦略が重要。',
            source:'Modern Materials Handling',
            url:'https://www.mmh.com/article/warehouse_robotics_2026_why_change_management_outshines_any_single_new_technology'
        },
        {
            date:'2026-03-10',
            tag:'Market',
            tagColor:'#f59e0b',
            title_zh:'AGV/AMR全球市场2026年规模达9087亿日元',
            title_ja:'AGV/AMR世界市場、2026年に9,087億円規模へ',
            summary_zh:'矢野经济研究所数据：全球AGV/AMR市场2023年达5146亿日元（同比+28.1%），预计2026年增长至9087亿日元。制造业占比约80%，物流占20%，汽车和电子行业为主要驱动力。',
            summary_ja:'矢野経済研究所データ：AGV/AMR世界市場は2023年に5,146億円（前年比128.1%）、2026年に9,087億円へ成長見込み。製造業が約8割、物流が2割で、自動車・エレクトロニクス業界が主要ドライバー。',
            source:'矢野経済研究所',
            url:'https://www.yano.co.jp/press-release/show/press_id/3337'
        },
        {
            date:'2026-02-25',
            tag:'Trend',
            tagColor:'#06b6d4',
            title_zh:'Prologis：仓储自动化为多方利益相关者创造价值',
            title_ja:'プロロジス：倉庫自動化が多方面のステークホルダーに価値を創出',
            summary_zh:'全球最大物流地产商Prologis报告，仓储自动化不仅降低运营成本，更在租户满意度、建筑利用率和ESG表现上创造系统性价值。AMR/AGV部署因ROI快且保持租赁空间灵活性而增长最快。',
            summary_ja:'世界最大の物流不動産企業プロロジスのレポート：倉庫自動化は運営コスト削減だけでなく、テナント満足度・建物利用率・ESGパフォーマンスで体系的な価値を創出。AMR/AGVはROIの早さと賃貸スペースの柔軟性維持により最も急成長。',
            source:'Prologis',
            url:'https://www.prologis.com/insights-news/research/applied-automation-warehouse-boosts-value-across-stakeholders'
        },
        {
            date:'2026-02-09',
            tag:'Market',
            tagColor:'#f59e0b',
            title_zh:'物流自动化研究报告2026：电商包裹量驱动基础设施现代化',
            title_ja:'物流自動化リサーチレポート2026：EC荷物量がインフラ近代化を牽引',
            summary_zh:'GlobeNewsWire发布物流自动化市场研究报告，指出电商包裹量的快速增长正推动全球物流基础设施大规模现代化改造，市场2025-2031年间将保持强劲增长态势。',
            summary_ja:'GlobeNewsWireの物流自動化市場レポート：EC荷物量の急速な増加がグローバル物流インフラの大規模な近代化を推進、2025-2031年にかけて力強い成長が継続する見込み。',
            source:'GlobeNewsWire',
            url:'https://www.globenewswire.com/news-release/2026/02/09/3234523/0/en/Logistics-Automation-Research-Report-2026-Rapid-E-Commerce-Parcel-Volumes-Drive-Infrastructure-Modernization-Market-Share-Analysis-Industry-Trends-Statistics-Growth-Forecasts-2025-.html'
        }
    ];

    const summaryZh = `<b>全球仓储与物流机器人市场持续高速增长</b>，AGV/AMR全球市场预计2026年达9,087亿日元，仓储机器人市场CAGR 13.8%。<b>亚太地区以近40%市场份额领跑</b>，日本因劳动力危机加速机器人替代，经产省提出2040年全球物理AI市场30%份额目标。<br><br>
<b>技术趋势：</b>AMR/AGV仍是仓储自动化核心，人形机器人尚处早期；MIT开发的AI调度系统提升吞吐量25%；丰田发布Swarm多机协同搬运系统。<br><br>
<b>行业共识：</b>2026年的关键挑战已从技术突破转向变革管理——人机协作流程优化、分阶段部署策略、员工培训体系建设成为落地成功的核心。<br><br>
<b>对本业务启示：</b>SRL/SRT/AGF等场景与行业增长趋势高度契合，日本市场劳动力短缺为自动化设备创造强劲需求。应关注AMR+AI智能调度方向的产品迭代，以及东南亚新兴市场的拓展机会。`;

    const summaryJa = `<b>グローバル倉庫・物流ロボット市場は高成長を持続</b>。AGV/AMR世界市場は2026年に9,087億円、倉庫ロボティクス市場のCAGRは13.8%。<b>アジア太平洋が約40%の市場シェアでリード</b>、日本は労働力危機によりロボット導入が加速、経産省は2040年に物理AI市場の世界シェア30%を目標。<br><br>
<b>技術トレンド：</b>AMR/AGVが倉庫自動化の中核技術、ヒューマノイドはまだ初期段階。MITのAI調整システムがスループット25%向上を達成、トヨタがSwarmマルチロボット協調搬送システムを発表。<br><br>
<b>業界コンセンサス：</b>2026年の主要課題は技術ブレイクスルーからチェンジマネジメントへ移行。人機協調プロセスの最適化、段階的展開戦略、従業員研修体系の構築が導入成功の鍵。<br><br>
<b>当事業への示唆：</b>SRL/SRT/AGF等のシナリオは業界成長トレンドと高い整合性あり。日本市場の労働力不足が自動化設備への強い需要を創出。AMR+AIインテリジェント調整方向の製品進化と東南アジア新興市場の開拓に注目すべき。`;

    const isZh = lang === 'zh';
    const summary = isZh ? summaryZh : summaryJa;
    const today = new Date('2026-04-07');
    const d15ago = new Date(today); d15ago.setDate(d15ago.getDate()-15);

    const recent = newsData.filter(n => new Date(n.date) >= d15ago);
    const older = newsData.filter(n => new Date(n.date) < d15ago);

    function newsCard(n){
        const title = isZh ? n.title_zh : n.title_ja;
        const desc = isZh ? n.summary_zh : n.summary_ja;
        const daysAgo = Math.floor((today - new Date(n.date))/(1000*60*60*24));
        const daysLabel = isZh ? daysAgo+'天前' : daysAgo+'日前';
        return `<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;gap:16px;align-items:flex-start">
            <div style="min-width:72px;text-align:center">
                <div style="font-size:11px;color:var(--muted);margin-bottom:4px">${n.date.slice(5)}</div>
                <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;color:#fff;background:${n.tagColor}">${n.tag}</span>
            </div>
            <div style="flex:1">
                <a href="${n.url}" target="_blank" rel="noopener" style="font-weight:600;color:var(--text);text-decoration:none;font-size:14px;line-height:1.4">${esc(title)}</a>
                <div style="margin-top:6px;font-size:12.5px;color:var(--muted);line-height:1.7">${desc}</div>
                <div style="margin-top:6px;font-size:11px;color:var(--muted)">${n.source} · ${daysLabel}</div>
            </div>
        </div>`;
    }

    return `<div class="view-wrap"><div class="view-inner">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px">
            <div class="kpi"><div class="kpi-label">${isZh?'新闻条数':'ニュース数'}</div><div class="kpi-val">${newsData.length}</div><div class="kpi-sub">${isZh?'近15天 '+recent.length+' 条':'直近15日 '+recent.length+' 件'}</div></div>
            <div class="kpi"><div class="kpi-label">${isZh?'市场规模':'市場規模'}</div><div class="kpi-val" style="font-size:20px">¥9,087<span style="font-size:12px;color:var(--muted)"> ${isZh?'亿':'億'}</span></div><div class="kpi-sub">AGV/AMR 2026${isZh?'年全球':'年グローバル'}</div></div>
            <div class="kpi"><div class="kpi-label">${isZh?'亚太份额':'アジア太平洋シェア'}</div><div class="kpi-val" style="color:var(--green)">39.5%</div><div class="kpi-sub">CAGR 17.9%</div></div>
            <div class="kpi"><div class="kpi-label">${isZh?'仓储机器人CAGR':'倉庫ロボットCAGR'}</div><div class="kpi-val" style="color:var(--blue)">13.8%</div><div class="kpi-sub">2025→2035</div></div>
        </div>

        <div class="panel" style="margin-bottom:20px">
            <div class="panel-head"><span>${isZh?'📊 近15天行业趋势总结':'📊 直近15日間の業界トレンドまとめ'}</span><span style="font-size:11px;color:var(--muted)">${isZh?'更新：2026-04-07':'更新：2026-04-07'}</span></div>
            <div style="padding:20px;font-size:13px;line-height:1.9;color:var(--text)">${summary}</div>
        </div>

        <div class="panel" style="margin-bottom:20px">
            <div class="panel-head"><span>${isZh?'🔥 近15天重要新闻':'🔥 直近15日間の注目ニュース'}</span><span style="font-size:11px;color:var(--muted)">${recent.length} ${isZh?'条':'件'}</span></div>
            ${recent.map(newsCard).join('')}
        </div>

        ${older.length?`<div class="panel">
            <div class="panel-head"><span>${isZh?'📰 更早新闻':'📰 過去のニュース'}</span><span style="font-size:11px;color:var(--muted)">${older.length} ${isZh?'条':'件'}</span></div>
            ${older.map(newsCard).join('')}
        </div>`:''}
    </div></div>`;
}

// ============================================================
// vWeekly — Weekly Meeting Dashboard
// ============================================================
function vWeekly(){
    const D=DATA,T=D.length,lang=localStorage.getItem('lang')||'zh',isZh=lang==='zh';
    const l=(zh,ja)=>isZh?zh:ja;

    // ── Stage helpers ──
    const ACTIVE_STAGES=['01-确认商机','02-明确需求','03-方案设计','04-投标报价','05-合同谈判','06-订单签订'];
    const DEAD_STAGES=['07-暂停跟进','08-项目取消','09-丢标输单'];
    const active=D.filter(d=>ACTIVE_STAGES.includes(d.progress));
    const won=D.filter(d=>d.progress==='10-项目移交');
    const lost=D.filter(d=>d.progress==='09-丢标输单');
    const paused=D.filter(d=>d.progress==='07-暂停跟进');
    const cancelled=D.filter(d=>d.progress==='08-项目取消');
    const late=D.filter(d=>['05-合同谈判','06-订单签订'].includes(d.progress));
    const mid=D.filter(d=>['03-方案设计','04-投标报价'].includes(d.progress));
    const early=D.filter(d=>['01-确认商机','02-明确需求'].includes(d.progress));

    // ── Data completeness ──
    const fields=[
        {key:'acceptProb',zh:'受注確度',ja:'受注確度',icon:'🎯'},
        {key:'customization',zh:'定制化内容',ja:'カスタマイズ',icon:'🔧'},
        {key:'presalesDoc',zh:'售前文档',ja:'プリセールス文書',icon:'📄'},
        {key:'installation',zh:'安装状态',ja:'設置状況',icon:'🏗️'},
        {key:'projectStatus',zh:'项目状态',ja:'プロジェクト状況',icon:'📋'},
        {key:'remark',zh:'备注/跟进',ja:'備考/フォロー',icon:'💬'},
        {key:'lossReason',zh:'丢单原因',ja:'失注理由',icon:'❌',filter:d=>DEAD_STAGES.includes(d.progress)||d.progress==='09-丢标输单'}
    ];
    const completeness=fields.map(f=>{
        const pool=f.filter?D.filter(f.filter):active;
        const filled=pool.filter(d=>d[f.key]&&String(d[f.key]).trim()).length;
        return {...f,filled,total:pool.length,pct:pool.length?Math.round(filled/pool.length*100):0};
    });

    // ── Sales scorecard ──
    const salesMap={};
    D.forEach(d=>{
        const s=d.sales;if(!s)return;
        if(!salesMap[s])salesMap[s]={total:0,active:0,won:0,lost:0,late:0,mid:0,early:0,paused:0,noProb:0,hasRemark:0,scenarios:new Set(),channels:new Set()};
        const m=salesMap[s];
        m.total++;
        if(ACTIVE_STAGES.includes(d.progress))m.active++;
        if(d.progress==='10-项目移交')m.won++;
        if(d.progress==='09-丢标输单')m.lost++;
        if(['05-合同谈判','06-订单签订'].includes(d.progress))m.late++;
        if(['03-方案设计','04-投标报价'].includes(d.progress))m.mid++;
        if(['01-确认商机','02-明确需求'].includes(d.progress))m.early++;
        if(d.progress==='07-暂停跟进')m.paused++;
        if(ACTIVE_STAGES.includes(d.progress)&&!d.acceptProb)m.noProb++;
        if(d.remarks&&String(d.remarks).trim())m.hasRemark++;
        if(d.scenario)m.scenarios.add(d.scenario);
        if(d.channel)m.channels.add(d.channel);
    });

    // ── SE workload ──
    const seMap={};
    D.forEach(d=>{
        const se=d.salesEngineer;if(!se)return;
        if(!seMap[se])seMap[se]={total:0,active:0,late:0,custom:0,hasDoc:0};
        const m=seMap[se];
        m.total++;
        if(ACTIVE_STAGES.includes(d.progress))m.active++;
        if(['05-合同谈判','06-订单签订'].includes(d.progress))m.late++;
        if(d.customization)m.custom++;
        if(d.presalesDoc)m.hasDoc++;
    });

    // ── Stalled projects (active but no remarks) ──
    const stalled=active.filter(d=>!d.remarks||!String(d.remarks).trim());
    const stalledByStage=grp(stalled,'progress');

    // ── No-probability active projects ──
    const noProb=active.filter(d=>!d.acceptProb);

    // ── Risk: late stage without key fields ──
    const lateRisk=late.filter(d=>!d.acceptProb||!d.installation||!d.projectStatus);

    // ── Pipeline by stage (funnel) ──
    const stageOrder=['01-确认商机','02-明确需求','03-方案设计','04-投标报价','05-合同谈判','06-订单签订','10-项目移交'];
    const stageCounts=stageOrder.map(s=>({stage:s,count:D.filter(d=>d.progress===s).length}));
    const maxStage=Math.max(...stageCounts.map(s=>s.count),1);

    // ── Action items ──
    const actions=[];
    if(noProb.length>active.length*0.5) actions.push({level:'danger',text:l('活跃项目中 '+noProb.length+' 个('+pct(noProb.length,active.length)+'%)未填写受注確度，严重影响Pipeline预测准确性','アクティブ案件のうち '+noProb.length+' 件('+pct(noProb.length,active.length)+'%)が受注確度未入力。Pipeline予測精度に深刻な影響')});
    if(stalled.length>10) actions.push({level:'warning',text:l(stalled.length+' 个活跃项目无跟进记录(remarks为空)，请各担当确认是否仍在推进',stalled.length+' 件のアクティブ案件にフォロー記録なし（remarks空白）。各担当に状況確認要請')});
    if(lateRisk.length>0) actions.push({level:'danger',text:l(lateRisk.length+' 个后期项目(谈判/签订)关键字段缺失，需紧急补全：受注確度/安装状态/项目状态',lateRisk.length+' 件の後期案件（交渉/契約）の重要フィールドが未入力。緊急に補完必要：受注確度/設置状況/案件状況')});
    const bigSE=Object.entries(seMap).filter(([,v])=>v.active>active.length*0.4);
    if(bigSE.length) actions.push({level:'warning',text:l('SE '+bigSE.map(([k,v])=>k.trim()+'('+v.active+'件)').join(', ')+' 负荷过重，超过活跃项目40%，需考虑资源再分配','SE '+bigSE.map(([k,v])=>k.trim()+'('+v.active+'件)').join(', ')+' の負荷過多。アクティブ案件の40%超、リソース再配分を検討')});
    const pausedPct=pct(paused.length,T);
    if(pausedPct>15) actions.push({level:'warning',text:l('暂停项目占比 '+pausedPct+'%，建议周会逐一确认是否可激活或应标记为取消','保留案件が'+pausedPct+'%を占有。週次会議で個別に活性化可否または取消マーク要否を確認')});
    if(early.length>active.length*0.5) actions.push({level:'info',text:l('Pipeline前端(确认商机/明确需求)占活跃项目 '+pct(early.length,active.length)+'%，需加强推进转化至方案阶段','Pipeline前段（商機確認/要件定義）がアクティブの'+pct(early.length,active.length)+'%。方案設計段階への転換促進が必要')});

    // ── Scenario & Channel weekly summary ──
    const scActive=grp(active,'scenario');
    const chActive=grp(active,'channel');
    const scWon=grp(won,'scenario');
    const chWon=grp(won,'channel');

    // ── build HTML ──
    return `<div class="view-wrap"><div class="view-inner">

        <!-- KPI Row -->
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-bottom:20px">
            <div class="kpi"><div class="kpi-label">${l('活跃项目','アクティブ案件')}</div><div class="kpi-val" style="color:var(--blue)">${active.length}</div><div class="kpi-sub">${l('占总数','全体比')} ${pct(active.length,T)}%</div></div>
            <div class="kpi"><div class="kpi-label">${l('后期阶段','後期段階')}</div><div class="kpi-val" style="color:var(--green)">${late.length}</div><div class="kpi-sub">${l('谈判+签订','交渉+契約')}</div></div>
            <div class="kpi"><div class="kpi-label">${l('成单','受注')}</div><div class="kpi-val" style="color:#10b981">${won.length}</div><div class="kpi-sub">${l('成单率','受注率')} ${pct(won.length,won.length+lost.length)}%</div></div>
            <div class="kpi"><div class="kpi-label">${l('丢单','失注')}</div><div class="kpi-val" style="color:var(--red)">${lost.length}</div><div class="kpi-sub">${l('丢单率','失注率')} ${pct(lost.length,won.length+lost.length)}%</div></div>
            <div class="kpi"><div class="kpi-label">${l('暂停','保留')}</div><div class="kpi-val" style="color:#636e83">${paused.length}</div><div class="kpi-sub">${l('待激活确认','活性化確認待ち')}</div></div>
            <div class="kpi"><div class="kpi-label">${l('数据完整度','データ完全度')}</div><div class="kpi-val" style="color:${completeness.reduce((a,c)=>a+c.pct,0)/completeness.length>60?'var(--green)':'var(--red)'}"><span style="font-size:20px">${Math.round(completeness.reduce((a,c)=>a+c.pct,0)/completeness.length)}</span><span style="font-size:13px">%</span></div><div class="kpi-sub">${l('关键字段平均','重要フィールド平均')}</div></div>
        </div>

        <!-- Action Items -->
        <div class="panel" style="margin-bottom:20px">
            <div class="panel-head"><span>🚨 ${l('本周行动项','今週のアクションアイテム')}</span><span style="font-size:11px;color:var(--muted)">${actions.length} ${l('项','件')}</span></div>
            <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
                ${actions.length?actions.map((a,i)=>`<div style="display:flex;gap:10px;align-items:flex-start;padding:12px 16px;border-radius:8px;background:${a.level==='danger'?'#fef2f2':a.level==='warning'?'#fffbeb':'#eff6ff'};border-left:4px solid ${a.level==='danger'?'#ef4444':a.level==='warning'?'#f59e0b':'#3b82f6'}">
                    <span style="font-weight:700;color:${a.level==='danger'?'#ef4444':a.level==='warning'?'#f59e0b':'#3b82f6'};font-size:13px;min-width:20px">${i+1}.</span>
                    <span style="font-size:13px;line-height:1.6;color:var(--text)">${a.text}</span>
                </div>`).join(''):`<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">✅ ${l('本周无紧急行动项','今週の緊急アクションアイテムなし')}</div>`}
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">

            <!-- Pipeline Funnel -->
            <div class="panel">
                <div class="panel-head"><span>📊 ${l('Pipeline 阶段分布','Pipeline 段階分布')}</span></div>
                <div style="padding:16px">
                    ${stageCounts.map(s=>{
                        const w=Math.max(s.count/maxStage*100,8);
                        const color=P_COLOR[s.stage]||'#94a3b8';
                        const isActive=ACTIVE_STAGES.includes(s.stage);
                        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                            <div style="width:80px;font-size:11px;color:var(--muted);text-align:right;white-space:nowrap">${PS(s.stage)}</div>
                            <div style="flex:1;background:var(--bg);border-radius:6px;height:26px;position:relative;overflow:hidden">
                                <div style="height:100%;width:${w}%;background:${color};border-radius:6px;opacity:${isActive?1:0.5};transition:width .5s"></div>
                            </div>
                            <div style="min-width:36px;font-size:13px;font-weight:600;color:${isActive?'var(--text)':'var(--muted)'}">${s.count}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- Data Completeness -->
            <div class="panel">
                <div class="panel-head"><span>📋 ${l('数据完整度检查','データ完全度チェック')}</span><span style="font-size:11px;color:var(--muted)">${l('活跃项目','アクティブ案件')}</span></div>
                <div style="padding:16px">
                    ${completeness.map(f=>{
                        const barColor=f.pct>=80?'#10b981':f.pct>=50?'#f59e0b':'#ef4444';
                        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                            <div style="width:24px;text-align:center;font-size:14px">${f.icon}</div>
                            <div style="width:80px;font-size:12px;color:var(--text)">${isZh?f.zh:f.ja}</div>
                            <div style="flex:1;background:var(--bg);border-radius:6px;height:20px;position:relative;overflow:hidden">
                                <div style="height:100%;width:${Math.max(f.pct,3)}%;background:${barColor};border-radius:6px;transition:width .5s"></div>
                            </div>
                            <div style="min-width:70px;font-size:11px;color:var(--muted);text-align:right">${f.filled}/${f.total} <b style="color:${barColor}">${f.pct}%</b></div>
                        </div>`;
                    }).join('')}
                    <div style="margin-top:12px;padding:10px;border-radius:6px;background:#fffbeb;font-size:11px;color:#92400e;line-height:1.6">
                        💡 ${l('建议：周会前各担当补全自己负责项目的关键字段，特别是后期阶段项目的受注確度和安装状态','提案：週次会議前に各担当が自分の案件の重要フィールドを補完。特に後期段階案件の受注確度と設置状況')}
                    </div>
                </div>
            </div>
        </div>

        <!-- Sales Scorecard -->
        <div class="panel" style="margin-bottom:20px">
            <div class="panel-head"><span>👤 ${l('销售周报卡','営業週次スコアカード')}</span><span style="font-size:11px;color:var(--muted)">${Object.keys(salesMap).length} ${l('人','名')}</span></div>
            <table class="tbl">
                <thead><tr>
                    <th>${l('销售','営業')}</th>
                    <th>${l('总数','合計')}</th>
                    <th>${l('活跃','活動')}</th>
                    <th style="text-align:center">${l('前期','前期')}</th>
                    <th style="text-align:center">${l('中期','中期')}</th>
                    <th style="text-align:center">${l('后期','後期')}</th>
                    <th>${l('成单','受注')}</th>
                    <th>${l('丢单','失注')}</th>
                    <th>${l('暂停','保留')}</th>
                    <th>${l('确度缺失','確度未入力')}</th>
                    <th>${l('跟进率','フォロー率')}</th>
                    <th>${l('场景覆盖','シナリオ')}</th>
                    <th>${l('渠道覆盖','チャンネル')}</th>
                    <th>${l('周会话题','週次トピック')}</th>
                </tr></thead>
                <tbody>
                ${Object.entries(salesMap).sort((a,b)=>b[1].active-a[1].active).map(([name,m])=>{
                    const followRate=m.total?Math.round(m.hasRemark/m.total*100):0;
                    const winRate=(m.won+m.lost)?Math.round(m.won/(m.won+m.lost)*100):'-';
                    // Generate smart weekly topics
                    const topics=[];
                    if(m.noProb>3) topics.push(`<span style="color:#ef4444;font-size:10px">⚠️ ${m.noProb}${l('件缺确度','件確度なし')}</span>`);
                    if(m.late>0) topics.push(`<span style="color:#10b981;font-size:10px">🎯 ${m.late}${l('件后期推进','件後期推進')}</span>`);
                    if(m.paused>2) topics.push(`<span style="color:#636e83;font-size:10px">⏸ ${m.paused}${l('件待确认','件要確認')}</span>`);
                    if(m.early>m.active*0.6&&m.active>5) topics.push(`<span style="color:#3b82f6;font-size:10px">📤 ${l('推进转化','転換促進')}</span>`);
                    return `<tr>
                        <td><b>${esc(name.trim())}</b></td>
                        <td>${m.total}</td>
                        <td><b>${m.active}</b></td>
                        <td style="text-align:center"><span style="display:inline-block;min-width:24px;padding:2px 6px;border-radius:10px;background:#eff6ff;color:#3b82f6;font-size:11px;font-weight:600">${m.early}</span></td>
                        <td style="text-align:center"><span style="display:inline-block;min-width:24px;padding:2px 6px;border-radius:10px;background:#f5f3ff;color:#7c3aed;font-size:11px;font-weight:600">${m.mid}</span></td>
                        <td style="text-align:center"><span style="display:inline-block;min-width:24px;padding:2px 6px;border-radius:10px;background:#ecfdf5;color:#10b981;font-size:11px;font-weight:600">${m.late}</span></td>
                        <td style="color:#10b981;font-weight:600">${m.won}</td>
                        <td style="color:#ef4444">${m.lost}</td>
                        <td style="color:#636e83">${m.paused}</td>
                        <td>${m.noProb?`<span style="color:#ef4444;font-weight:600">${m.noProb}</span>`:'<span style="color:#10b981">✓</span>'}</td>
                        <td><span style="color:${followRate>=60?'#10b981':followRate>=30?'#f59e0b':'#ef4444'};font-weight:600">${followRate}%</span></td>
                        <td style="font-size:11px">${m.scenarios.size}</td>
                        <td style="font-size:11px">${m.channels.size}</td>
                        <td>${topics.join(' ')||'<span style="color:var(--muted);font-size:10px">-</span>'}</td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">

            <!-- SE Workload -->
            <div class="panel">
                <div class="panel-head"><span>🔬 ${l('售前工程师负荷','プリセールスエンジニア負荷')}</span></div>
                <table class="tbl">
                    <thead><tr>
                        <th>SE</th>
                        <th>${l('总数','合計')}</th>
                        <th>${l('活跃','活動')}</th>
                        <th>${l('后期','後期')}</th>
                        <th>${l('定制化','カスタマイズ')}</th>
                        <th>${l('文档率','文書率')}</th>
                        <th>${l('负荷评估','負荷評価')}</th>
                    </tr></thead>
                    <tbody>
                    ${Object.entries(seMap).sort((a,b)=>b[1].active-a[1].active).map(([name,m])=>{
                        const docRate=m.total?Math.round(m.hasDoc/m.total*100):0;
                        const load=m.active>active.length*0.35?'🔴 '+l('过载','過負荷'):m.active>active.length*0.25?'🟡 '+l('偏高','やや高い'):'🟢 '+l('正常','正常');
                        return `<tr>
                            <td><b>${esc(name.trim())}</b></td>
                            <td>${m.total}</td>
                            <td><b>${m.active}</b></td>
                            <td style="color:var(--green);font-weight:600">${m.late}</td>
                            <td>${m.custom}</td>
                            <td><span style="color:${docRate>=50?'#10b981':'#f59e0b'}">${docRate}%</span></td>
                            <td style="font-size:11px">${load}</td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Stalled Projects -->
            <div class="panel">
                <div class="panel-head"><span>⏸ ${l('无跟进记录项目','フォロー記録なし案件')}</span><span style="font-size:11px;color:var(--red)">${stalled.length} ${l('件','件')}</span></div>
                <div style="padding:16px">
                    <div style="margin-bottom:12px;font-size:12px;color:var(--muted);line-height:1.6">${l('以下活跃项目remarks字段为空，无法判断跟进状态。建议周会时逐一确认。','以下のアクティブ案件はremarksが空白で、フォロー状況が不明。週次会議で個別に確認を推奨。')}</div>
                    ${Object.entries(stalledByStage).sort((a,b)=>b[1]-a[1]).map(([stage,count])=>{
                        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                            <span class="badge ${pB(stage)}" style="font-size:10px">${PS(stage)}</span>
                            <div style="flex:1;background:var(--bg);border-radius:6px;height:18px;overflow:hidden">
                                <div style="height:100%;width:${Math.max(count/stalled.length*100,5)}%;background:${P_COLOR[stage]||'#94a3b8'};border-radius:6px"></div>
                            </div>
                            <span style="font-size:12px;font-weight:600;min-width:24px">${count}</span>
                        </div>`;
                    }).join('')}
                    <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px">
                        <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:8px">${l('按担当分布','担当別分布')}</div>
                        ${Object.entries(grp(stalled,'sales')).sort((a,b)=>b[1]-a[1]).map(([s,c])=>`<span style="display:inline-block;margin:2px 4px 2px 0;padding:3px 10px;border-radius:12px;font-size:11px;background:${c>5?'#fef2f2':'#f7f8fa'};color:${c>5?'#ef4444':'var(--text)'};font-weight:${c>5?600:400}">${esc(s.trim())} ${c}</span>`).join('')}
                    </div>
                </div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">

            <!-- Scenario Summary -->
            <div class="panel">
                <div class="panel-head"><span>🎯 ${l('场景周报','シナリオ週次サマリー')}</span></div>
                <table class="tbl">
                    <thead><tr>
                        <th>${l('场景','シナリオ')}</th>
                        <th>${l('活跃','活動')}</th>
                        <th>${l('成单','受注')}</th>
                        <th>${l('成单率','受注率')}</th>
                        <th>${l('活跃占比','活動比率')}</th>
                        <th>${l('关注点','注目ポイント')}</th>
                    </tr></thead>
                    <tbody>
                    ${Object.entries(scActive).sort((a,b)=>b[1]-a[1]).map(([sc,cnt])=>{
                        const w=scWon[sc]||0;
                        const lostN=D.filter(d=>d.scenario===sc&&d.progress==='09-丢标输单').length;
                        const wr=(w+lostN)?Math.round(w/(w+lostN)*100):'-';
                        const share=Math.round(cnt/active.length*100);
                        let focus='';
                        if(wr!=='-'&&wr<30) focus=`<span style="color:#ef4444;font-size:10px">⚠ ${l('成单率低','受注率低')}</span>`;
                        else if(share>30) focus=`<span style="color:#3b82f6;font-size:10px">📌 ${l('主力场景','主力シナリオ')}</span>`;
                        else if(cnt<=3) focus=`<span style="color:#f59e0b;font-size:10px">🔍 ${l('样本少','サンプル少')}</span>`;
                        return `<tr>
                            <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${SC_C[sc]||'#94a3b8'};margin-right:6px"></span><b>${esc(sc)}</b></td>
                            <td>${cnt}</td>
                            <td style="color:#10b981;font-weight:600">${w}</td>
                            <td><span style="color:${wr==='-'?'var(--muted)':wr>=50?'#10b981':'#ef4444'};font-weight:600">${wr}${wr!=='-'?'%':''}</span></td>
                            <td>${share}%</td>
                            <td>${focus||'-'}</td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Channel Summary -->
            <div class="panel">
                <div class="panel-head"><span>🏢 ${l('渠道周报','チャンネル週次サマリー')}</span></div>
                <table class="tbl">
                    <thead><tr>
                        <th>${l('渠道','チャンネル')}</th>
                        <th>${l('活跃','活動')}</th>
                        <th>${l('成单','受注')}</th>
                        <th>${l('成单率','受注率')}</th>
                        <th>${l('关注点','注目ポイント')}</th>
                    </tr></thead>
                    <tbody>
                    ${Object.entries(chActive).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([ch,cnt])=>{
                        const w=chWon[ch]||0;
                        const lostN=D.filter(d=>d.channel===ch&&d.progress==='09-丢标输单').length;
                        const wr=(w+lostN)?Math.round(w/(w+lostN)*100):'-';
                        let focus='';
                        if(cnt>=10&&(wr==='-'||wr<30)) focus=`<span style="color:#ef4444;font-size:10px">⚠ ${l('量大率低','量多率低')}</span>`;
                        else if(wr!=='-'&&wr>=60) focus=`<span style="color:#10b981;font-size:10px">⭐ ${l('优质渠道','優良CH')}</span>`;
                        else if(cnt<=2) focus=`<span style="color:#f59e0b;font-size:10px">🆕 ${l('新渠道','新規CH')}</span>`;
                        return `<tr>
                            <td><b>${esc(ch)}</b></td>
                            <td>${cnt}</td>
                            <td style="color:#10b981;font-weight:600">${w}</td>
                            <td><span style="color:${wr==='-'?'var(--muted)':wr>=50?'#10b981':'#ef4444'};font-weight:600">${wr}${wr!=='-'?'%':''}</span></td>
                            <td>${focus||'-'}</td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Late-stage Risk Detail -->
        ${lateRisk.length?`<div class="panel" style="margin-bottom:20px">
            <div class="panel-head"><span>🔴 ${l('后期项目风险清单','後期案件リスクリスト')}</span><span style="font-size:11px;color:var(--red)">${lateRisk.length} ${l('件需关注','件要注目')}</span></div>
            <table class="tbl">
                <thead><tr>
                    <th>ID</th>
                    <th>${l('项目名','案件名')}</th>
                    <th>${l('阶段','段階')}</th>
                    <th>${l('销售','営業')}</th>
                    <th>${l('渠道','チャンネル')}</th>
                    <th>${l('受注確度','受注確度')}</th>
                    <th>${l('安装','設置')}</th>
                    <th>${l('项目状态','案件状況')}</th>
                    <th>${l('缺失字段','欠損フィールド')}</th>
                </tr></thead>
                <tbody>
                ${lateRisk.slice(0,15).map(d=>{
                    const missing=[];
                    if(!d.acceptProb)missing.push(l('确度','確度'));
                    if(!d.installation)missing.push(l('安装','設置'));
                    if(!d.projectStatus)missing.push(l('状态','状況'));
                    return `<tr>
                        <td style="font-size:11px;color:var(--muted)">${d.id}</td>
                        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(d.projectName)}">${esc(d.projectName)}</td>
                        <td><span class="badge ${pB(d.progress)}" style="font-size:10px">${PS(d.progress)}</span></td>
                        <td style="font-size:11px">${esc((d.sales||'').trim())}</td>
                        <td style="font-size:11px">${esc(d.channel||'')}</td>
                        <td>${d.acceptProb?d.acceptProb:'<span style="color:#ef4444">✗</span>'}</td>
                        <td>${d.installation||'<span style="color:#ef4444">✗</span>'}</td>
                        <td style="font-size:11px">${d.projectStatus||'<span style="color:#ef4444">✗</span>'}</td>
                        <td><span style="color:#ef4444;font-size:11px;font-weight:600">${missing.join(', ')}</span></td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>
            ${lateRisk.length>15?`<div style="padding:8px 16px;font-size:11px;color:var(--muted);text-align:center">${l('仅展示前15条，共'+lateRisk.length+'条','上位15件のみ表示。合計'+lateRisk.length+'件')}</div>`:''}
        </div>`:''}

        <!-- Weekly Meeting Agenda Suggestion -->
        <div class="panel">
            <div class="panel-head"><span>📝 ${l('周会议程建议','週次会議アジェンダ提案')}</span></div>
            <div style="padding:20px">
                <div style="display:grid;grid-template-columns:40px 1fr;gap:0;font-size:13px;line-height:1.8">
                    ${[
                        {time:'5min',zh:'Pipeline总览 — 各阶段数量变化、整体健康度',ja:'Pipelineレビュー — 各段階の件数変動・全体健全性'},
                        {time:'10min',zh:'后期项目逐一确认 — '+late.length+'件谈判/签订阶段，确认预计成单时间和风险',ja:'後期案件の個別確認 — '+late.length+'件の交渉/契約段階、受注予定時期とリスクの確認'},
                        {time:'10min',zh:'数据补全 — 重点确认受注確度('+noProb.length+'件缺失)和安装状态',ja:'データ補完 — 受注確度（'+noProb.length+'件未入力）と設置状況の確認'},
                        {time:'5min',zh:'暂停项目处置 — '+paused.length+'件，逐一决策：激活/取消/继续暂停',ja:'保留案件の処置 — '+paused.length+'件、個別判断：活性化/取消/継続保留'},
                        {time:'10min',zh:'各销售汇报 — 本周重点推进项目、下周计划、需要支援事项',ja:'各営業報告 — 今週の重点推進案件・来週計画・支援要請事項'},
                        {time:'5min',zh:'SE资源协调 — 售前支援需求确认、文档完成状态跟进',ja:'SEリソース調整 — プリセールス支援要請の確認・文書完成状況フォロー'},
                        {time:'5min',zh:'下周目标设定 — 重点转化项目、渠道拜访计划、数据更新deadline',ja:'来週目標設定 — 重点転換案件・チャンネル訪問計画・データ更新期限'}
                    ].map((item,i)=>`
                        <div style="text-align:center;padding:8px 0;border-right:2px solid ${i<2?'#ef4444':i<4?'#f59e0b':'#3b82f6'};position:relative">
                            <span style="font-size:10px;font-weight:700;color:${i<2?'#ef4444':i<4?'#f59e0b':'#3b82f6'}">${item.time}</span>
                            <div style="position:absolute;right:-5px;top:50%;width:8px;height:8px;border-radius:50%;background:${i<2?'#ef4444':i<4?'#f59e0b':'#3b82f6'};transform:translateY(-50%)"></div>
                        </div>
                        <div style="padding:8px 0 8px 16px;border-bottom:1px solid var(--border)">${isZh?item.zh:item.ja}</div>
                    `).join('')}
                </div>
                <div style="margin-top:16px;padding:12px 16px;background:#ecfdf5;border-radius:8px;font-size:11px;color:#065f46;line-height:1.6">
                    ⏱ ${l('建议总时长：50分钟 | 会前准备：各担当提前更新remarks字段和受注確度','推奨所要時間：50分 | 事前準備：各担当がremarksフィールドと受注確度を事前更新')}
                </div>
            </div>
        </div>

    </div></div>`;
}
