import { useState } from "react";
import AmbientBackground from "./AmbientBackground";
import { MEALS, M_ICON } from "../utils/helpers";

export default function Sheet({items,targets,onRemove,onChangeQty,onChangeMeal,onClear,onBack,onUndo,undoSteps}){
  const [sortCol,setSortCol]     = useState(null);
  const [sortDir,setSortDir]     = useState("asc");
  const [mealFilter,setMealFilter]= useState("All");
  const [flash,setFlash]          = useState(false);

  function handleUndo(){
    if(!undoSteps) return;
    onUndo();
    setFlash(true);
    setTimeout(()=>setFlash(false),500);
  }

  const shown = (mealFilter==="All" ? items : items.filter(e=>e.mealTime===mealFilter))
    .map(e=>({...e,_i:items.indexOf(e)}))
    .sort((a,b)=>{
      if(!sortCol) return 0;
      return sortDir==="asc" ? (a[sortCol]>b[sortCol]?1:-1) : (a[sortCol]<b[sortCol]?1:-1);
    });

  const tot = items.reduce((t,e)=>({cal:t.cal+e.cal*e.qty,p:t.p+e.p*e.qty,f:t.f+e.f*e.qty,c:t.c+e.c*e.qty}),{cal:0,p:0,f:0,c:0});
  const mCals= MEALS.reduce((a,m)=>{a[m]=items.filter(e=>e.mealTime===m).reduce((s,e)=>s+e.cal*e.qty,0);return a;},{});

  function toggleSort(col){ if(sortCol===col){setSortDir(d=>d==="asc"?"desc":"asc");}else{setSortCol(col);setSortDir("asc");} }

  const TH=({col,label,center})=>(
    <th onClick={()=>col&&toggleSort(col)}
      style={{padding:"11px 10px",fontSize:11,fontWeight:800,textTransform:"uppercase",
        letterSpacing:.8,color:"#6b3a1f",background:"linear-gradient(180deg,#fef3c7,#fde68a)",
        borderBottom:"2px solid rgba(194,65,12,.2)",cursor:col?"pointer":"default",
        whiteSpace:"nowrap",userSelect:"none",textAlign:center?"center":"left"}}>
      {label}
      {col&&<span style={{marginLeft:3,opacity:sortCol===col?1:.3,color:"#c2410c"}}>
        {sortCol===col?(sortDir==="asc"?"↑":"↓"):"↕"}
      </span>}
    </th>
  );

  const todayStr = new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

  return (
    <div style={{minHeight:"100vh",background:"transparent",fontFamily:"'Nunito',sans-serif",paddingBottom:80,position:"relative"}}>
      <AmbientBackground />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes rowIn{from{opacity:0;transform:translateX(-5px)}to{opacity:1;transform:translateX(0)}}
        @keyframes ambientFloat{0%{transform:translateY(0) rotate(var(--r0)) scale(1)}50%{transform:translateY(var(--dr)) rotate(var(--r1)) scale(1.08)}100%{transform:translateY(0) rotate(var(--r0)) scale(1)}}
        .trow:hover td{background:rgba(194,65,12,.06)!important}
        .qb:hover{background:rgba(194,65,12,.2)!important}
        .rb:hover{color:#ef4444!important;background:rgba(239,68,68,.1)!important}
        ::-webkit-scrollbar{height:5px;width:5px}
        ::-webkit-scrollbar-thumb{background:#d97706;border-radius:99px}
      `}</style>

      <div style={{position:"relative",zIndex:1}}>
      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"linear-gradient(135deg,#92400e,#c2410c)",boxShadow:"0 4px 20px rgba(120,40,0,.25)"}}>
        <div style={{height:4,background:"linear-gradient(90deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#ef4444)",backgroundSize:"200% 100%",animation:"shimmer 4s linear infinite"}}></div>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0 10px"}}>
            <button onClick={onBack} style={{width:36,height:36,borderRadius:10,border:"1.5px solid rgba(255,255,255,.3)",background:"rgba(255,255,255,.12)",color:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>&#8592;</button>
            <span style={{fontSize:20}}>📋</span>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,color:"#fff",lineHeight:1}}>Daily Intake Sheet</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.65)",marginTop:1}}>{todayStr}</div>
            </div>
            <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
              {/* Undo button */}
              <button onClick={handleUndo} disabled={!undoSteps}
                style={{padding:"6px 12px",borderRadius:9,fontSize:12,fontWeight:700,
                  cursor:undoSteps?"pointer":"not-allowed",
                  border:"1.5px solid rgba(251,191,36,.5)",
                  background:flash?"rgba(251,191,36,.5)":undoSteps?"rgba(251,191,36,.18)":"rgba(255,255,255,.07)",
                  color:undoSteps?"#fde68a":"rgba(255,255,255,.3)",
                  display:"flex",alignItems:"center",gap:5,transition:"all .2s"}}>
                &#8617; Undo
                {undoSteps>0&&<span style={{background:"rgba(251,191,36,.35)",borderRadius:99,padding:"1px 6px",fontSize:10,fontWeight:900}}>{undoSteps}</span>}
              </button>
              {items.length>0&&(
                <button onClick={onClear} style={{padding:"6px 13px",borderRadius:9,border:"1.5px solid rgba(239,68,68,.4)",background:"rgba(239,68,68,.12)",color:"rgba(255,180,180,.9)",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  Clear All
                </button>
              )}
              {[
                {icon:"🔥",val:Math.round(tot.cal)+" kcal",over:tot.cal>targets.cal},
                {icon:"💪",val:Math.round(tot.p)+"g P",over:tot.p>targets.protein},
                {icon:"🌾",val:Math.round(tot.c)+"g C",over:tot.c>targets.carbs},
                {icon:"💧",val:Math.round(tot.f)+"g F",over:tot.f>targets.fat},
              ].map(m=>(
                <div key={m.icon} style={{background:"rgba(255,255,255,.13)",borderRadius:8,padding:"5px 10px",border:"1px solid rgba(255,255,255,.2)"}}>
                  <span style={{fontSize:11,fontWeight:800,color:m.over?"#fca5a5":"#fff"}}>{m.icon} {m.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"20px 16px"}}>
        {/* Meal filter chips */}
        <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
          {["All",...MEALS].map(m=>{
            const cal=m==="All"?tot.cal:mCals[m]||0;
            const active=mealFilter===m;
            return (
              <button key={m} onClick={()=>setMealFilter(m)}
                style={{background:active?"#c2410c":"rgba(255,255,255,.85)",border:"1.5px solid "+(active?"#c2410c":"rgba(180,140,60,.25)"),borderRadius:99,padding:"6px 14px",fontSize:12,fontWeight:700,color:active?"#fff":"#92400e",cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:active?"0 3px 10px rgba(194,65,12,.3)":"none"}}>
                {m!=="All"&&<span>{M_ICON[m]}</span>}
                {m}
                {m!=="All"&&cal>0&&<span style={{background:active?"rgba(255,255,255,.25)":"rgba(194,65,12,.1)",borderRadius:99,padding:"1px 7px",fontSize:10,fontWeight:800}}>{Math.round(cal)}</span>}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{background:"#fff",borderRadius:22,boxShadow:"0 4px 32px rgba(120,60,0,.1)",border:"1.5px solid rgba(180,140,60,.15)",overflow:"hidden",marginBottom:24}}>
          {items.length===0 ? (
            <div style={{padding:"60px 24px",textAlign:"center"}}>
              <div style={{fontSize:48,marginBottom:12}}>🍽️</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:"#6b3a1f",marginBottom:8}}>Your plate is empty</div>
              <button onClick={onBack} style={{background:"linear-gradient(135deg,#92400e,#c2410c)",border:"none",borderRadius:14,padding:"13px 28px",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer"}}>&#8592; Add Foods</button>
            </div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:740}}>
                <thead>
                  <tr>
                    <TH label="#" center />
                    <TH col="name"     label="Food Name" />
                    <TH col="cat"      label="Category" />
                    <TH col="mealTime" label="Meal" />
                    <TH label="Qty" center />
                    <TH col="cal" label="Calories" />
                    <TH col="p"   label="Protein" center />
                    <TH col="c"   label="Carbs"   center />
                    <TH col="f"   label="Fat"     center />
                    <TH label="" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item,idx)=>{
                    const even=idx%2===1;
                    const bg  =even?"#f7f3ee":"#ffffff";
                    const bd  ="1px solid rgba(180,140,60,.1)";
                    return (
                      <tr key={item.rowId} className="trow" style={{animation:`rowIn .25s ${idx*.025}s ease both`}}>
                        <td style={{padding:"12px 10px",textAlign:"center",background:bg,borderBottom:bd}}>
                          <span style={{fontSize:11,fontWeight:700,color:"#a87c3a",background:"rgba(180,140,60,.12)",borderRadius:6,padding:"2px 7px"}}>{idx+1}</span>
                        </td>
                        <td style={{padding:"12px 10px",background:bg,borderBottom:bd}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#1c0a00"}}>{item.name}</div>
                        </td>
                        <td style={{padding:"12px 10px",background:bg,borderBottom:bd}}>
                          <span style={{fontSize:11,background:"rgba(180,140,60,.12)",color:"#92400e",borderRadius:7,padding:"3px 9px",fontWeight:700}}>{item.cat}</span>
                        </td>
                        <td style={{padding:"12px 10px",background:bg,borderBottom:bd}}>
                          <select value={item.mealTime} onChange={e=>onChangeMeal(item._i,e.target.value)}
                            style={{fontSize:11,fontWeight:700,color:"#c2410c",background:"rgba(194,65,12,.08)",border:"1px solid rgba(194,65,12,.25)",borderRadius:7,padding:"4px 8px",cursor:"pointer",outline:"none",fontFamily:"'Nunito',sans-serif"}}>
                            {MEALS.map(m=><option key={m}>{m}</option>)}
                          </select>
                        </td>
                        <td style={{padding:"12px 10px",textAlign:"center",background:bg,borderBottom:bd}}>
                          <div style={{display:"inline-flex",alignItems:"center",background:"rgba(180,140,60,.1)",borderRadius:9,overflow:"hidden",border:"1px solid rgba(180,140,60,.2)"}}>
                            <button className="qb" onClick={()=>onChangeQty(item._i,Math.max(.5,item.qty-.5))} style={{width:26,height:26,border:"none",background:"transparent",color:"#c2410c",fontSize:16,cursor:"pointer",fontWeight:700,transition:"background .15s"}}>-</button>
                            <span style={{fontSize:12,fontWeight:800,color:"#1c0a00",minWidth:24,textAlign:"center"}}>{item.qty}</span>
                            <button className="qb" onClick={()=>onChangeQty(item._i,item.qty+.5)} style={{width:26,height:26,border:"none",background:"transparent",color:"#c2410c",fontSize:16,cursor:"pointer",fontWeight:700,transition:"background .15s"}}>+</button>
                          </div>
                        </td>
                        <td style={{padding:"12px 10px",background:bg,borderBottom:bd}}>
                          <div style={{fontSize:13,fontWeight:800,color:"#c2410c"}}>{Math.round(item.cal*item.qty)}<span style={{fontSize:10,fontWeight:600,color:"#a87c3a",marginLeft:2}}>kcal</span></div>
                          <div style={{marginTop:3,height:4,background:"rgba(180,140,60,.15)",borderRadius:99,overflow:"hidden",width:52}}>
                            <div style={{width:Math.min(100,(item.cal*item.qty/600)*100)+"%",height:"100%",background:"#f97316",borderRadius:99}}></div>
                          </div>
                        </td>
                        <td style={{padding:"12px 10px",textAlign:"center",background:bg,borderBottom:bd}}>
                          <span style={{fontSize:13,fontWeight:700,color:"#2563eb"}}>{Math.round(item.p*item.qty)}<span style={{fontSize:10,color:"#93c5fd"}}>g</span></span>
                        </td>
                        <td style={{padding:"12px 10px",textAlign:"center",background:bg,borderBottom:bd}}>
                          <span style={{fontSize:13,fontWeight:700,color:"#059669"}}>{Math.round(item.c*item.qty)}<span style={{fontSize:10,color:"#6ee7b7"}}>g</span></span>
                        </td>
                        <td style={{padding:"12px 10px",textAlign:"center",background:bg,borderBottom:bd}}>
                          <span style={{fontSize:13,fontWeight:700,color:"#dc2626"}}>{Math.round(item.f*item.qty)}<span style={{fontSize:10,color:"#fca5a5"}}>g</span></span>
                        </td>
                        <td style={{padding:"12px 8px",textAlign:"center",background:bg,borderBottom:bd}}>
                          <button className="rb" onClick={()=>onRemove(item._i)} style={{background:"transparent",border:"none",cursor:"pointer",color:"#d1b89a",fontSize:18,borderRadius:7,padding:"3px 7px",transition:"all .15s"}}>&#215;</button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{background:"linear-gradient(135deg,#7c1d0a,#92400e)"}}>
                    <td colSpan={2} style={{padding:"13px 16px",fontSize:13,fontWeight:900,color:"#fde68a"}}>
                      DAILY TOTAL <span style={{fontSize:11,color:"rgba(253,230,138,.7)",fontWeight:600}}>({shown.length} items)</span>
                    </td>
                    <td colSpan={3}></td>
                    <td style={{padding:"13px 10px"}}>
                      <span style={{fontSize:15,fontWeight:900,color:"#fbbf24"}}>{Math.round(mealFilter==="All"?tot.cal:shown.reduce((s,e)=>s+e.cal*e.qty,0))}<span style={{fontSize:10,color:"rgba(251,191,36,.7)",marginLeft:2}}>kcal</span></span>
                    </td>
                    <td style={{padding:"13px 10px",textAlign:"center",fontSize:14,fontWeight:900,color:"#93c5fd"}}>{Math.round(mealFilter==="All"?tot.p:shown.reduce((s,e)=>s+e.p*e.qty,0))}g</td>
                    <td style={{padding:"13px 10px",textAlign:"center",fontSize:14,fontWeight:900,color:"#6ee7b7"}}>{Math.round(mealFilter==="All"?tot.c:shown.reduce((s,e)=>s+e.c*e.qty,0))}g</td>
                    <td style={{padding:"13px 10px",textAlign:"center",fontSize:14,fontWeight:900,color:"#fca5a5"}}>{Math.round(mealFilter==="All"?tot.f:shown.reduce((s,e)=>s+e.f*e.qty,0))}g</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Meal breakdown */}
        {items.length>0&&(
          <div>
            <div style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:1,color:"#6b3a1f",marginBottom:12}}>Meal Breakdown</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:12}}>
              {MEALS.map(m=>{
                const g=items.filter(e=>e.mealTime===m);
                const mC=Math.round(g.reduce((s,e)=>s+e.cal*e.qty,0));
                const mP=Math.round(g.reduce((s,e)=>s+e.p*e.qty,0));
                const mCb=Math.round(g.reduce((s,e)=>s+e.c*e.qty,0));
                const mF=Math.round(g.reduce((s,e)=>s+e.f*e.qty,0));
                return (
                  <div key={m} style={{background:"#fff",borderRadius:16,padding:"14px",border:"1.5px solid rgba(180,140,60,.15)",boxShadow:"0 2px 10px rgba(120,60,0,.06)",opacity:g.length?1:.45}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:12,fontWeight:800,color:"#6b3a1f"}}>{M_ICON[m]} {m}</span>
                      <span style={{fontSize:9,background:"rgba(180,140,60,.12)",color:"#92400e",borderRadius:5,padding:"2px 6px",fontWeight:700}}>{g.length}</span>
                    </div>
                    <div style={{fontSize:18,fontWeight:900,color:"#c2410c",marginBottom:4}}>{mC}<span style={{fontSize:10,fontWeight:600,color:"#a87c3a",marginLeft:2}}>kcal</span></div>
                    <div style={{height:4,background:"rgba(180,140,60,.15)",borderRadius:99,overflow:"hidden",marginBottom:8}}>
                      <div style={{width:Math.min(100,mC/targets.cal*100)+"%",height:"100%",background:"linear-gradient(90deg,#c2410c,#f97316)",borderRadius:99}}></div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontWeight:700}}>
                      <span style={{color:"#2563eb"}}>P:{mP}g</span>
                      <span style={{color:"#059669"}}>C:{mCb}g</span>
                      <span style={{color:"#dc2626"}}>F:{mF}g</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
