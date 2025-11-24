## Concept: “Immune Defender”

- You control a **big white blood cell** at the bottom of the screen.
- **Pathogens** (little virus/bacteria/parasite sprites) drift in classic Space-Invaders-style rows from the top.
- You fire **phagocytosis bursts** (little white shots) upward.
- When a burst hits a pathogen, you “engulf” it and it pops in a little particle poof.
- If pathogens reach the bottom or collide with you, you lose lives.
- As a nod to antibodies, occasionally a **special pathogen** drops a power-up that gives you rapid fire for a short time.

All drawn with simple shapes and colors to feel like an 80s arcade game.

### New refinements

- **Level/Stage progression:** Each infection has six stages; finish Stage 6 to roll into the next infection level with more pathogens and speed. Level-based scaling caps at Level 9 so the challenge plateaus while you chase a final high score.
- **Pathogen counterfire:** Beginning at Stage 2, enemies fire back, ramping up rate and volley size as stages and levels climb.
- **Two power-ups:** Antibody Boost (rapid fire) and a membrane **shield** that saves you from one collision or leak.
- **HUD polish:** Level + stage counters, power-up timers, and a brief banner announcing the current stage/level.
- **Visual clarity:** Shield aura around the player and distinct icon shapes for the two power-ups.
- **Audio-ready:** Torpedo launch shots and an implosion stinger when you lose a life (use the optional `p5.sound.min.js` or the p5.sound CDN and keep the `.wav` files alongside `sketch.js` or in an `assets/` folder).
- **Immunology flair:**
  - Color-coded, level-gated pathogens: core bacteria/viruses/parasites at Level 1, dive-bombing parasites at Level 2, encapsulated bacteria at Level 3, drifting spore mines at Level 4, orbiting swarm clusters at Level 5, snaking helminths at Level 6, mutating jitter viruses at Level 7, spore-launching artillery at Level 8, and macroparasite mini-bosses at Level 9 and beyond.
  - Memory cells weaken pathogen types each time you clear a wave.
  - A side-panel highlights neutrophils/B-cells/T-cells/memory cells as power-ups trigger.

### How to play

1. Paste `sketch.js` into the [p5.js web editor](https://editor.p5js.org/) and press the **Play** button.
2. Use `←` / `→` to move and hold **Space** to stream shots (faster during an antibody boost).
3. Survive as many infections as you can: each infection is six stages, then the next level starts with denser, faster enemies and harsher counterfire. Collect power-ups as they drift down to gain rapid fire or a protective bubble. Lose all three lives and the run ends—chase that high score!

### Sound assets

- Add `p5.sound.min.js` alongside `sketch.js` (or include the p5.sound library in the web editor) so the sound helpers are available.
- Drop the `.wav` files (`Torpedo-Launch-01.wav`, `Torpedo-Launch-02.wav`, `Torpedo-Launch-03.wav`, `Torpedo-Launch-04.wav`, `Underwater-Implosion-1.wav`) right beside `sketch.js` **or** put them in an `assets/` folder if you prefer to keep things tidy. In the latter case, set `soundBasePath` near the top of `sketch.js` to `"assets/"`. The repository ignores these binaries so contributors can keep the branch lightweight; the game will run silently if the files are missing.
- If you prefer hosted files (e.g., from the p5 editor asset bucket), pass the full URL into the sound loader—absolute URLs will be respected and won't be double-prefixed.
