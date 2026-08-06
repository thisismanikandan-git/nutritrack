// Raw ingredients (grains, lentils, vegetables, dairy, spices) with macro data per 100g

export const INGREDIENTS = [
  {id:"i1", name:"Rice / raw (100g)",           cat:"Grains",     cal:365,p:7,  f:0.7,c:80, fiber:1.3},
  {id:"i2", name:"Urad Dal (100g)",             cat:"Lentils",    cal:347,p:25, f:1.4,c:59, fiber:18 },
  {id:"i3", name:"Toor Dal (100g)",             cat:"Lentils",    cal:335,p:22, f:1.7,c:57, fiber:15 },
  {id:"i4", name:"Chana Dal (100g)",            cat:"Lentils",    cal:364,p:22, f:5,  c:57, fiber:17 },
  {id:"i5", name:"Moong Dal (100g)",            cat:"Lentils",    cal:347,p:24, f:1.2,c:60, fiber:16 },
  {id:"i6", name:"Rice Flour (100g)",           cat:"Grains",     cal:366,p:6,  f:0.5,c:80, fiber:2.4},
  {id:"i7", name:"Ragi / Finger Millet (100g)", cat:"Grains",     cal:336,p:7.3,f:1.9,c:72, fiber:3.6},
  {id:"i8", name:"Semolina / Rava (100g)",      cat:"Grains",     cal:360,p:13, f:1.1,c:73, fiber:3.9},
  {id:"i9", name:"Besan / Chickpea Flour (100g)",cat:"Grains",    cal:387,p:22, f:6,  c:58, fiber:10 },
  {id:"i10",name:"Onion (100g)",                cat:"Vegetables", cal:40, p:1.1,f:0.1,c:9,  fiber:1.7},
  {id:"i11",name:"Tomato (100g)",               cat:"Vegetables", cal:18, p:0.9,f:0.2,c:3.9,fiber:1.2},
  {id:"i12",name:"Potato (100g)",               cat:"Vegetables", cal:77, p:2,  f:0.1,c:17, fiber:2.2},
  {id:"i13",name:"Green Peas (100g)",           cat:"Vegetables", cal:81, p:5.4,f:0.4,c:14, fiber:5.1},
  {id:"i14",name:"Carrot (100g)",               cat:"Vegetables", cal:41, p:0.9,f:0.2,c:10, fiber:2.8},
  {id:"i15",name:"Brinjal / Eggplant (100g)",   cat:"Vegetables", cal:25, p:1,  f:0.2,c:6,  fiber:3  },
  {id:"i16",name:"Drumstick (100g)",            cat:"Vegetables", cal:37, p:2.1,f:0.2,c:8.5,fiber:3.2},
  {id:"i17",name:"Raw Banana (100g)",           cat:"Vegetables", cal:89, p:1.1,f:0.3,c:23, fiber:2.6},
  {id:"i18",name:"Yam (100g)",                  cat:"Vegetables", cal:118,p:1.5,f:0.2,c:28, fiber:4.1},
  {id:"i19",name:"Spinach (100g)",              cat:"Vegetables", cal:23, p:2.9,f:0.4,c:3.6,fiber:2.2},
  {id:"i20",name:"Coconut grated (100g)",       cat:"Fats & Oils",cal:354,p:3.3,f:33, c:15, fiber:9  },
  {id:"i21",name:"Coconut Oil (1 tbsp / 14g)",  cat:"Fats & Oils",cal:121,p:0,  f:14, c:0,  fiber:0  },
  {id:"i22",name:"Sesame Oil (1 tbsp / 14g)",   cat:"Fats & Oils",cal:124,p:0,  f:14, c:0,  fiber:0  },
  {id:"i23",name:"Ghee (1 tbsp / 15g)",         cat:"Fats & Oils",cal:130,p:0,  f:15, c:0,  fiber:0  },
  {id:"i24",name:"Curd / Yoghurt (100g)",       cat:"Dairy",      cal:98, p:3.5,f:4.3,c:3.4,fiber:0  },
  {id:"i25",name:"Whole Milk (100ml)",          cat:"Dairy",      cal:61, p:3.2,f:3.5,c:4.8,fiber:0  },
  {id:"i26",name:"Mustard Seeds (1 tsp / 3g)",  cat:"Spices",     cal:15, p:0.8,f:0.9,c:1.5,fiber:0.5},
  {id:"i27",name:"Cumin Seeds (1 tsp / 3g)",    cat:"Spices",     cal:8,  p:0.4,f:0.4,c:1,  fiber:0.3},
  {id:"i28",name:"Turmeric (1 tsp / 3g)",       cat:"Spices",     cal:9,  p:0.3,f:0.3,c:2,  fiber:0.7},
  {id:"i29",name:"Red Chilli Powder (1 tsp)",   cat:"Spices",     cal:8,  p:0.3,f:0.4,c:1.4,fiber:0.6},
  {id:"i30",name:"Tamarind (10g)",              cat:"Spices",     cal:24, p:0.3,f:0.1,c:6,  fiber:0.6},
];


export const ING_CATS  = ["All",...new Set(INGREDIENTS.map(i=>i.cat))];
