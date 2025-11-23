## Concept: “Immune Defender”

- You control a **big white blood cell** at the bottom of the screen.
- **Pathogens** (little virus/bacteria sprites) drift in rows from the top, Galaga-style.
- You fire **phagocytosis bursts** (little white shots) upward.
- When a burst hits a pathogen, you “engulf” it and it pops in a little particle poof.
- If pathogens reach the bottom or collide with you, you lose lives.
- As a nod to antibodies, occasionally a **special pathogen** drops a power-up that gives you rapid fire for a short time.

All drawn with simple shapes and colors to feel like an 80s arcade game.

### New refinements

- **Level/Stage progression:** Each infection has six stages; finish Stage 6 to roll into the next infection level with more pathogens and speed.
- **Pathogen counterfire:** Beginning at Stage 2, enemies fire back, ramping up rate and volley size as stages and levels climb.
- **Two power-ups:** Antibody Boost (rapid fire) and a membrane **shield** that saves you from one collision or leak.
- **HUD polish:** Level + stage counters, power-up timers, and a brief banner announcing the current stage/level.
- **Visual clarity:** Shield aura around the player and distinct icon shapes for the two power-ups.

### How to play

1. Paste `sketch.js` into the [p5.js web editor](https://editor.p5js.org/) and press the **Play** button.
2. Use `←` / `→` to move and **Space** to shoot.
3. Survive as many infections as you can: each infection is six stages, then the next level starts with denser, faster enemies and harsher counterfire. Collect power-ups as they drift down to gain rapid fire or a protective bubble. Lose all three lives and the run ends—chase that high score!
