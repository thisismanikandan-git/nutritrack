import { useState } from "react";
import { calcTargets, ACTIVITY_OPTS } from "../utils/helpers";

export default function ProfilePanel({profile,onSave,onClose}){
  const [d,setD]=useState({...profile});
  const t=calcTargets(d);
  const set=(k,v)=>setD(p=>({...p,[k]:v}));
  const Stp=({label,val,unit,dec,inc})=>(
    <div style={{flex:1,minWidth:110}}>
      <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,color:"#8a6a30",marginBottom:5}}>{label}</div>
      <div style={{display:"flex",alignItems:"center",background:"rgba(180,140,60,.08)",border:"1.5px solid rgba(180,140,60,.25)",borderRadius:10,overflow:"hidden"}}>
        <button onClick={dec} style={{width:34,height:38,border:"none",background:"transparent",color:"#c2410c",fontSize:20,cursor:"pointer",fontWeight:700}}>-</button>
        <span style={{flex:1,textAlign:"center",fontSize:15,fontWeight:700,color:"#1c0a00"}}>{val}</span>
        <button onClick={inc} style={{width:34,height:38,border:"none",background:"transparent",color:"#c2410c",fontSize:20,cursor:"pointer",fontWeight:700}}>+</button>
      </div>
      <div style={{fontSize:10,color:"#c9a96e",marginTop:3,textAlign:"center"}}>{unit}</div>
    </div>
  );
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:560,margin:"0 auto",background:"#fffbf0",borderRadius:"24px 24px 0 0",padding:"24px 20px 32px",boxShadow:"0 -12px 48px rgba(120,60,0,.2)",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:"rgba(180,140,60,.3)",borderRadius:99,margin:"0 auto 20px"}}></div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:"#1c0a00",marginBottom:18}}>Your Profile</div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
          <Stp label="Current Weight" val={d.currentWeight} unit="kg" dec={()=>set("currentWeight",Math.max(40,d.currentWeight-.5))} inc={()=>set("currentWeight",Math.min(200,d.currentWeight+.5))} />
          <Stp label="Goal Weight"    val={d.goalWeight}    unit="kg" dec={()=>set("goalWeight",Math.max(40,d.goalWeight-.5))}       inc={()=>set("goalWeight",Math.min(200,d.goalWeight+.5))}       />
          <Stp label="Height"         val={d.height}        unit="cm" dec={()=>set("height",Math.max(130,d.height-1))}              inc={()=>set("height",Math.min(220,d.height+1))}              />
          <Stp label="Age"            val={d.age}           unit="yrs"dec={()=>set("age",Math.max(10,d.age-1))}                     inc={()=>set("age",Math.min(100,d.age+1))}                    />
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,color:"#8a6a30",marginBottom:6}}>Gender</div>
          <div style={{display:"flex",gap:8}}>
            {["male","female"].map(g=>(
              <button key={g} onClick={()=>set("gender",g)} style={{flex:1,padding:"9px",borderRadius:10,border:`1.5px solid ${d.gender===g?"#d97706":"rgba(180,140,60,.25)"}`,background:d.gender===g?"rgba(217,119,6,.12)":"transparent",color:d.gender===g?"#b45309":"#8a6a30",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                {g==="male"?"Male":"Female"}
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,color:"#8a6a30",marginBottom:6}}>Activity Level</div>
          {ACTIVITY_OPTS.map(o=>(
            <button key={o.factor} onClick={()=>set("activity",o.factor)} style={{width:"100%",marginBottom:6,padding:"9px 14px",borderRadius:10,border:`1.5px solid ${d.activity===o.factor?"#d97706":"rgba(180,140,60,.2)"}`,background:d.activity===o.factor?"rgba(217,119,6,.1)":"transparent",color:d.activity===o.factor?"#b45309":"#8a6a30",fontSize:12,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
              <b>{o.label}</b><span style={{opacity:.8}}>{o.desc}</span>
            </button>
          ))}
        </div>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,color:"#8a6a30"}}>Goal Duration</div>
            <span style={{fontSize:12,fontWeight:800,color:t.paceClr,background:t.paceClr+"18",borderRadius:8,padding:"3px 10px"}}>{d.targetWeeks} wks &middot; {t.pace}</span>
          </div>
          <input type="range" min={4} max={104} step={1} value={d.targetWeeks} onChange={e=>set("targetWeeks",+e.target.value)} style={{width:"100%",accentColor:"#c2410c",cursor:"pointer"}} />
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            {[{l:"1 Month",w:4},{l:"3 Months",w:13},{l:"6 Months",w:26},{l:"1 Year",w:52},{l:"2 Years",w:104}].map(p=>(
              <button key={p.w} onClick={()=>set("targetWeeks",p.w)} style={{padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",border:`1.5px solid ${d.targetWeeks===p.w?"#d97706":"rgba(180,140,60,.2)"}`,background:d.targetWeeks===p.w?"rgba(217,119,6,.12)":"transparent",color:d.targetWeeks===p.w?"#b45309":"#8a6a30"}}>
                {p.l}
              </button>
            ))}
          </div>
        </div>
        <div style={{background:"rgba(180,140,60,.08)",border:"1.5px dashed rgba(180,140,60,.3)",borderRadius:12,padding:"12px 14px",marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:"#b45309",marginBottom:8,textTransform:"uppercase",letterSpacing:.8}}>Calculated Daily Targets</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px 20px",fontSize:12,color:"#5a3e1b"}}>
            <span>Calories: <b>{t.cal} kcal</b></span>
            <span>Protein: <b>{t.protein}g</b></span>
            <span>Fat: <b>{t.fat}g</b></span>
            <span>Carbs: <b>{t.carbs}g</b></span>
            <span>Weekly loss: <b>{t.wkLoss} kg</b></span>
            <span>Est. finish: <b>~{t.projWks} wks</b></span>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid rgba(180,140,60,.3)",background:"transparent",color:"#8a6a30",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={()=>{onSave(d);onClose();}} style={{flex:2,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#b45309,#d97706)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer"}}>Save Profile</button>
        </div>
      </div>
    </div>
  );
}
