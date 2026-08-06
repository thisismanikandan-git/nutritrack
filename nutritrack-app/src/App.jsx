import { useState, useEffect } from "react";
import AmbientBackground from "./components/AmbientBackground";
import Sheet from "./components/Sheet";
import ProfilePanel from "./components/ProfilePanel";
import { FOODS, FOOD_CATS } from "./data/foods";
import { INGREDIENTS, ING_CATS } from "./data/ingredients";
import { MEATS, MEAT_CATS } from "./data/meats";
import { RECIPES, RECIPE_CATS } from "./data/recipes";
import { TODAY, FMT_D, loadLS, saveLS, MEALS, M_ICON, calcTargets, DEFAULT_PROFILE } from "./utils/helpers";

export default function App(){
  const [profile,  setProfile]   = useState(()=>({...DEFAULT_PROFILE,...loadLS("nt_profile",{})}));
  const [date,     setDate]      = useState(TODAY());
  const [log,      setLog]       = useState(()=>loadLS("nt_log",{}));
  const [history,  setHistory]   = useState([]);   // undo stack
  const [view,     setView]      = useState("home");
  const [tab,      setTab]       = useState("foods");
  const [search,   setSearch]    = useState("");
  const [foodCat,  setFoodCat]   = useState("All");
  const [ingCat,   setIngCat]    = useState("All");
  const [meatCat,  setMeatCat]   = useState("All");
  const [recipeCat,setRecipeCat] = useState("All");
  const [meal,     setMeal]      = useState("Breakfast");
  const [picker,   setPicker]    = useState(null);
  const [pickQty,  setPickQty]   = useState(1);
  const [showProf, setShowProf]  = useState(false);
  const [openRecipe, setOpenRecipe] = useState(null);
  const [aiQuery,   setAiQuery]   = useState("");
  const [aiStatus,  setAiStatus]  = useState("idle"); // idle | loading | error
  const [aiError,   setAiError]   = useState("");

  const targets  = calcTargets(profile);
  const dayLog   = log[date]||[];
  const hour     = new Date().getHours();
  const greet    = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const greetE   = hour<12?"🌅":hour<17?"☀️":"🌙";

  useEffect(()=>{ saveLS("nt_log",log);     },[log]);
  useEffect(()=>{ saveLS("nt_profile",profile); },[profile]);

  // Ctrl+Z undo
  useEffect(()=>{
    const fn=e=>{ if((e.ctrlKey||e.metaKey)&&e.key==="z"&&!e.shiftKey){ e.preventDefault(); undo(); } };
    window.addEventListener("keydown",fn);
    return ()=>window.removeEventListener("keydown",fn);
  });

  const tot = dayLog.reduce((t,e)=>({cal:t.cal+e.cal*e.qty,p:t.p+e.p*e.qty,f:t.f+e.f*e.qty,c:t.c+e.c*e.qty}),{cal:0,p:0,f:0,c:0});
  const calPct  = Math.min(100,(tot.cal/targets.cal)*100);
  const calOver = tot.cal>targets.cal;

  // Undo system
  function snap(){ const s={date,entries:JSON.parse(JSON.stringify(log[date]||[]))}; setHistory(h=>[s,...h].slice(0,10)); }
  function undo(){ setHistory(h=>{ if(!h.length)return h; const[top,...rest]=h; setLog(p=>({...p,[top.date]:top.entries})); return rest; }); }
  function mut(fn){ snap(); setLog(fn); }

  function removeItem(i)   { mut(prev=>({...prev,[date]:prev[date].filter((_,j)=>j!==i)})); }
  function changeQty(i,v)  { mut(prev=>({...prev,[date]:prev[date].map((e,j)=>j===i?{...e,qty:v}:e)})); }
  function changeMeal(i,m) { mut(prev=>({...prev,[date]:prev[date].map((e,j)=>j===i?{...e,mealTime:m}:e)})); }
  function clearDay()      { mut(prev=>({...prev,[date]:[]})); }

  function openPicker(food){ setPicker(food); setPickQty(1); }
  function confirmAdd(){
    if(!picker) return;
    snap();
    setLog(prev=>({...prev,[date]:[...(prev[date]||[]),{...picker,qty:pickQty,mealTime:meal,rowId:Date.now()}]}));
    setPicker(null);
  }

  function switchTab(t){ setTab(t); setSearch(""); setFoodCat("All"); setIngCat("All"); setMeatCat("All"); setRecipeCat("All"); }

  // Extracts the first well-formed JSON object from a string by counting
  // braces (handles quoted strings so braces inside text don't confuse it).
  // This is far more reliable than a greedy regex when the model adds any
  // preamble/explanation text around the JSON payload.
  function extractJsonObject(text){
    const start = text.indexOf("{");
    if(start === -1) return null;
    let depth = 0, inStr = false, esc = false;
    for(let i = start; i < text.length; i++){
      const ch = text[i];
      if(esc){ esc = false; continue; }
      if(ch === "\\" && inStr){ esc = true; continue; }
      if(ch === "\""){ inStr = !inStr; continue; }
      if(inStr) continue;
      if(ch === "{") depth++;
      else if(ch === "}"){
        depth--;
        if(depth === 0) return text.slice(start, i+1);
      }
    }
    return null; // unbalanced / truncated
  }

  // -- AI Web Search: fetch cooking instructions for ANY dish, ANY cuisine, via a Google-grounded search --
  async function searchWebRecipe(dishName){
    if(!dishName.trim()) return;
    setAiStatus("loading");
    setAiError("");
    try{
      const prompt = "Search the web for an authentic, well-reviewed recipe for the dish: \""+dishName.trim()+"\". "+
        "This can be from ANY cuisine in the world — Indian, Italian, Chinese, Mexican, Thai, American, "+
        "Middle Eastern, French, Japanese, or anything else — do not restrict your search to any single region. "+
        "Find the ingredients list and step-by-step cooking method from a reliable food website. "+
        "After you finish searching, your FINAL message must contain ONLY a single JSON object and "+
        "absolutely nothing else — no preamble like \"Here is the recipe\", no markdown, no code fences, "+
        "no closing remarks. The JSON must match exactly this shape: "+
        "{\"name\":\"Dish Name\",\"cuisine\":\"e.g. Italian, Tamil Nadu, Sichuan, Mexican, etc — be specific\","+
        "\"cat\":\"best matching category, choose freely, e.g. Breakfast, Curry, Rice, Pasta, Soup, Salad, "+
        "Dessert, Snack, Drink, Grill/BBQ, Bread, Seafood, Vegan, Non-Veg Curry, Biryani, Street Food, etc\","+
        "\"time\":\"approx total time e.g. 30 min\","+
        "\"difficulty\":\"Easy or Medium or Hard\",\"serves\":4,\"ingredients\":[\"ingredient 1\",\"ingredient 2\"],"+
        "\"steps\":[\"step 1 in your own words\",\"step 2 in your own words\"]}. "+
        "Paraphrase all steps and ingredients in your own words, do not copy text verbatim from any source. "+
        "Keep steps concise (max 10 steps) so the JSON stays compact.";

      // IMPORTANT: this must point at YOUR OWN backend proxy, not directly at
      // api.anthropic.com. Browsers cannot call the Anthropic API directly —
      // it will fail on CORS, and exposing your API key in client code is
      // insecure. Set VITE_RECIPE_API_URL in your .env file to a small
      // backend endpoint (see server/ folder) that forwards this request to
      // Anthropic with your API key attached server-side.
      const apiUrl = import.meta.env.VITE_RECIPE_API_URL || "/api/recipe-search";

      const res = await fetch(apiUrl, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:2048,
          messages:[{role:"user", content:prompt}],
          tools:[{type:"web_search_20250305", name:"web_search"}],
        }),
      });

      const data = await res.json();

      if(!res.ok || data.error){
        throw new Error((data.error && data.error.message) || ("API error "+res.status));
      }

      const textBlocks = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text);
      if(textBlocks.length===0) throw new Error("The model didn't return any text — try again.");

      // Prefer the LAST text block first (that's where the final JSON answer
      // lives after web search), then fall back to scanning earlier blocks
      // and finally the full joined text, in case ordering differs.
      const candidates = [
        textBlocks[textBlocks.length-1],
        ...textBlocks.slice(0,-1).reverse(),
        textBlocks.join("\n"),
      ];

      let jsonStr = null;
      for(const candidate of candidates){
        const cleaned = candidate.replace(/```json|```/g,"").trim();
        const found = extractJsonObject(cleaned);
        if(found){ jsonStr = found; break; }
      }
      if(!jsonStr) throw new Error("Couldn't find a valid recipe in the response — try rephrasing the dish name.");

      let parsed;
      try{
        parsed = JSON.parse(jsonStr);
      }catch{
        throw new Error("The recipe data was malformed (possibly cut off) — try again.");
      }

      const recipe = {
        id:"web_"+Date.now(),
        foodId:null,
        name: parsed.name || dishName,
        cuisine: parsed.cuisine || "",
        cat: parsed.cat || "Recipes",
        time: parsed.time || "—",
        difficulty: parsed.difficulty || "Medium",
        serves: parsed.serves || 4,
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        fromWeb: true,
      };

      if(recipe.ingredients.length===0 && recipe.steps.length===0){
        throw new Error("The recipe came back empty — try a more specific dish name.");
      }

      setAiStatus("idle");
      setAiQuery("");
      setOpenRecipe(recipe);
    }catch(err){
      setAiStatus("error");
      setAiError(err && err.message ? err.message : "Could not fetch a recipe from the web. Please try again.");
    }
  }

  const filteredFoods   = FOODS.filter(f=>(foodCat==="All"||f.cat===foodCat)&&f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredIngs    = INGREDIENTS.filter(f=>(ingCat==="All"||f.cat===ingCat)&&f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredMeats   = MEATS.filter(f=>(meatCat==="All"||f.cat===meatCat)&&f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredRecipes = RECIPES.filter(r=>(recipeCat==="All"||r.cat===recipeCat)&&r.name.toLowerCase().includes(search.toLowerCase()));

  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().slice(0,10); });

  const TABS = [
    {id:"foods",       icon:"🍛", label:"Foods",       count:FOODS.length,       accent:"#c2410c", shadow:"rgba(194,65,12,.28)"},
    {id:"ingredients", icon:"🌿", label:"Ingredients", count:INGREDIENTS.length, accent:"#059669", shadow:"rgba(5,150,105,.28)"},
    {id:"meats",       icon:"🥩", label:"Meat & Eggs", count:MEATS.length,       accent:"#7c3aed", shadow:"rgba(124,58,237,.28)"},
    {id:"recipes",     icon:"📖", label:"Recipes",     count:RECIPES.length,     accent:"#db2777", shadow:"rgba(219,39,119,.28)"},
  ];


  if(view==="sheet") return (
    <Sheet items={dayLog} targets={targets}
      onRemove={removeItem} onChangeQty={changeQty} onChangeMeal={changeMeal}
      onClear={clearDay} onBack={()=>setView("home")}
      onUndo={undo} undoSteps={history.length} />
  );

  function FoodRow({food,accentClr}){
    const isSel = picker?.id===food.id;
    return (
      <div onClick={()=>openPicker(food)}
        style={{padding:"11px 12px",borderRadius:12,marginBottom:4,cursor:"pointer",
          display:"flex",alignItems:"center",gap:10,
          background:isSel?"rgba(255,255,255,0.55)":"rgba(255,255,255,0.28)",
          border:"1px solid rgba(255,255,255,0.5)",
          backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",
          transition:"all .15s"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:"#1c0a00"}}>{food.name}</div>
          <div style={{fontSize:11,marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
            <b style={{color:accentClr||"#c2410c"}}>{food.cal} kcal</b>
            <span style={{color:"#2563eb"}}>P:{food.p}g</span>
            <span style={{color:"#059669"}}>C:{food.c}g</span>
            <span style={{color:"#dc2626"}}>F:{food.f}g</span>
            {food.fiber!==undefined&&<span style={{color:"#6b7280"}}>Fb:{food.fiber}g</span>}
          </div>
        </div>
        <span style={{fontSize:10,background:accentClr?accentClr+"18":"rgba(180,140,60,.1)",color:accentClr||"#92400e",borderRadius:6,padding:"2px 8px",fontWeight:700,flexShrink:0}}>{food.cat}</span>
        <div style={{width:30,height:30,borderRadius:9,
          background:`linear-gradient(135deg,${accentClr||"#c2410c"},${accentClr||"#ea580c"})`,
          display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:18,fontWeight:700,
          flexShrink:0,boxShadow:`0 2px 8px ${(accentClr||"#c2410c")}44`}}>
          +
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"transparent",fontFamily:"'Nunito',sans-serif",paddingBottom:80,position:"relative"}}>
      <AmbientBackground />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Nunito:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tabIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes ambientFloat{0%{transform:translateY(0) rotate(var(--r0)) scale(1)}50%{transform:translateY(var(--dr)) rotate(var(--r1)) scale(1.08)}100%{transform:translateY(0) rotate(var(--r0)) scale(1)}}
        .frow:hover{background:rgba(255,255,255,.55)!important}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#d97706;border-radius:99px}
        input,select,button,textarea{font-family:'Nunito',sans-serif}
      `}</style>

      <div style={{position:"relative",zIndex:1}}>
      {/* -- Sticky Header -- */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"linear-gradient(135deg,#7c1d0a,#92400e,#c2410c)",boxShadow:"0 4px 20px rgba(120,40,0,.25)"}}>
        <div style={{height:4,background:"linear-gradient(90deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#ef4444)",backgroundSize:"200% 100%",animation:"shimmer 4s linear infinite"}}></div>
        <div style={{maxWidth:680,margin:"0 auto",padding:"11px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginRight:"auto"}}>
            <span style={{fontSize:22,filter:"drop-shadow(0 2px 6px rgba(0,0,0,.3))"}}>🥘</span>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,color:"#fff",lineHeight:1}}>NutriTrack</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,.6)",letterSpacing:1.4,textTransform:"uppercase"}}>South Indian</div>
            </div>
          </div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.25)",borderRadius:9,padding:"6px 10px",color:"#fff",fontSize:12,cursor:"pointer",outline:"none"}} />
          <button onClick={()=>setView("sheet")} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.25)",borderRadius:9,padding:"7px 12px",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer"}}>
            📋{dayLog.length>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:99,padding:"1px 6px",fontSize:10,fontWeight:900}}>{dayLog.length}</span>}
          </button>
          <button onClick={()=>setShowProf(true)} style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#fde68a,#fbbf24)",border:"2px solid rgba(255,255,255,.3)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#7c1d0a",flexShrink:0}}>
            &#9881;
          </button>
        </div>
      </div>

      <div style={{maxWidth:680,margin:"0 auto",padding:"0 16px"}}>

        {/* -- GLASSMORPHISM HERO CARD -- */}
        <div style={{margin:"20px 0 18px",borderRadius:28,background:"linear-gradient(135deg,rgba(255,255,255,.38) 0%,rgba(255,255,255,.18) 100%)",backdropFilter:"blur(28px) saturate(180%)",WebkitBackdropFilter:"blur(28px) saturate(180%)",border:"1.5px solid rgba(255,255,255,.55)",boxShadow:"0 20px 60px rgba(120,60,0,.18),inset 0 1px 0 rgba(255,255,255,.7)",overflow:"hidden",position:"relative",animation:"slideUp .45s cubic-bezier(.34,1.56,.64,1)"}}>
          {/* Colour blobs */}
          <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,background:"radial-gradient(circle,rgba(234,88,12,.35),transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}></div>
          <div style={{position:"absolute",bottom:-50,left:-30,width:200,height:200,background:"radial-gradient(circle,rgba(251,191,36,.28),transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}></div>
          <div style={{position:"absolute",top:60,left:"50%",transform:"translateX(-50%)",width:140,height:140,background:"radial-gradient(circle,rgba(34,197,94,.15),transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}></div>

          <div style={{position:"relative",padding:"22px 20px 18px"}}>
            {/* Greeting + calorie ring */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:"#1c0a00",lineHeight:1.1}}>{greet} {greetE}</div>
                <div style={{fontSize:11,color:"#7c4a1a",marginTop:3,fontWeight:600}}>{FMT_D(date)}{date===TODAY()?" - Today":""}</div>
              </div>
              <div style={{position:"relative",width:80,height:80}}>
                <svg width={80} height={80} style={{transform:"rotate(-90deg)"}}>
                  <defs>
                    <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                  <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(180,140,60,.18)" strokeWidth={8} />
                  <circle cx={40} cy={40} r={32} fill="none" stroke={calOver?"#ef4444":"url(#cg)"} strokeWidth={8} strokeLinecap="round" strokeDasharray={2*Math.PI*32} strokeDashoffset={2*Math.PI*32*(1-calPct/100)} style={{transition:"stroke-dashoffset .7s"}} />
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:15,fontWeight:900,color:calOver?"#ef4444":"#1c0a00",lineHeight:1}}>{Math.round(tot.cal)}</div>
                  <div style={{fontSize:8,color:"#92400e",fontWeight:700}}>kcal</div>
                </div>
              </div>
            </div>

            {/* Remaining label */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:800,color:calOver?"#dc2626":"#059669"}}>
                {calOver ? "⚠ "+Math.abs(Math.round(targets.cal-tot.cal))+" kcal OVER" : "✓ "+Math.round(targets.cal-tot.cal)+" kcal left"}
              </span>
              <span style={{fontSize:11,color:"#9a6a30"}}>Goal: {targets.cal} kcal</span>
            </div>

            {/* Calorie bar */}
            <div style={{height:6,background:"rgba(180,140,60,.15)",borderRadius:99,overflow:"hidden",marginBottom:20,boxShadow:"inset 0 1px 3px rgba(0,0,0,.08)"}}>
              <div style={{width:calPct+"%",height:"100%",borderRadius:99,background:calOver?"linear-gradient(90deg,#f97316,#ef4444)":"linear-gradient(90deg,#22c55e,#f59e0b,#f97316)",transition:"width .7s"}}></div>
            </div>

            {/* 4 macro glass pills */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
              {[
                {label:"Protein",  val:tot.p,  max:targets.protein, unit:"g", color:"#3b82f6", bg:"rgba(59,130,246,.12)",  icon:"💪"},
                {label:"Carbs",    val:tot.c,  max:targets.carbs,   unit:"g", color:"#f59e0b", bg:"rgba(245,158,11,.12)",  icon:"🌾"},
                {label:"Fat",      val:tot.f,  max:targets.fat,     unit:"g", color:"#ef4444", bg:"rgba(239,68,68,.12)",   icon:"💧"},
                {label:"Items",    val:dayLog.length, max:null,     unit:"",  color:"#8b5cf6", bg:"rgba(139,92,246,.12)", icon:"🍽️"},
              ].map(m=>{
                const over=m.max&&m.val>m.max;
                const pct=m.max?Math.min(100,(m.val/m.max)*100):0;
                return (
                  <div key={m.label} style={{background:over?"rgba(239,68,68,.12)":m.bg,borderRadius:16,border:"1px solid rgba(255,255,255,.5)",padding:"10px 8px 8px",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",boxShadow:"0 2px 12px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.6)",textAlign:"center",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${m.color}88,transparent)`,borderRadius:"16px 16px 0 0"}}></div>
                    <div style={{fontSize:14,marginBottom:2}}>{m.icon}</div>
                    <div style={{fontSize:17,fontWeight:900,color:over?"#ef4444":m.color,lineHeight:1}}>{Math.round(m.val)}{m.unit}</div>
                    <div style={{fontSize:9,color:"#7c4a1a",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginTop:2}}>{m.label}</div>
                    {m.max&&(
                      <div style={{marginTop:5,height:3,background:"rgba(0,0,0,.08)",borderRadius:99,overflow:"hidden"}}>
                        <div style={{width:pct+"%",height:"100%",background:over?"#ef4444":m.color,borderRadius:99,transition:"width .6s"}}></div>
                      </div>
                    )}
                    {m.max&&<div style={{fontSize:8,color:"#a87c3a",marginTop:3}}>{over?"OVER":"/ "+m.max+m.unit}</div>}
                  </div>
                );
              })}
            </div>

            {/* Over-limit alert */}
            {(calOver||tot.p>targets.protein||tot.f>targets.fat||tot.c>targets.carbs)&&(
              <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:12,padding:"8px 12px",display:"flex",gap:8,flexWrap:"wrap"}}>
                {calOver&&<span style={{fontSize:10,fontWeight:800,background:"rgba(239,68,68,.15)",color:"#ef4444",borderRadius:6,padding:"2px 8px"}}>Calories OVER</span>}
                {tot.p>targets.protein&&<span style={{fontSize:10,fontWeight:800,background:"rgba(37,99,235,.1)",color:"#2563eb",borderRadius:6,padding:"2px 8px"}}>Protein OVER</span>}
                {tot.f>targets.fat&&<span style={{fontSize:10,fontWeight:800,background:"rgba(239,68,68,.1)",color:"#dc2626",borderRadius:6,padding:"2px 8px"}}>Fat OVER</span>}
                {tot.c>targets.carbs&&<span style={{fontSize:10,fontWeight:800,background:"rgba(217,119,6,.1)",color:"#d97706",borderRadius:6,padding:"2px 8px"}}>Carbs OVER</span>}
              </div>
            )}
          </div>
        </div>

        {/* -- 7-day history -- */}
        <div style={{background:"linear-gradient(135deg,rgba(255,255,255,.32),rgba(255,255,255,.14))",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",borderRadius:20,padding:"14px 16px",border:"1.5px solid rgba(255,255,255,.5)",boxShadow:"0 8px 32px rgba(120,60,0,.1),inset 0 1px 0 rgba(255,255,255,.65)",marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:1,color:"#6b3a1f",marginBottom:10}}>7-Day History</div>
          <div style={{display:"flex",gap:4,alignItems:"flex-end",height:52}}>
            {last7.map(d=>{
              const dCal=(log[d]||[]).reduce((s,e)=>s+e.cal*e.qty,0);
              const pct=Math.min(100,(dCal/targets.cal)*100);
              const isToday=d===date;
              const over=dCal>targets.cal;
              return (
                <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}} onClick={()=>setDate(d)}>
                  <div style={{width:"100%",height:44,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
                    <div style={{width:"80%",height:Math.max(3,pct*.44)+"px",background:isToday?"#c2410c":over?"#ef4444":"#d97706",borderRadius:"4px 4px 0 0",opacity:isToday?1:.55,transition:"height .4s",boxShadow:isToday?"0 2px 8px rgba(194,65,12,.4)":"none"}}></div>
                  </div>
                  <div style={{fontSize:9,color:isToday?"#c2410c":"#a87c3a",fontWeight:isToday?800:600,textAlign:"center"}}>
                    {new Date(d+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short"}).slice(0,2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* -- Meal selector -- */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:"#92400e",marginBottom:8}}>Adding to</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {MEALS.map(m=>(
              <button key={m} onClick={()=>setMeal(m)} style={{background:meal===m?"#c2410c":"rgba(255,255,255,.75)",border:"1.5px solid "+(meal===m?"#c2410c":"rgba(180,140,60,.22)"),borderRadius:9,padding:"7px 13px",fontSize:12,fontWeight:700,color:meal===m?"#fff":"#92400e",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:5}}>
                <span>{M_ICON[m]}</span>{m}
              </button>
            ))}
          </div>
        </div>

        {/* -- 3 GLASS SEGMENT TABS -- */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
          {TABS.map(t=>{
            const active=tab===t.id;
            return (
              <button key={t.id} onClick={()=>switchTab(t.id)}
                style={{position:"relative",border:"none",cursor:"pointer",
                  background:active?"linear-gradient(145deg,rgba(255,255,255,.72),rgba(255,255,255,.42))":"linear-gradient(145deg,rgba(255,255,255,.28),rgba(255,255,255,.12))",
                  backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
                  borderRadius:20,
                  outline:active?"2px solid "+t.accent+"55":"1.5px solid rgba(255,255,255,.45)",
                  boxShadow:active?"0 8px 28px "+t.shadow+",inset 0 1px 0 rgba(255,255,255,.8)":"0 4px 14px rgba(120,60,0,.07),inset 0 1px 0 rgba(255,255,255,.6)",
                  padding:"13px 6px 11px",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:6,
                  transform:active?"translateY(-2px) scale(1.02)":"translateY(0) scale(1)",
                  transition:"all .25s cubic-bezier(.34,1.56,.64,1)",
                  overflow:"hidden"}}>
                {/* Glow blob */}
                <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",width:60,height:60,background:"radial-gradient(circle,"+t.accent+"22,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}></div>
                {/* Count badge top-right */}
                <div style={{position:"absolute",top:8,right:8,background:active?t.accent:"rgba(180,140,60,.25)",color:active?"#fff":"#7c4a1a",borderRadius:99,fontSize:9,fontWeight:900,padding:"2px 6px",lineHeight:1.4,boxShadow:active?"0 2px 8px "+t.accent+"44":"none",transition:"all .25s"}}>
                  {t.count}
                </div>
                {/* Icon */}
                <div style={{fontSize:active?26:22,lineHeight:1,filter:active?"drop-shadow(0 3px 8px "+t.accent+"55)":"none",transition:"all .25s"}}>
                  {t.icon}
                </div>
                {/* Label */}
                <div style={{fontSize:10,fontWeight:active?800:600,color:active?t.accent:"#7c4a1a",letterSpacing:.2,textAlign:"center",lineHeight:1.15}}>
                  {t.label}
                </div>
                {/* Active underline */}
                {active&&<div style={{position:"absolute",bottom:0,left:"20%",right:"20%",height:3,background:t.accent,borderRadius:"3px 3px 0 0",boxShadow:"0 0 8px "+t.accent+"88"}}></div>}
              </button>
            );
          })}
        </div>

        {/* -- BROWSER GLASS PANEL -- */}
        <div style={{background:"linear-gradient(145deg,rgba(255,255,255,.52),rgba(255,255,255,.26))",backdropFilter:"blur(22px)",WebkitBackdropFilter:"blur(22px)",borderRadius:20,padding:"16px",border:"1.5px solid rgba(255,255,255,.55)",boxShadow:tab==="meats"?"0 8px 32px rgba(124,58,237,.1),inset 0 1px 0 rgba(255,255,255,.75)":tab==="ingredients"?"0 8px 32px rgba(5,150,105,.1),inset 0 1px 0 rgba(255,255,255,.75)":tab==="recipes"?"0 8px 32px rgba(219,39,119,.1),inset 0 1px 0 rgba(255,255,255,.75)":"0 8px 32px rgba(194,65,12,.09),inset 0 1px 0 rgba(255,255,255,.75)",transition:"box-shadow .3s",marginBottom:18}}>
          {/* Search */}
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1,position:"relative"}}>
              <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:.4}}>&#128269;</span>
              <input
                placeholder={tab==="foods"?"Search dishes...":tab==="ingredients"?"Search ingredients...":tab==="recipes"?"Search recipes...":"Search meat, fish, eggs..."}
                value={search} onChange={e=>setSearch(e.target.value)}
                style={{width:"100%",padding:"10px 14px 10px 38px",background:"rgba(255,255,255,.55)",border:"1.5px solid rgba(255,255,255,.6)",borderRadius:12,fontSize:13,color:"#1c0a00",outline:"none",boxShadow:"inset 0 1px 3px rgba(0,0,0,.06)"}} />
            </div>
            {search&&<button onClick={()=>setSearch("")} style={{background:"rgba(255,255,255,.5)",border:"1.5px solid rgba(255,255,255,.6)",borderRadius:10,padding:"0 14px",color:"#92400e",fontSize:14,cursor:"pointer",fontWeight:700}}>&#215;</button>}
          </div>

          {/* Category chips */}
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:12}}>
            {(tab==="foods"?FOOD_CATS:tab==="ingredients"?ING_CATS:tab==="recipes"?RECIPE_CATS:MEAT_CATS).map(c=>{
              const curCat=tab==="foods"?foodCat:tab==="ingredients"?ingCat:tab==="recipes"?recipeCat:meatCat;
              const setter=tab==="foods"?setFoodCat:tab==="ingredients"?setIngCat:tab==="recipes"?setRecipeCat:setMeatCat;
              const ac=tab==="meats"?"#7c3aed":tab==="ingredients"?"#059669":tab==="recipes"?"#db2777":"#c2410c";
              const active=curCat===c;
              return (
                <button key={c} onClick={()=>setter(c)}
                  style={{background:active?"linear-gradient(135deg,"+ac+","+ac+"cc)":"rgba(255,255,255,.45)",border:"1.5px solid "+(active?ac+"66":"rgba(255,255,255,.55)"),borderRadius:20,padding:"5px 13px",fontSize:11,fontWeight:700,color:active?"#fff":"#7c4a1a",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",boxShadow:active?"0 3px 10px "+ac+"44":"0 1px 4px rgba(0,0,0,.06)",transition:"all .2s"}}>
                  {c}
                </button>
              );
            })}
          </div>

          {/* AI Web Search - Recipes tab only */}
          {tab==="recipes"&&(
            <div style={{background:"linear-gradient(135deg,rgba(219,39,119,.08),rgba(190,24,93,.06))",border:"1.5px dashed rgba(219,39,119,.3)",borderRadius:14,padding:"12px 14px",marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:800,color:"#db2777",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                <span>&#127760;</span> Search any recipe from anywhere on the web
              </div>
              <div style={{display:"flex",gap:8}}>
                <input
                  value={aiQuery} onChange={e=>setAiQuery(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter") searchWebRecipe(aiQuery); }}
                  placeholder="Any dish, any cuisine — e.g. Ramen, Tacos, Ghee Roast Dosa, Tiramisu..."
                  style={{flex:1,padding:"9px 13px",background:"rgba(255,255,255,.7)",border:"1.5px solid rgba(219,39,119,.25)",borderRadius:10,fontSize:13,color:"#1c0a00",outline:"none"}} />
                <button onClick={()=>searchWebRecipe(aiQuery)} disabled={!aiQuery.trim()||aiStatus==="loading"}
                  style={{padding:"9px 16px",borderRadius:10,border:"none",cursor:aiQuery.trim()?"pointer":"not-allowed",
                    background: aiStatus==="loading" ? "rgba(219,39,119,.4)" : aiQuery.trim() ? "linear-gradient(135deg,#db2777,#be185d)" : "rgba(180,140,60,.2)",
                    color: aiQuery.trim() ? "#fff" : "#c9a96e",
                    fontSize:12, fontWeight:800, display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                  {aiStatus==="loading"
                    ? <><span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}></span> Searching</>
                    : <>&#128269; Search</>}
                </button>
              </div>
              {aiStatus==="error"&&(
                <div style={{marginTop:8,fontSize:11,color:"#dc2626",fontWeight:600}}>&#9888; {aiError}</div>
              )}
              <div style={{marginTop:6,fontSize:10,color:"#a87c3a"}}>Not limited to South Indian food &middot; any world cuisine &middot; results are paraphrased, not copied verbatim</div>
            </div>
          )}

          {/* Food list */}
          <div style={{maxHeight:360,overflowY:"auto"}}>
            {tab==="foods"&&(
              filteredFoods.length===0
                ? <div style={{textAlign:"center",color:"#c9a96e",fontSize:13,padding:"28px 0"}}>No dishes found</div>
                : filteredFoods.map(f=>(
                    <FoodRow key={f.id} food={f} accentClr={f.cat==="Non-Veg Curry"?"#7c3aed":f.cat==="Egg Dishes"?"#d97706":f.cat==="Biryani"?"#0891b2":f.cat==="Tamil Nadu"?"#b45309":f.cat==="Kerala"?"#047857":f.cat==="Karnataka"?"#be185d":undefined} />
                  ))
            )}
            {tab==="ingredients"&&(
              filteredIngs.length===0
                ? <div style={{textAlign:"center",color:"#c9a96e",fontSize:13,padding:"28px 0"}}>No ingredients found</div>
                : filteredIngs.map(f=><FoodRow key={f.id} food={f} accentClr="#059669" />)
            )}
            {tab==="meats"&&(
              filteredMeats.length===0
                ? <div style={{textAlign:"center",color:"#c9a96e",fontSize:13,padding:"28px 0"}}>No items found</div>
                : filteredMeats.map(f=>(
                    <div key={f.id} onClick={()=>openPicker(f)}
                      style={{padding:"11px 12px",borderRadius:12,marginBottom:4,cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,.28)",border:"1px solid rgba(255,255,255,.5)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",transition:"all .15s"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#1c0a00",display:"flex",alignItems:"center",gap:6}}>
                          {f.name}
                          {f.p>=20&&<span style={{fontSize:9,background:"rgba(37,99,235,.1)",color:"#1d4ed8",borderRadius:5,padding:"1px 5px",fontWeight:800}}>HI PROTEIN</span>}
                        </div>
                        <div style={{fontSize:11,marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
                          <b style={{color:"#7c3aed"}}>{f.cal} kcal</b>
                          <span style={{color:"#2563eb",fontWeight:700}}>P:{f.p}g</span>
                          <span style={{color:"#059669"}}>C:{f.c}g</span>
                          <span style={{color:"#dc2626"}}>F:{f.f}g</span>
                        </div>
                      </div>
                      <span style={{fontSize:10,background:"rgba(124,58,237,.1)",color:"#7c3aed",borderRadius:6,padding:"2px 8px",fontWeight:700,flexShrink:0}}>{f.cat}</span>
                      <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#7c3aed,#6d28d9)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:18,fontWeight:700,flexShrink:0,boxShadow:"0 2px 8px rgba(124,58,237,.3)"}}>+</div>
                    </div>
                  ))
            )}
            {tab==="recipes"&&(
              filteredRecipes.length===0
                ? <div style={{textAlign:"center",color:"#c9a96e",fontSize:13,padding:"28px 0"}}>No recipes found</div>
                : filteredRecipes.map(r=>{
                    const dCal = r.foodId ? (() => { const linked = FOODS.find(f=>f.id===r.foodId); return linked ? linked.cal : null; })() : null;
                    const diffColor = r.difficulty==="Easy"?"#059669":r.difficulty==="Medium"?"#d97706":"#dc2626";
                    return (
                      <div key={r.id} onClick={()=>setOpenRecipe(r)}
                        style={{padding:"12px 12px",borderRadius:12,marginBottom:4,cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,.28)",border:"1px solid rgba(255,255,255,.5)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",transition:"all .15s"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#1c0a00"}}>{r.name}</div>
                          <div style={{fontSize:11,marginTop:3,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                            <span style={{color:"#db2777",fontWeight:700}}>&#9201; {r.time}</span>
                            <span style={{color:diffColor,fontWeight:700}}>&#9889; {r.difficulty}</span>
                            <span style={{color:"#7c4a1a"}}>&#128101; Serves {r.serves}</span>
                            {dCal!==null&&<span style={{color:"#c2410c"}}>&#128293; ~{dCal} kcal/serving</span>}
                          </div>
                        </div>
                        <span style={{fontSize:10,background:"rgba(219,39,119,.1)",color:"#db2777",borderRadius:6,padding:"2px 8px",fontWeight:700,flexShrink:0}}>{r.cat}</span>
                        <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#db2777,#be185d)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15,fontWeight:700,flexShrink:0,boxShadow:"0 2px 8px rgba(219,39,119,.3)"}}>&#128214;</div>
                      </div>
                    );
                  })
            )}
          </div>

          {tab!=="foods"&&tab!=="recipes"&&(
            <div style={{marginTop:12,padding:"10px 14px",background:"rgba(255,255,255,.45)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.6)",borderRadius:12,fontSize:11,color:"#6b7280",display:"flex",flexWrap:"wrap",gap:12}}>
              <span>Per 100g unless noted.</span>
              <span style={{color:"#2563eb"}}>P=Protein</span>
              <span style={{color:"#059669"}}>C=Carbs</span>
              <span style={{color:"#dc2626"}}>F=Fat</span>
              {tab==="ingredients"&&<span>Fiber shown</span>}
            </div>
          )}
          {tab==="recipes"&&(
            <div style={{marginTop:12,padding:"10px 14px",background:"rgba(255,255,255,.45)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.6)",borderRadius:12,fontSize:11,color:"#6b7280",display:"flex",flexWrap:"wrap",gap:12}}>
              <span>Tap a recipe to see full ingredients &amp; step-by-step cooking method.</span>
            </div>
          )}
        </div>

        {/* -- Today's log -- */}
        {dayLog.length>0&&(
          <div style={{marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:1,color:"#6b3a1f"}}>Today's Log</div>
              <button onClick={()=>setView("sheet")} style={{background:"linear-gradient(135deg,#c2410c,#ea580c)",border:"none",borderRadius:8,padding:"5px 14px",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer"}}>Full Sheet &#8594;</button>
            </div>
            {MEALS.filter(m=>dayLog.some(e=>e.mealTime===m)).map(m=>{
              const grp=dayLog.filter(e=>e.mealTime===m);
              const mCal=Math.round(grp.reduce((s,e)=>s+e.cal*e.qty,0));
              return (
                <div key={m} style={{background:"linear-gradient(135deg,rgba(255,255,255,.6),rgba(255,255,255,.35))",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderRadius:16,padding:"12px 14px",marginBottom:8,border:"1.5px solid rgba(255,255,255,.55)",boxShadow:"0 4px 16px rgba(120,60,0,.07),inset 0 1px 0 rgba(255,255,255,.7)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:12,fontWeight:800,color:"#6b3a1f"}}>{M_ICON[m]} {m}</span>
                    <span style={{fontSize:12,fontWeight:800,color:"#c2410c"}}>{mCal} kcal</span>
                  </div>
                  {grp.map((entry)=>{
                    const origIdx=dayLog.indexOf(entry);
                    return (
                      <div key={entry.rowId} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderTop:"1px solid rgba(180,140,60,.08)"}}>
                        <div style={{flex:1,fontSize:12,color:"#1c0a00",fontWeight:600}}>{entry.name}</div>
                        <span style={{fontSize:11,color:"#c2410c",fontWeight:700}}>{Math.round(entry.cal*entry.qty)} kcal</span>
                        <span style={{fontSize:11,color:"#8a6a30"}}>x{entry.qty}</span>
                        <button onClick={()=>removeItem(origIdx)} style={{background:"transparent",border:"none",cursor:"pointer",color:"#c9a96e",fontSize:16,lineHeight:1,padding:"0 2px"}}>&#215;</button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* -- Goal card -- */}
        <div style={{background:"linear-gradient(135deg,rgba(255,255,255,.3),rgba(255,255,255,.14))",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",border:"1.5px solid rgba(255,255,255,.5)",boxShadow:"0 8px 32px rgba(120,60,0,.09),inset 0 1px 0 rgba(255,255,255,.6)",borderRadius:22,padding:"16px 18px",fontSize:12,color:"#8a6a30"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:700,color:"#1c0a00"}}>Weight Loss Plan</div>
            <span style={{fontSize:11,fontWeight:800,color:targets.paceClr,background:targets.paceClr+"18",borderRadius:8,padding:"3px 10px"}}>{targets.pace}</span>
          </div>
          <div style={{background:"rgba(180,140,60,.07)",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#8a6a30",marginBottom:6}}>
              <span>&#127919; {profile.currentWeight} kg now</span>
              <span style={{fontWeight:700,color:targets.paceClr}}>{targets.wkLoss} kg/week</span>
              <span>&#127937; {profile.goalWeight} kg goal</span>
            </div>
            <div style={{height:8,background:"rgba(180,140,60,.15)",borderRadius:99,overflow:"hidden"}}>
              <div style={{width:Math.min(100,((profile.currentWeight-profile.goalWeight)/Math.max(1,profile.currentWeight-profile.goalWeight))*100)+"%",height:"100%",background:"linear-gradient(90deg,"+targets.paceClr+","+targets.paceClr+"bb)",borderRadius:99,transition:"width .6s"}}></div>
            </div>
            <div style={{textAlign:"center",fontSize:11,color:"#9a7c4a",marginTop:5}}>~{targets.projWks} weeks to goal</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px 16px"}}>
            <span>&#128293; Max cal: <b>{targets.cal} kcal</b></span>
            <span>&#128170; Protein: <b>{targets.protein}g</b></span>
            <span>&#128167; Max fat: <b>{targets.fat}g</b></span>
            <span>&#127807; Max carbs: <b>{targets.carbs}g</b></span>
          </div>
          <div style={{marginTop:10,fontSize:11,color:"#c9a96e",borderTop:"1px solid rgba(180,140,60,.15)",paddingTop:8}}>
            Tap &#9881; to update weight, height, age and goal duration
          </div>
        </div>

      </div>

      {/* -- Qty Picker Modal -- */}
      {picker&&(
        <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setPicker(null)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:"#fffbf0",borderRadius:"24px 24px 0 0",padding:"20px 20px 36px",boxShadow:"0 -12px 48px rgba(120,60,0,.25)",animation:"slideUp .3s ease"}}>
            <div style={{width:40,height:4,background:"rgba(180,140,60,.3)",borderRadius:99,margin:"0 auto 18px"}}></div>
            <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:20}}>
              <div style={{width:48,height:48,borderRadius:14,flexShrink:0,background:`linear-gradient(135deg,${picker.cat==="Biryani"?"#0891b2,#0e7490":picker.cat==="Tamil Nadu"?"#b45309,#92400e":picker.cat==="Kerala"?"#047857,#065f46":picker.cat==="Karnataka"?"#be185d,#9d174d":picker.cat==="Egg Dishes"?"#d97706,#b45309":picker.cat==="Non-Veg Curry"||picker.cat==="Chicken"||picker.cat==="Mutton"||picker.cat==="Fish"||picker.cat==="Seafood"||picker.cat==="Eggs"||picker.cat==="Pork"?"#7c3aed,#6d28d9":picker.cat==="Vegetables"||picker.cat==="Grains"||picker.cat==="Lentils"||picker.cat==="Spices"||picker.cat==="Fats & Oils"||picker.cat==="Dairy"?"#065f46,#059669":"#c2410c,#ea580c"})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
                {picker.cat==="Biryani"?"🍚":picker.cat==="Tamil Nadu"?"🌶️":picker.cat==="Kerala"?"🥥":picker.cat==="Karnataka"?"🫓":picker.cat==="Egg Dishes"?"🥚":picker.cat==="Non-Veg Curry"?"🍲":picker.cat==="Breakfast"?"🌅":picker.cat==="Rice"?"🍚":picker.cat==="Curry"?"🥘":picker.cat==="Chicken"?"🍗":picker.cat==="Mutton"?"🥩":picker.cat==="Fish"?"🐟":picker.cat==="Seafood"?"🦐":picker.cat==="Sweet"?"🍮":picker.cat==="Snack"?"🫙":picker.cat==="Drinks"?"☕":"🌿"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:800,color:"#1c0a00",lineHeight:1.3,marginBottom:4}}>{picker.name}</div>
                <span style={{fontSize:10,fontWeight:700,background:"rgba(180,140,60,.12)",color:"#92400e",borderRadius:6,padding:"2px 8px"}}>{picker.cat}</span>
              </div>
            </div>

            {/* Nutrition preview */}
            <div style={{background:"rgba(180,140,60,.07)",borderRadius:14,padding:"12px 16px",marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:"#8a6a30",textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>
                Nutrition for {pickQty} serving{pickQty!==1?"s":""}
              </div>
              <div style={{display:"flex",justifyContent:"space-around"}}>
                {[
                  {label:"Calories",val:Math.round(picker.cal*pickQty),unit:"kcal",color:"#c2410c"},
                  {label:"Protein", val:Math.round(picker.p*pickQty),  unit:"g",   color:"#2563eb"},
                  {label:"Carbs",   val:Math.round(picker.c*pickQty),  unit:"g",   color:"#059669"},
                  {label:"Fat",     val:Math.round(picker.f*pickQty),  unit:"g",   color:"#dc2626"},
                ].map(m=>(
                  <div key={m.label} style={{textAlign:"center"}}>
                    <div style={{fontSize:20,fontWeight:900,color:m.color,lineHeight:1}}>{m.val}<span style={{fontSize:11,fontWeight:600,color:m.color+"99",marginLeft:1}}>{m.unit}</span></div>
                    <div style={{fontSize:10,color:"#a87c3a",marginTop:3}}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:"#6b3a1f",textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>Quantity</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20}}>
                <button onClick={()=>setPickQty(q=>Math.max(.5,+(q-.5).toFixed(1)))} style={{width:48,height:48,borderRadius:14,border:"2px solid rgba(194,65,12,.3)",background:"rgba(194,65,12,.06)",color:"#c2410c",fontSize:26,fontWeight:700,cursor:"pointer",lineHeight:1}}>-</button>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:36,fontWeight:900,color:"#1c0a00",lineHeight:1}}>{pickQty}</div>
                  <div style={{fontSize:11,color:"#a87c3a",marginTop:2}}>serving{pickQty!==1?"s":""}</div>
                </div>
                <button onClick={()=>setPickQty(q=>+(q+.5).toFixed(1))} style={{width:48,height:48,borderRadius:14,border:"2px solid rgba(194,65,12,.3)",background:"rgba(194,65,12,.06)",color:"#c2410c",fontSize:26,fontWeight:700,cursor:"pointer",lineHeight:1}}>+</button>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:14}}>
                {[.5,1,1.5,2,3].map(q=>(
                  <button key={q} onClick={()=>setPickQty(q)} style={{padding:"5px 13px",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",border:"1.5px solid "+(pickQty===q?"#c2410c":"rgba(180,140,60,.25)"),background:pickQty===q?"rgba(194,65,12,.1)":"transparent",color:pickQty===q?"#c2410c":"#92400e"}}>{q}x</button>
                ))}
              </div>
            </div>

            {/* Meal selector in picker */}
            <div style={{marginBottom:18}}>
              <div style={{fontSize:12,fontWeight:700,color:"#6b3a1f",textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Add to Meal</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {MEALS.map(m=>(
                  <button key={m} onClick={()=>setMeal(m)} style={{padding:"6px 12px",borderRadius:9,fontSize:11,fontWeight:700,cursor:"pointer",background:meal===m?"#c2410c":"rgba(180,140,60,.1)",border:"1.5px solid "+(meal===m?"#c2410c":"rgba(180,140,60,.2)"),color:meal===m?"#fff":"#92400e"}}>
                    {M_ICON[m]} {m}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={confirmAdd} style={{width:"100%",padding:"15px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#92400e,#c2410c,#ea580c)",color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:"0 4px 16px rgba(194,65,12,.4)",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              <span style={{fontSize:18}}>+</span>
              Add {pickQty} serving{pickQty!==1?"s":""} to {meal}
              <span style={{fontSize:13,opacity:.8}}>({Math.round(picker.cal*pickQty)} kcal)</span>
            </button>
          </div>
        </div>
      )}

      {/* -- Recipe Detail Modal -- */}
      {openRecipe&&(()=>{
        const linkedFood = openRecipe.foodId ? FOODS.find(f=>f.id===openRecipe.foodId) : null;
        const diffColor = openRecipe.difficulty==="Easy"?"#059669":openRecipe.difficulty==="Medium"?"#d97706":"#dc2626";
        return (
          <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setOpenRecipe(null)}>
            <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,background:"#fffbf0",borderRadius:"24px 24px 0 0",padding:"20px 20px 32px",boxShadow:"0 -12px 48px rgba(120,60,0,.25)",animation:"slideUp .3s ease",maxHeight:"88vh",overflowY:"auto"}}>
              <div style={{width:40,height:4,background:"rgba(180,140,60,.3)",borderRadius:99,margin:"0 auto 16px"}}></div>

              {/* Header */}
              <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:16}}>
                <div style={{width:52,height:52,borderRadius:16,flexShrink:0,background: openRecipe.fromWeb ? "linear-gradient(135deg,#0891b2,#0e7490)" : "linear-gradient(135deg,#db2777,#be185d)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow: openRecipe.fromWeb ? "0 4px 14px rgba(8,145,178,.35)" : "0 4px 14px rgba(219,39,119,.35)"}}>{openRecipe.fromWeb ? "🌐" : "📖"}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:700,color:"#1c0a00",lineHeight:1.25,marginBottom:4}}>{openRecipe.name}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,fontWeight:700,background:"rgba(219,39,119,.1)",color:"#db2777",borderRadius:6,padding:"2px 8px"}}>{openRecipe.cat}</span>
                    {openRecipe.cuisine&&(
                      <span style={{fontSize:10,fontWeight:700,background:"rgba(180,140,60,.14)",color:"#92400e",borderRadius:6,padding:"2px 8px"}}>{openRecipe.cuisine}</span>
                    )}
                    {openRecipe.fromWeb&&(
                      <span style={{fontSize:10,fontWeight:700,background:"rgba(8,145,178,.12)",color:"#0891b2",borderRadius:6,padding:"2px 8px",display:"flex",alignItems:"center",gap:3}}>
                        &#127760; Sourced from Web
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={()=>setOpenRecipe(null)} style={{background:"rgba(180,140,60,.12)",border:"none",borderRadius:8,width:28,height:28,color:"#92400e",fontSize:16,cursor:"pointer",flexShrink:0}}>&#215;</button>
              </div>

              {/* Meta strip */}
              <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
                <div style={{background:"rgba(219,39,119,.08)",borderRadius:10,padding:"8px 12px",flex:1,minWidth:90,textAlign:"center"}}>
                  <div style={{fontSize:14}}>&#9201;</div>
                  <div style={{fontSize:11,fontWeight:800,color:"#db2777",marginTop:2}}>{openRecipe.time}</div>
                </div>
                <div style={{background:diffColor+"15",borderRadius:10,padding:"8px 12px",flex:1,minWidth:90,textAlign:"center"}}>
                  <div style={{fontSize:14}}>&#9889;</div>
                  <div style={{fontSize:11,fontWeight:800,color:diffColor,marginTop:2}}>{openRecipe.difficulty}</div>
                </div>
                <div style={{background:"rgba(124,74,26,.08)",borderRadius:10,padding:"8px 12px",flex:1,minWidth:90,textAlign:"center"}}>
                  <div style={{fontSize:14}}>&#128101;</div>
                  <div style={{fontSize:11,fontWeight:800,color:"#7c4a1a",marginTop:2}}>Serves {openRecipe.serves}</div>
                </div>
                {linkedFood&&(
                  <div style={{background:"rgba(194,65,12,.08)",borderRadius:10,padding:"8px 12px",flex:1,minWidth:90,textAlign:"center"}}>
                    <div style={{fontSize:14}}>&#128293;</div>
                    <div style={{fontSize:11,fontWeight:800,color:"#c2410c",marginTop:2}}>{linkedFood.cal} kcal/srv</div>
                  </div>
                )}
              </div>

              {/* Ingredients */}
              <div style={{marginBottom:18}}>
                <div style={{fontSize:12,fontWeight:800,color:"#6b3a1f",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                  <span>&#127831;</span> Ingredients
                </div>
                <div style={{background:"rgba(180,140,60,.06)",borderRadius:14,padding:"12px 16px"}}>
                  {openRecipe.ingredients.map((ing,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"5px 0",borderTop:i>0?"1px solid rgba(180,140,60,.1)":"none"}}>
                      <span style={{color:"#db2777",fontSize:13,marginTop:1}}>&#8226;</span>
                      <span style={{fontSize:13,color:"#3a2410",lineHeight:1.4}}>{ing}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:800,color:"#6b3a1f",textTransform:"uppercase",letterSpacing:.8,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                  <span>&#128221;</span> Method
                </div>
                {openRecipe.steps.map((step,i)=>(
                  <div key={i} style={{display:"flex",gap:12,marginBottom:12}}>
                    <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#db2777,#be185d)",color:"#fff",fontSize:12,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 6px rgba(219,39,119,.3)"}}>{i+1}</div>
                    <div style={{fontSize:13,color:"#3a2410",lineHeight:1.5,paddingTop:3}}>{step}</div>
                  </div>
                ))}
              </div>

              {/* Add to log CTA if linked to a menu item */}
              {linkedFood&&(
                <button onClick={()=>{ setOpenRecipe(null); openPicker(linkedFood); }}
                  style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#92400e,#c2410c,#ea580c)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 16px rgba(194,65,12,.35)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <span style={{fontSize:16}}>+</span> Add "{linkedFood.name}" to Today's Log
                </button>
              )}
              {openRecipe.fromWeb&&!linkedFood&&(
                <div style={{textAlign:"center",fontSize:11,color:"#a87c3a",background:"rgba(180,140,60,.08)",borderRadius:10,padding:"10px 12px"}}>
                  This dish isn't in your Foods menu yet, so it can't be logged directly. Recipe summarized by AI from web search results.
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* -- Profile Panel -- */}
      {showProf&&<ProfilePanel profile={profile} onSave={setProfile} onClose={()=>setShowProf(false)} />}
      </div>
    </div>
  );
}
