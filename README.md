# ⚡ Powerhouse — an interactive 3D STEAM Quest

**Live demo:** https://powerhouse-3d.vercel.app

A narrative, game-like science lesson that teaches **how mitochondria power the
body**. A skeptical young athlete, **Mei**, scrolls a feed full of *"boost your
mitochondria!"* hype (cold plunges, $80 pills, breathing hacks) and — with sports
scientist **Dr. Vega** — learns to separate real, evidence-based ways to improve
her mitochondria from viral nonsense, by actually exploring how these cellular
engines work.

26 scenes · 9 comprehension checks · 9 hands-on interactives (most in real-time 3D).

---

## Run it locally

```bash
npm install
npm run dev          # opens the quest at http://localhost:5173
```

Other commands:

```bash
npm run build        # production build → dist/powerhouse
npm run preview      # serve the production build
```

> Tip: append `?scene=N` to the URL to jump straight to a scene (e.g. `?scene=2`
> is the 3D mitochondrion explorer, `?scene=6` the ATP-synthase turbine).

---

## How it's made

**Stack:** React + TypeScript, **Vite**, **Three.js** via
[`@react-three/fiber`](https://docs.pmnd.rs/react-three-fiber) + `drei`, Tailwind.

The app is a small **scene engine**. A quest is pure data: a list of scenes, the
dialogue, and which interactive each scene shows. The engine reads that data and
renders dialogue bubbles, characters, progress, audio, and the interactive panel.

```
src/
  components/          the scene engine (Scene, Dialog, NavigationControls, …)
  hooks/               useLazyInteraction (loads an interactive by name), …
  GAME_DATA/
    powerhouse/        ← the entire quest lives here
      sceneData.ts     the flow: every scene, in order, and its dialogue keys
      locales/en.json  ALL text (dialogue, questions, the title copy)
      configs/         one file per check question + per-step "gate" rules
      interactives/    the React/Three.js mini-apps (see below)
      assets/          backgrounds, character art, audio, the phone SVG
```

### The interactives (`GAME_DATA/powerhouse/interactives/`)

Each is a self-contained component with a fixed contract
(`{ interaction, onInteraction }`) that the engine loads on demand by filename.

| File | What it teaches | Tech |
|---|---|---|
| `mitochondrion-explorer` | the 4 parts of a mitochondrion; cristae = surface area | 3D (R3F) |
| `atp-synthase` | the proton "dam" spins a molecular turbine → ATP | 3D |
| `respiration-builder` | fuel + oxygen in → ATP out (+ CO₂/water) | 3D |
| `brown-fat` | UCP1 leaks the gradient into **heat** instead of ATP | 3D |
| `axonal-transport` | neurons truck mitochondria down the axon to power synapses | 3D |
| `endosymbiosis` | a swallowed bacterium became the mitochondrion | 3D |
| `maternal-line` | mtDNA is inherited only from your mother → Mitochondrial Eve | SVG |
| `vo2max-lab` / `sprint-intensity` | the aerobic ceiling and why muscles "burn" | Canvas + SVG runner |

`viz-stage.tsx` is a shared wrapper that mounts a Three.js `<Canvas>` reliably
inside the animated dialog panel. `runner.tsx` is an anatomically-articulated SVG
human with a real running gait, shared by the two treadmill interactives.

### Two patterns worth knowing

- **Gating:** a scene can keep its **Next** button disabled until the student
  actually does that step's command (tap the cristae, cut the oxygen, hit the
  VO₂max plateau, …). An interactive writes a flag to shared state; a tiny
  `configs/gate-*.ts` reads it. See `useGate.ts` and `interactiveScene()` in
  `sceneData.ts`.
- **Adding a scene:** add an entry to `sceneData.ts`, add its text to
  `locales/en.json`. That's it.

### Voiceover

The quest supports per-line ElevenLabs narration (mp3s under `assets/audio/`).
It can be toggled on by attaching an `audioUrl` to dialogs in `sceneData.ts`.

---

*Built on the [quests-app](https://github.com/JDerekLomas/da-vinci-trees-quest)
STEAM Quest framework.*
