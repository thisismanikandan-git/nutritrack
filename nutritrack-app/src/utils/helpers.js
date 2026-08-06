// Generic helper functions, meal constants, and the Mifflin-St Jeor
// weight-loss target calculator used throughout the app.

export const TODAY   = () => new Date().toISOString().slice(0,10);
export const FMT_D   = d => new Date(d+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
export const loadLS  = (k,d)=>{ try{return JSON.parse(localStorage.getItem(k)||"null")??d;}catch{return d;} };
export const saveLS  = (k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{} };
export const MEALS   = ["Breakfast","Morning Snack","Lunch","Evening Snack","Dinner"];
export const M_ICON  = {"Breakfast":"🌅","Morning Snack":"☕","Lunch":"🍱","Evening Snack":"🍪","Dinner":"🌙"};

export const DEFAULT_PROFILE = {currentWeight:82,goalWeight:65,height:170,age:30,gender:"male",activity:1.2,targetWeeks:26};
export const ACTIVITY_OPTS = [
  {label:"Sedentary",         desc:"Desk job, little exercise",   factor:1.2  },
  {label:"Lightly Active",    desc:"Light exercise 1-3 days/wk", factor:1.375},
  {label:"Moderately Active", desc:"Moderate exercise 3-5 days",  factor:1.55 },
  {label:"Very Active",       desc:"Hard exercise 6-7 days/wk",  factor:1.725},
];

export function calcTargets(p){
  const bmr = p.gender==="male"
    ? 10*p.currentWeight+6.25*p.height-5*p.age+5
    : 10*p.currentWeight+6.25*p.height-5*p.age-161;
  const tdee    = Math.round(bmr*p.activity);
  const toLose  = Math.max(0,p.currentWeight-p.goalWeight);
  const wks     = Math.max(1,p.targetWeeks);
  const reqDef  = Math.round((toLose*7700)/(wks*7));
  const safeDef = Math.min(1000,Math.max(200,reqDef));
  const cal     = Math.max(1200,tdee-safeDef);
  const actDef  = tdee-cal;
  const projWks = actDef>0 ? Math.round((toLose*7700)/(actDef*7)) : 999;
  const wkLoss  = parseFloat((actDef*7/7700).toFixed(2));
  const protein = Math.round(p.goalWeight*2);
  const fat     = Math.round((cal*0.25)/9);
  const carbs   = Math.round(Math.max(0,cal-protein*4-fat*9)/4);
  const pace    = wkLoss<0.25?"Gentle":wkLoss<0.5?"Moderate":wkLoss<0.75?"Active":"Aggressive";
  const paceClr = wkLoss<0.25?"#22c55e":wkLoss<0.5?"#3b82f6":wkLoss<0.75?"#f59e0b":"#ef4444";
  return {cal,protein,fat,carbs,tdee,actDef,projWks,wkLoss,pace,paceClr};
}
