# 🥘 NutriTrack — South Indian Calorie Tracker

A glassmorphism-styled calorie, macro, and recipe tracker built around authentic
South Indian cuisine — Tamil Nadu, Kerala, and Karnataka specialities included.

![stack](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![stack](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![stack](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- **Foods tab** — 180+ South Indian dishes (breakfast, curries, rice, biryani,
  non-veg curries, egg dishes, sweets, snacks, and regional specialities)
- **Ingredients tab** — 30 raw ingredients (grains, lentils, vegetables, dairy,
  spices) with per-100g macro data
- **Meat & Eggs tab** — 27 meat/seafood/egg items with a "high protein" badge
- **Recipes tab** — 86+ step-by-step cooking guides, plus an **AI-powered web
  search** that fetches and paraphrases a cooking method for any dish not yet
  in the local library
- **Daily Intake Sheet** — Excel-style sortable table with alternating row
  shading, inline quantity editing, meal-time reassignment, and **up to 10
  steps of undo** (Ctrl+Z supported)
- **Weight-loss profile** — Mifflin-St Jeor BMR calculation, adjustable goal
  duration slider, live pace feedback (Gentle / Moderate / Active / Aggressive)
- **7-day history chart**, glassmorphism hero card with animated calorie ring
- Everything persists to `localStorage` — no login, no backend required for
  the core app

---

## 📁 Project Structure

```
nutritrack-app/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── src/
│   ├── main.jsx                  # React entry point
│   ├── index.css                 # global reset
│   ├── App.jsx                   # main app screen (Home + tab browser + modals)
│   ├── components/
│   │   ├── AmbientBackground.jsx # shared warm mesh-gradient background
│   │   ├── Sheet.jsx             # Daily Intake Sheet (Excel-style table + undo)
│   │   └── ProfilePanel.jsx      # weight-loss profile settings bottom-sheet
│   ├── data/
│   │   ├── foods.js              # FOODS array + FOOD_CATS
│   │   ├── ingredients.js        # INGREDIENTS array + ING_CATS
│   │   ├── meats.js              # MEATS array + MEAT_CATS
│   │   └── recipes.js            # RECIPES array + RECIPE_CATS
│   └── utils/
│       └── helpers.js            # date/localStorage helpers + calcTargets()
└── server/                       # OPTIONAL: proxy for the AI recipe search
    ├── index.js
    ├── package.json
    └── .env.example
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or later
- npm (or yarn/pnpm)

### Install & run

```bash
git clone https://github.com/<your-username>/nutritrack.git
cd nutritrack
npm install
npm run dev
```

The app opens at **http://localhost:5173**. Everything works out of the box
**except** the "Search the web" AI recipe feature — see below to enable it.

### Build for production

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build locally
```

Deploy the `dist/` folder to any static host: Vercel, Netlify, GitHub Pages,
Cloudflare Pages, S3 + CloudFront, etc.

---

## 🌐 AI Web Search Setup (optional)

The Recipes tab has a **"Can't find a dish? Search the web"** box that uses
Claude with web search to fetch and summarize a cooking method for any dish.

This **cannot** call `api.anthropic.com` directly from the browser — it will
fail on CORS, and shipping an API key to client-side code would expose it to
anyone who opens dev tools. A tiny proxy server is included in `server/` to
solve this correctly.

1. **Get an API key** from [console.anthropic.com](https://console.anthropic.com/settings/keys)
2. **Set up the proxy:**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # edit .env and paste your ANTHROPIC_API_KEY
   npm start
   ```
   This runs on `http://localhost:8787` by default.
3. **Point the frontend at it:**
   ```bash
   cd ..                       # back to project root
   cp .env.example .env
   # .env already defaults to http://localhost:8787/api/recipe-search
   npm run dev
   ```
4. Restart the dev server if it was already running (Vite only reads `.env`
   on startup).

For production, deploy `server/` as a small Node service (Render, Railway,
Fly.io, a Vercel/Netlify serverless function, an AWS Lambda, etc.) and set
`VITE_RECIPE_API_URL` to its public URL at build time.

If you skip this setup, the rest of the app works fully — you'll just see a
friendly error message if you try the web search box.

---

## 🎨 Design Notes

- All component styling is inline (`style={{...}}`) plus small `<style>`
  blocks per-screen for `@keyframes` — this mirrors how the app was originally
  prototyped and keeps each screen visually self-contained. Feel free to
  migrate to CSS Modules or Tailwind if you extend the project.
- Fonts: **Cormorant Garamond** (headings) + **Nunito** (body), loaded via
  Google Fonts `@import` inside each screen's style block.
- Color system: saffron/turmeric warm palette for general foods, forest green
  for ingredients, violet for meat & eggs, pink for recipes, with category-
  specific accents for Biryani (cyan), Tamil Nadu (amber), Kerala (emerald),
  and Karnataka (rose).

---

## 🧮 How weight-loss targets are calculated

`src/utils/helpers.js` → `calcTargets(profile)`:

1. **BMR** via the Mifflin-St Jeor equation (uses weight, height, age, gender)
2. **TDEE** = BMR × activity factor (Sedentary 1.2 → Very Active 1.725)
3. Required daily deficit is derived from the goal weight and the duration
   slider (`targetWeeks`), clamped between 200–1000 kcal/day and never below
   a 1200 kcal/day floor
4. Protein target = goal weight × 2g, fat = 25% of calories, carbs fill the rest
5. Pace label (Gentle/Moderate/Active/Aggressive) is derived from the
   resulting weekly loss rate in kg

---

## 🛠 Tech Stack

- **React 18** (function components + hooks, no external state library)
- **Vite 5** for dev server and bundling
- Zero UI component libraries — everything is hand-built for full control
  over the glassmorphism aesthetic
- `localStorage` for persistence (log, profile) — swap in a real backend by
  replacing `loadLS`/`saveLS` in `utils/helpers.js`

---

## 📄 License

MIT — do whatever you like with it. Attribution appreciated but not required.

---

## 🙏 Acknowledgements

Built as an iterative project exploring South Indian regional cuisine data
modeling, glassmorphism UI design, and AI-assisted recipe discovery.
