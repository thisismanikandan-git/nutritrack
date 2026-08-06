// Meat, seafood and egg protein database with macro data per 100g

export const MEATS = [
  {id:"m1", name:"Chicken Breast (100g)",         cat:"Chicken",  cal:165,p:31,f:3.6,c:0  },
  {id:"m2", name:"Chicken Leg (100g)",            cat:"Chicken",  cal:184,p:26,f:9,  c:0  },
  {id:"m3", name:"Chicken Thigh (100g)",          cat:"Chicken",  cal:209,p:26,f:11, c:0  },
  {id:"m4", name:"Chicken Wings (100g)",          cat:"Chicken",  cal:203,p:20,f:13, c:0  },
  {id:"m5", name:"Chicken Liver (100g)",          cat:"Chicken",  cal:119,p:17,f:5,  c:1  },
  {id:"m6", name:"Chicken Keema (100g)",          cat:"Chicken",  cal:172,p:17,f:11, c:0  },
  {id:"m7", name:"Mutton Boneless (100g)",        cat:"Mutton",   cal:258,p:27,f:17, c:0  },
  {id:"m8", name:"Mutton Bone-in (100g)",         cat:"Mutton",   cal:294,p:25,f:21, c:0  },
  {id:"m9", name:"Mutton Keema (100g)",           cat:"Mutton",   cal:267,p:25,f:18, c:0  },
  {id:"m10",name:"Mutton Liver (100g)",           cat:"Mutton",   cal:168,p:26,f:7,  c:2  },
  {id:"m11",name:"Rohu Fish (100g)",              cat:"Fish",     cal:97, p:16,f:3.4,c:0  },
  {id:"m12",name:"Pomfret (100g)",                cat:"Fish",     cal:96, p:18,f:2.4,c:0  },
  {id:"m13",name:"Sardines (100g)",               cat:"Fish",     cal:208,p:25,f:11, c:0  },
  {id:"m14",name:"Mackerel / Ayala (100g)",       cat:"Fish",     cal:205,p:19,f:14, c:0  },
  {id:"m15",name:"Tilapia (100g)",                cat:"Fish",     cal:128,p:26,f:2.7,c:0  },
  {id:"m16",name:"Salmon (100g)",                 cat:"Fish",     cal:208,p:20,f:13, c:0  },
  {id:"m17",name:"Tuna (100g)",                   cat:"Fish",     cal:144,p:30,f:2.5,c:0  },
  {id:"m18",name:"Kingfish / Seer (100g)",        cat:"Fish",     cal:101,p:19,f:2.7,c:0  },
  {id:"m19",name:"Prawn / Shrimp (100g)",         cat:"Seafood",  cal:99, p:24,f:0.3,c:0.2},
  {id:"m20",name:"Crab (100g)",                   cat:"Seafood",  cal:97, p:19,f:1.8,c:0  },
  {id:"m21",name:"Squid / Calamari (100g)",       cat:"Seafood",  cal:92, p:16,f:1.4,c:3  },
  {id:"m22",name:"Clams (100g)",                  cat:"Seafood",  cal:74, p:13,f:1,  c:3  },
  {id:"m23",name:"Whole Egg (1 large / 50g)",     cat:"Eggs",     cal:70, p:6, f:5,  c:0.6},
  {id:"m24",name:"Egg White (1 / 33g)",           cat:"Eggs",     cal:17, p:3.6,f:0.1,c:0.2},
  {id:"m25",name:"Egg Yolk (1 / 17g)",            cat:"Eggs",     cal:55, p:2.7,f:4.5,c:0.6},
  {id:"m26",name:"Pork lean (100g)",              cat:"Pork",     cal:242,p:27,f:14, c:0  },
  {id:"m27",name:"Pork Belly (100g)",             cat:"Pork",     cal:520,p:10,f:53, c:0  },
];

// -- RECIPES: step-by-step cooking guides for dishes already in the FOODS menu --

export const MEAT_CATS = ["All",...new Set(MEATS.map(m=>m.cat))];
