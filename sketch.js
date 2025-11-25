// Immune Defender: White Blood Cell vs Pathogens
// Paste this into sketch.js in the p5.js Web Editor

let player;
let bullets = [];
let enemies = [];
let particles = [];
let powerups = [];
let stars = [];
let enemyBullets = [];
let shootSounds = [];
let implosionSound;
let currentWaveTypes = new Set();
let highScore = 0;
let newHighScore = false;
let newHighScoreTimer = 0;
let detachedSpores = 0;
let touchFiring = false;
let touchTargetX = null;
let canvasEl;
let designWidth = 800;
let designHeight = 600;
let rotateHint = false;
let rotateHintStart = 0;
const rotateHintOverlayDuration = 15000;

const highScoreKey = "immuneDefenderHighScore";

const memoryCells = {
  bacteria: 0,
  virus: 0,
  parasite: 0,
  capsule: 0,
  spore: 0,
  swarm: 0,
  helminth: 0,
  mutant: 0,
  sporeLauncher: 0,
  macroparasite: 0
};

let enemyDir = 1; // horizontal direction of enemy swarm
let enemySpeed = 1.2;
let gameState = "title"; // "title", "play", "respawn", "gameover"

const respawnDuration = 3000; // ms delay after losing a life
let respawnTimer = 0;
const statusPanel = {
  title: "Neutrophil",
  text: "Frontline phagocytes fire engulfing bursts.",
  timer: 0,
  duration: 6500
};

let score = 0;
let lives = 3;
let nextExtraLifeScore = 50000;
let level = 1;
let stage = 1; // 1-6 within a level
let announceTimer = 0;
const stagesPerLevel = 6;

let lastShotTime = 0;
const baseShotDelay = 260; // ms between shots
let shotDelay = baseShotDelay;
const shootVolume = 0.8;
const implosionVolume = 0.65;

function effectiveLevel() {
  return min(level, 9);
}

const rapidFire = { active: false, timer: 0, duration: 8000 };
const shield = { active: false, timer: 0, duration: 6500 };
// Set to "assets/" if you keep your .wav files in an assets folder; leave blank if
// the sounds sit beside sketch.js (default for the p5.js web editor).
const soundBasePath = "";

function buildSoundPath(file) {
  if (/^(?:https?:)?\/\//.test(file) || file.startsWith("data:")) return file;
  if (file.startsWith(soundBasePath)) return file;
  return soundBasePath + file;
}

function initHighScore() {
  try {
    const stored = localStorage.getItem(highScoreKey);
    if (stored) {
      const parsed = int(stored);
      if (!isNaN(parsed)) highScore = parsed;
    }
  } catch (err) {
    console.warn("High score storage unavailable", err);
  }
}

function preload() {
  if (typeof loadSound !== "function") {
    console.warn("p5.sound is not available; skipping audio setup.");
    return;
  }

  soundFormats("wav");
  const shotFiles = [
    "Torpedo-Launch-01.wav",
    "Torpedo-Launch-02.wav",
    "Torpedo-Launch-03.wav",
    "Torpedo-Launch-04.wav"
  ];
  shootSounds = shotFiles
    .map(path => loadOptionalSound(buildSoundPath(path), shootVolume))
    .filter(Boolean);
  implosionSound = loadOptionalSound(
    buildSoundPath("Underwater-Implosion-1.wav"),
    implosionVolume
  );
}

function setup() {
  canvasEl = createCanvas(designWidth, designHeight);
  pixelDensity(1);
  textFont("monospace");
  setupLayout();
  initStars();
  initHighScore();
  resetGame();
}

// ---------- SETUP HELPERS ----------

function resetGame() {
  score = 0;
  lives = 3;
  nextExtraLifeScore = 50000;
  level = 1;
  stage = 1;
  enemyDir = 1;
  enemySpeed = 1.2;
  detachedSpores = 0;
  shotDelay = baseShotDelay;
  bullets = [];
  enemies = [];
  particles = [];
  powerups = [];
  enemyBullets = [];
  currentWaveTypes = new Set();
  memoryCells.bacteria = 0;
  memoryCells.virus = 0;
  memoryCells.parasite = 0;
  memoryCells.capsule = 0;
  memoryCells.spore = 0;
  memoryCells.swarm = 0;
  memoryCells.helminth = 0;
  memoryCells.mutant = 0;
  memoryCells.sporeLauncher = 0;
  memoryCells.macroparasite = 0;
  rapidFire.active = false;
  shield.active = false;
  respawnTimer = 0;
  newHighScore = false;
  touchFiring = false;
  touchTargetX = null;
  statusPanel.title = "Neutrophil";
  statusPanel.text = "Frontline phagocytes fire engulfing bursts.";
  statusPanel.timer = millis();
  refreshSounds();
  initPlayer();
  spawnWave();
  gameState = "title";
}

function initPlayer() {
  player = {
    x: width / 2,
    y: height - 60,
    w: 40,
    h: 40,
    speed: 6
  };
}

function initStars() {
  stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      speed: random(0.3, 1.0)
    });
  }
}

function setupLayout() {
  document.body.style.margin = "0";
  document.body.style.backgroundColor = "rgb(5, 5, 20)";
  document.body.style.position = "relative";
  document.body.style.width = "100vw";
  document.body.style.height = "100vh";
  document.body.style.overflow = "hidden";
  document.body.style.display = "block";
  document.documentElement.style.overflow = "hidden";
  if (canvasEl) {
    canvasEl.style("display", "block");
    canvasEl.style("position", "absolute");
    canvasEl.style("left", "50%");
    canvasEl.style("top", "50%");
    canvasEl.style("transform", "translate(-50%, -50%)");
    canvasEl.style("max-width", "100vw");
    canvasEl.style("max-height", "100vh");
    canvasEl.style("touch-action", "none");
    canvasEl.style("image-rendering", "pixelated");
  }
  applyCanvasLayout();
}

function applyCanvasLayout() {
  if (!canvasEl) return;
  const scale = min(windowWidth / designWidth, windowHeight / designHeight);
  const cssWidth = designWidth * scale;
  const cssHeight = designHeight * scale;
  canvasEl.style("width", `${cssWidth}px`);
  canvasEl.style("height", `${cssHeight}px`);
  const shouldShowHint = windowHeight > windowWidth;
  if (shouldShowHint && !rotateHint) {
    rotateHintStart = millis();
  }
  if (!shouldShowHint) {
    rotateHintStart = 0;
  }
  rotateHint = shouldShowHint;
}

function spawnWave() {
  enemies = [];
  bullets = [];
  powerups = [];
  enemyBullets = [];
  enemyDir = 1;
  currentWaveTypes = new Set();
  detachedSpores = 0;

  const eLevel = effectiveLevel();
  const waveCounts = {};

  const colsBase = 5 + floor((stage - 1) / 1.5) + floor((eLevel - 1) / 3);
  const rowsBase = 3 + floor((stage - 1) / 3) + floor((eLevel - 1) / 3);
  let cols = min(9, colsBase);
  let rows = min(5, rowsBase);
  if (stage === 1) {
    cols = min(cols, 7);
    rows = min(rows, 4);
  }
  const spacingX = 82 - min(18, stage * 2 + eLevel * 1.2);
  const spacingY = 55;
  const offsetX = (width - (cols - 1) * spacingX) / 2;
  const offsetY = 80;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let type;
      for (let tries = 0; tries < 6; tries++) {
        const candidate = pickEnemyType(eLevel, stage);
        if (withinWaveLimit(candidate, waveCounts)) {
          type = candidate;
          break;
        }
      }
      if (!type) type = pickEnemyType(eLevel, stage);
      waveCounts[type] = (waveCounts[type] || 0) + 1;
      const hp = enemyHpFor(type, eLevel);
      const phase = random(TWO_PI);
      const pattern = patternForType(type);
      let w = 34;
      let h = 26;
      let speedScale = 1;

      if (type === "parasite") {
        w = 38;
        h = 28;
      } else if (type === "capsule") {
        w = 36;
        h = 26;
        speedScale = 0.75;
      } else if (type === "spore") {
        w = 22;
        h = 22;
        speedScale = 0.5;
      } else if (type === "swarm") {
        w = 30;
        h = 30;
      } else if (type === "helminth") {
        w = 44;
        h = 24;
        speedScale = 0.9;
      } else if (type === "mutant") {
        w = 34;
        h = 26;
      } else if (type === "sporeLauncher") {
        w = 30;
        h = 26;
        speedScale = 0.7;
      } else if (type === "macroparasite") {
        w = 46;
        h = 36;
        speedScale = 0.85;
      }

      const enemy = {
        x: offsetX + c * spacingX,
        y: offsetY + r * spacingY,
        w,
        h,
        type,
        hp,
        phase,
        pattern,
        speedScale,
        jiggle: random(0.6, 1.4),
        diveActive: false,
        diveSpeed: 0,
        diveWobble: random(TWO_PI),
        detached: false,
        detachAt: millis() + random(1800, 3800),
        orbitRadius: random(10, 14),
        orbitPhase: random(TWO_PI),
        dashCooldown: 0,
        stalkCooldown: millis() + 1800 + random(1200)
      };

      enemies.push(enemy);

      currentWaveTypes.add(type);
    }
  }

  enemySpeed = 1.2 + (stage - 1) * 0.14 + (eLevel - 1) * 0.18;
  announceTimer = millis();
}

function pickEnemyType(eLevel = effectiveLevel(), s = stage) {
  const pool = [
    { type: "bacteria", weight: 0.22, unlock: 1 },
    { type: "virus", weight: 0.2, unlock: 1 },
    { type: "parasite", weight: 0.16, unlock: 2 },
    { type: "capsule", weight: 0.14, unlock: 3 },
    { type: "spore", weight: 0.12, unlock: 4 },
    { type: "swarm", weight: 0.12, unlock: 5 },
    { type: "helminth", weight: 0.1, unlock: 6 },
    { type: "mutant", weight: 0.1, unlock: 7 },
    { type: "sporeLauncher", weight: 0.1, unlock: 8 },
    { type: "macroparasite", weight: 0.08, unlock: 9 }
  ]
    .filter(entry => eLevel >= entry.unlock)
    .map(entry => ({ ...entry, weight: adjustWeightForStage(entry, s, eLevel) }))
    .filter(entry => entry.weight > 0);

  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random(totalWeight);
  for (const entry of pool) {
    if ((roll -= entry.weight) <= 0) {
      return entry.type;
    }
  }
  return pool[pool.length - 1].type;
}

function adjustWeightForStage(entry, s, eLevel) {
  const { type, weight, unlock } = entry;
  let scaled = weight;
  const age = eLevel - unlock;

  if (type === "bacteria" || type === "virus") {
    if (s >= 5) scaled *= 0.35;
    else if (s >= 3) scaled *= 0.55;
    else if (s === 1) scaled *= 0.85;
  }

  if (type === "parasite") {
    if (s === 1) return 0;
    if (s === 2) scaled *= 0.8;
    if (s === 5) scaled *= 0.65;
    if (s === 3) scaled *= 0.9;
  }

  if (type === "capsule" && s >= 5) {
    scaled *= 0.6;
  }

  if (type === "spore") {
    if (s < 4) return 0;
    if (s === 4) scaled *= 0.6; // introduce gently
  }

  if (age >= 2 && s >= 4) {
    scaled *= 0.7;
  }
  if (age >= 3 && s >= 5) {
    scaled *= 0.55;
  }

  return max(0, scaled);
}

function withinWaveLimit(type, counts) {
  const seen = counts[type] || 0;
  if (stage >= 5 && (type === "bacteria" || type === "virus") && seen >= 2) return false;
  if (stage >= 5 && type === "capsule" && seen >= 2) return false;
  if (type === "parasite") {
    const cap = parasiteCapForStage(stage);
    if (seen >= cap) return false;
  }
  if (type === "spore") {
    if (stage === 4 && seen >= 1) return false;
    if (stage >= 5 && seen >= 3) return false;
  }
  return true;
}

function parasiteCapForStage(s) {
  if (s === 1) return 0;
  if (s === 2) return 2;
  if (s === 3) return 3;
  if (s === 4) return 4;
  if (s === 5) return 2;
  return 4;
}

function patternForType(type) {
  if (type === "parasite") return "zigzag";
  if (type === "swarm") return "orbit";
  if (type === "helminth") return "snake";
  if (type === "mutant") return "jitter";
  if (type === "spore") return "sway";
  if (type === "sporeLauncher") return "anchor";
  if (type === "macroparasite") return "macro";
  return "sway";
}

function enemyHpFor(type, eLevel = effectiveLevel()) {
  const stageBonus = floor((stage - 1) / 2);
  const levelBonus = floor((eLevel - 1) / 1.5);
  const baseHp =
    type === "bacteria"
      ? 1
      : type === "virus"
      ? 2
      : type === "parasite"
      ? 3 + floor((eLevel - 2) / 2)
      : type === "capsule"
      ? 3
      : type === "spore"
      ? 1
      : type === "swarm"
      ? 3
      : type === "helminth"
      ? 5
      : type === "mutant"
      ? 3
      : type === "sporeLauncher"
      ? 3
      : 6; // macroparasite

  const memoryBoost = min(memoryCells[type] || 0, baseHp + stageBonus + levelBonus - 1);
  return max(1, baseHp + stageBonus + levelBonus - memoryBoost);
}

// ---------- MAIN LOOP ----------

function draw() {
  applyCanvasLayout();
  drawBackground();

  if (gameState === "title") {
    drawHud();
    drawPlayer();
    drawEnemies();
    drawParticles();
    drawPowerups();
    drawTitleScreen();
  } else if (gameState === "play") {
    handleInput();
    updateStars();
    updateBullets();
    updateEnemyBullets();
    updateEnemies();
    updatePowerups();
    updateParticles();
    handleCollisions();
    checkWinLose();

    drawHud();
    drawPlayer();
    drawEnemies();
    drawBullets();
    drawPowerups();
    drawParticles();
    drawWaveLabel();
  } else if (gameState === "respawn") {
    updateStars();
    updateParticles();

    drawHud();
    drawPlayer();
    drawParticles();
    drawRespawnMessage();

    const elapsed = millis() - respawnTimer;
    if (elapsed >= respawnDuration) {
      spawnWave();
      gameState = "play";
    }
  } else if (gameState === "gameover") {
    drawHud();
    drawPlayer();
    drawEnemies();
    drawParticles();
    drawEndScreen("INFECTION OVERWHELMED DEFENSE", "Press ENTER to try again");
  }

  drawScanlines();

  if (rotateHint) {
    const age = rotateHintStart ? millis() - rotateHintStart : millis();
    drawRotateHint(age);
  }
}

// ---------- DRAWING ----------

function drawBackground() {
  // Dark, vaguely "bloodstream in space" vibe
  background(5, 5, 20);
  noStroke();
  fill(120, 0, 30, 80);
  rect(0, height * 0.6, width, height * 0.4);

  // stars = "plasma particles"
  for (let s of stars) {
    noStroke();
    fill(180, 40, 60, 150);
    ellipse(s.x, s.y, 3, 3);
  }
}

function drawScanlines() {
  // Faint horizontal scanlines for CRT feel
  stroke(0, 0, 0, 40);
  for (let y = 0; y < height; y += 3) {
    line(0, y, width, y);
  }
}

function drawRotateHint(age) {
  const overlayActive = age < rotateHintOverlayDuration;
  push();
  noStroke();
  if (overlayActive) {
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("Rotate to landscape for best fit", width / 2, height / 2 - 8);
    textSize(12);
    text("Drag to move • Hold to fire", width / 2, height / 2 + 12);
  } else {
    const barWidth = 220;
    const barHeight = 40;
    const x = width - barWidth - 12;
    const y = 12;
    fill(0, 0, 0, 120);
    rect(x, y, barWidth, barHeight, 6);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    text("Tip: rotate for best fit", x + barWidth / 2, y + barHeight / 2);
  }
  pop();
}

function drawHud() {
  fill(255);
  noStroke();
  textSize(16);
  textAlign(LEFT, TOP);
  text("SCORE: " + score, 16, 10);
  text("LIVES: " + lives, 16, 32);
  text("LEVEL: " + level, 16, 54);
  text("STAGE: " + stage + "/" + stagesPerLevel, 16, 76);

  push();
  textAlign(RIGHT, TOP);
  text("HIGH: " + highScore, width - 16, 10);
  pop();

  if (rapidFire.active) {
    fill(180, 230, 255);
    text("ANTIBODY BOOST", 16, 98);
    drawPowerBar(16, 116, rapidFire.timer, rapidFire.duration);
  }

  if (shield.active) {
    fill(120, 255, 220);
    text("MEMBRANE SHIELD", 16, rapidFire.active ? 138 : 98);
    const yBar = rapidFire.active ? 156 : 116;
    drawPowerBar(16, yBar, shield.timer, shield.duration, color(120, 255, 220));
  }

  drawStatusPanel();

  if (newHighScore && millis() - newHighScoreTimer < 3600) {
    fill(255, 230, 120);
    textAlign(CENTER, TOP);
    textSize(18);
    text("NEW HIGH SCORE ACHIEVED!", width / 2, 12);
  } else if (newHighScore && millis() - newHighScoreTimer >= 3600) {
    newHighScore = false;
  }
}

function drawStatusPanel() {
  const age = millis() - statusPanel.timer;
  if (age > statusPanel.duration && !rapidFire.active && !shield.active) {
    statusPanel.title = "Neutrophil";
    statusPanel.text = "Frontline phagocytes fire engulfing bursts.";
  }

  const panelX = width - 210;
  const panelY = 16;
  push();
  noStroke();
  fill(0, 30, 40, 140);
  rect(panelX, panelY, 190, 90, 8);
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  text(statusPanel.title, panelX + 10, panelY + 10);
  textSize(12);
  fill(200, 230, 255);
  text(statusPanel.text, panelX + 10, panelY + 30, 170, 60);
  pop();
}

function drawPowerBar(x, y, startTime, duration, barColor) {
  const elapsed = millis() - startTime;
  const pct = constrain(1 - elapsed / duration, 0, 1);
  const w = 160;
  noStroke();
  fill(255, 255, 255, 40);
  rect(x, y, w, 10, 4);
  fill(barColor || color(180, 230, 255));
  rect(x, y, w * pct, 10, 4);
}

function drawPlayer() {
  // big white cell: layered circles with faint glow
  push();
  translate(player.x, player.y);
  noStroke();
  fill(255, 255, 255, 80);
  ellipse(0, 0, player.w + 18, player.h + 18);
  fill(245);
  ellipse(0, 0, player.w, player.h);

  // nucleus
  fill(200, 230, 255, 220);
  ellipse(-5, -3, 18, 18);

  // little pseudopodia bumps
  fill(245);
  ellipse(-player.w / 2 + 8, -4, 12, 10);
  ellipse(player.w / 2 - 8, 6, 10, 8);

  if (shield.active) {
    noFill();
    stroke(120, 255, 220, 200);
    strokeWeight(3);
    ellipse(0, 0, player.w + 28, player.h + 28);
    strokeWeight(1.5);
    stroke(180, 255, 240, 160);
    ellipse(0, 0, player.w + 36, player.h + 36);
  }

  pop();
}

function drawEnemies() {
  for (let e of enemies) {
    push();
    translate(e.x, e.y);
    noStroke();
    if (e.type === "bacteria") {
      // pill-shaped bacteria sprite
      fill(50, 200, 80);
      rectMode(CENTER);
      rect(0, 0, e.w, e.h, 10);
      // tiny flagella
      stroke(80, 230, 110);
      strokeWeight(2);
      line(-e.w / 2, 0, -e.w / 2 - 8, -6);
      line(e.w / 2, -4, e.w / 2 + 8, -10);
      noStroke();
      // face
      fill(0, 60, 0);
      ellipse(-6, -4, 4, 4);
      ellipse(4, -4, 4, 4);
    } else if (e.type === "virus") {
      // virus: spiky ball
      fill(180, 70, 220);
      ellipse(0, 0, e.w, e.w);
      stroke(200, 120, 255);
      strokeWeight(2);
      for (let a = 0; a < TWO_PI; a += PI / 4) {
        const x1 = (e.w / 2 - 6) * cos(a);
        const y1 = (e.w / 2 - 6) * sin(a);
        const x2 = (e.w / 2 + 4) * cos(a);
        const y2 = (e.w / 2 + 4) * sin(a);
        line(x1, y1, x2, y2);
      }
      noStroke();
      fill(20, 0, 40);
      ellipse(-5, -4, 5, 5);
      ellipse(5, -4, 5, 5);
    } else if (e.type === "capsule") {
      const pulse = 1 + 0.05 * sin(frameCount * 0.1 + e.phase);
      scale(pulse);
      fill(60, 180, 200);
      rectMode(CENTER);
      rect(0, 0, e.w, e.h, 12);
      noFill();
      stroke(160, 230, 255, 180);
      strokeWeight(3);
      ellipse(0, 0, e.w + 12, e.h + 12);
    } else if (e.type === "spore") {
      fill(255, 170, 70);
      ellipse(0, 0, e.w, e.h);
      stroke(255, 210, 120, 180);
      strokeWeight(1.5);
      noFill();
      ellipse(0, 0, e.w + 8, e.h + 8);
      noStroke();
      fill(255, 240, 200);
      for (let a = 0; a < TWO_PI; a += PI / 3) {
        const rx = 8 * cos(a + frameCount * 0.05 + e.phase);
        const ry = 8 * sin(a + frameCount * 0.05 + e.phase);
        ellipse(rx, ry, 3, 3);
      }
    } else if (e.type === "swarm") {
      const angle = e.orbitPhase + frameCount * 0.08;
      const radius = e.orbitRadius;
      for (let k = 0; k < 3; k++) {
        const a = angle + k * (TWO_PI / 3);
        const ox = radius * cos(a);
        const oy = radius * sin(a);
        fill(170, 230, 220, 220);
        ellipse(ox, oy, 12, 12);
        fill(0, 40, 40, 200);
        ellipse(ox - 2, oy - 2, 3, 3);
      }
    } else if (e.type === "helminth") {
      const segments = 5;
      const segSpacing = 10;
      for (let i = 0; i < segments; i++) {
        const offset = (i - segments / 2) * segSpacing;
        const wiggle = sin(frameCount * 0.1 + e.phase + i * 0.4) * 3;
        fill(240, 200, 120);
        ellipse(offset + wiggle, i === segments - 1 ? -4 : 0, 16, 12);
      }
      fill(60, 20, 20);
      ellipse(segSpacing * (segments / 2 - 1) + 2, -4, 3, 3);
      ellipse(segSpacing * (segments / 2 - 1) + 7, -3, 3, 3);
    } else if (e.type === "mutant") {
      const pulse = random() < 0.05 ? 1.25 : 1;
      scale(pulse);
      fill(120, 200, 230);
      ellipse(0, 0, e.w, e.w);
      stroke(60, 20, 120);
      strokeWeight(2);
      for (let a = 0; a < TWO_PI; a += PI / 4) {
        const x1 = (e.w / 2 - 6) * cos(a);
        const y1 = (e.w / 2 - 6) * sin(a);
        const x2 = (e.w / 2 + 5) * cos(a);
        const y2 = (e.w / 2 + 5) * sin(a);
        line(x1, y1, x2, y2);
      }
      noStroke();
      fill(10, 0, 60);
      ellipse(-5, -4, 5, 5);
      ellipse(5, -4, 5, 5);
    } else if (e.type === "sporeLauncher") {
      fill(180, 60, 110);
      rectMode(CENTER);
      rect(0, 0, e.w, e.h, 6);
      fill(230, 160, 190);
      triangle(-8, e.h / 2, -2, e.h / 2 + 8, -6, e.h / 2 + 2);
      triangle(8, e.h / 2, 2, e.h / 2 + 8, 6, e.h / 2 + 2);
      fill(30, 0, 40);
      ellipse(-4, -2, 4, 4);
      ellipse(4, -2, 4, 4);
    } else if (e.type === "macroparasite") {
      fill(210, 110, 50);
      beginShape();
      for (let a = 0; a < TWO_PI; a += PI / 6) {
        const r = e.w / 2 + sin(frameCount * 0.04 + a * 2) * 4;
        vertex(r * cos(a), r * sin(a));
      }
      endShape(CLOSE);
      fill(40, 0, 0, 180);
      ellipse(-6, -4, 6, 6);
      ellipse(6, 2, 6, 6);
      ellipse(0, 6, 5, 5);
    } else {
      // parasite: tougher, irregular blob
      fill(250, 180, 80);
      beginShape();
      for (let a = 0; a < TWO_PI; a += PI / 6) {
        const r = e.w / 2 + sin(frameCount * 0.08 + a * 3) * 3;
        vertex(r * cos(a), r * sin(a));
      }
      endShape(CLOSE);
      noStroke();
      fill(80, 20, 0);
      ellipse(-4, -2, 5, 5);
      ellipse(4, 0, 5, 5);
    }
    pop();
  }
}

function drawBullets() {
  noStroke();
  for (let b of bullets) {
    fill(255, 255, 255);
    ellipse(b.x, b.y, 8, 14);
  }

  for (let eb of enemyBullets) {
    fill(220, 90, 90);
    ellipse(eb.x, eb.y, 8, 12);
  }
}

function drawParticles() {
  noStroke();
  for (let p of particles) {
    fill(p.col[0], p.col[1], p.col[2], p.alpha);
    ellipse(p.x, p.y, p.size, p.size);
  }
}

function drawPowerups() {
  for (let pu of powerups) {
    push();
    translate(pu.x, pu.y);
    if (pu.kind === "rapid") {
      stroke(180, 230, 255);
      strokeWeight(3);
      line(0, 0, 0, 14);
      line(0, 0, -7, -8);
      line(0, 0, 7, -8);
    } else {
      stroke(120, 255, 220);
      strokeWeight(2.5);
      for (let a = PI / 6; a < TWO_PI + PI / 6; a += PI / 3) {
        const x = 8 * cos(a);
        const y = 8 * sin(a);
        const nx = 8 * cos(a + PI / 3);
        const ny = 8 * sin(a + PI / 3);
        line(x, y, nx, ny);
      }
      strokeWeight(1.5);
      ellipse(0, 0, 8, 8);
    }
    pop();
  }
}

function drawTitleScreen() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("IMMUNE DEFENDER", width / 2, height / 2 - 40);

  textSize(16);
  text("You are a white blood cell defending the bloodstream.", width / 2, height / 2);
  text("← → to move   •   SPACE to engulf pathogens   •   ENTER to start", width / 2, height / 2 + 40);
}

function drawEndScreen(mainText, subText) {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(28);
  text(mainText, width / 2, height / 2 - 20);
  textSize(16);
  text(subText, width / 2, height / 2 + 20);
}

function drawRespawnMessage() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  text(`Oh no! ${lives} lives left`, width / 2, height / 2 - 20);
  textSize(18);
  const elapsed = millis() - respawnTimer;
  const remaining = max(1, 3 - floor(elapsed / 1000));
  text(`Countdown: ${remaining}`, width / 2, height / 2 + 16);
}

function drawWaveLabel() {
  const elapsed = millis() - announceTimer;
  if (elapsed < 1600) {
    fill(255, 255, 255, 180);
    textAlign(CENTER, CENTER);
    textSize(22);
    const label = elapsed < 800 ? `Stage ${stage}` : `Level ${level}`;
    text(label, width / 2, 90);
  }
}

// ---------- UPDATES ----------

function handleInput() {
  // Keyboard movement
  if (keyIsDown(LEFT_ARROW)) {
    player.x -= player.speed;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    player.x += player.speed;
  }

  // Touch movement with offset + easing
  if (touchFiring && touches && touches.length > 0) {
    const tx = touches[0].x;
    const OFFSET_X = 60;
    touchTargetX = tx - OFFSET_X;
  } else {
    touchTargetX = null;
  }

  if (touchTargetX !== null) {
    const EASING = 0.25;
    player.x = lerp(player.x, touchTargetX, EASING);
  }
  player.x = constrain(player.x, 30, width - 30);

  if (keyIsDown(32)) {
    tryShoot();
  }

  if (touchFiring) {
    tryShoot();
  }
}

function updateStars() {
  for (let s of stars) {
    s.y += s.speed;
    if (s.y > height) {
      s.y = 0;
      s.x = random(width);
    }
  }
}

function updateBullets() {
  for (let b of bullets) {
    b.y += b.vy;
  }
  bullets = bullets.filter(b => b.y > -20);
}

function updateEnemyBullets() {
  for (let eb of enemyBullets) {
    eb.y += eb.vy;
    if (eb.swayPhase !== undefined) {
      eb.x += sin(frameCount * 0.12 + eb.swayPhase) * eb.swayAmp;
    }
  }
  enemyBullets = enemyBullets.filter(eb => eb.y < height + 30);
}

function updateEnemies() {
  if (enemies.length === 0) return;

  let minX = Infinity;
  let maxX = -Infinity;
  for (let e of enemies) {
    const moveScale = e.diveActive || (e.type === "spore" && e.detached) ? 0 : e.speedScale || 1;
    e.x += enemySpeed * enemyDir * moveScale;
    minX = min(minX, e.x);
    maxX = max(maxX, e.x);
  }

  if (minX < 30 || maxX > width - 30) {
    enemyDir *= -1;
    for (let e of enemies) {
      e.y += 16;
      e.x = constrain(e.x, 30, width - 30);
    }
  }

  for (let e of enemies) {
    applyEnemyMovement(e);
    maybeTriggerDive(e);
  }

  maybeEnemyFire();
}

function applyEnemyMovement(enemy) {
  const eLevel = effectiveLevel();
  if (enemy.diveActive) {
    const steer = 0.02 + eLevel * 0.0025;
    enemy.x = lerp(enemy.x, player.x, steer);
    enemy.y += enemy.diveSpeed;
    enemy.x += sin(frameCount * 0.18 + enemy.diveWobble) * 1.4;

    if (enemy.y > height + 30) {
      resetDiver(enemy);
    }
    return;
  }

  if (enemy.type === "spore") {
    if (!enemy.detached && millis() > enemy.detachAt) {
      const cap = sporeDetachLimit();
      if (detachedSpores < cap) {
        enemy.detached = true;
        detachedSpores++;
        enemy.pattern = "drift";
      } else {
        enemy.detachAt = millis() + 700;
      }
    }

    if (enemy.detached) {
      enemy.y += 0.6 + eLevel * 0.05;
      enemy.x += sin(frameCount * 0.08 + enemy.phase) * 1.5;
      return;
    }
  }

  if (enemy.pattern === "zigzag") {
    enemy.x += sin(frameCount * 0.08 + enemy.phase) * 1.5;
    enemy.y += sin(frameCount * 0.12 + enemy.phase) * 1.4;
    if (random() < 0.008 + eLevel * 0.001) {
      enemy.x += random([-10, 10]);
    }
  } else if (enemy.pattern === "orbit") {
    enemy.y += sin(frameCount * 0.07 + enemy.phase) * 0.7;
  } else if (enemy.pattern === "snake") {
    enemy.y += sin(frameCount * 0.06 + enemy.phase) * 1.8;
    enemy.x += sin(frameCount * 0.07 + enemy.phase * 1.3) * 0.9;
    if (enemy.y > height - 140) {
      enemy.y += 0.6;
    }
  } else if (enemy.pattern === "jitter") {
    enemy.x += random(-1.2, 1.2);
    enemy.y += random(-0.8, 0.8);
    if (millis() > enemy.dashCooldown && random() < 0.006 + eLevel * 0.0006) {
      enemy.x += random([-35, 35]);
      enemy.dashCooldown = millis() + 1200;
    }
    enemy.x = constrain(enemy.x, 30, width - 30);
  } else if (enemy.pattern === "anchor") {
    enemy.y += sin(frameCount * 0.03 + enemy.phase) * 0.6;
  } else if (enemy.pattern === "macro") {
    enemy.y += sin(frameCount * 0.05 + enemy.phase) * 1.1;
    if (millis() > enemy.stalkCooldown) {
      enemy.x = lerp(enemy.x, player.x, 0.08);
      enemy.stalkCooldown = millis() + 1800 + random(1000);
    }
  } else {
    enemy.y += sin(frameCount * 0.05 * enemy.jiggle + enemy.x * 0.02) * 0.35;
    if (enemy.type === "virus" || enemy.type === "capsule") {
      enemy.x += sin(frameCount * 0.04 + enemy.phase) * 0.5;
    }
  }
}

function sporeDetachLimit() {
  if (stage < 4) return 0;
  if (stage < 5) return 1;
  if (stage < 6) return 2;
  return 3;
}

function maybeTriggerDive(enemy) {
  if (gameState !== "play") return;
  if (enemy.type !== "parasite") return;
  if (enemy.diveActive) return;
  const eLevel = effectiveLevel();
  if (eLevel < 2) return;

  const stageBias = stage === 5 ? -0.00025 : stage >= 6 ? 0.00015 : 0;
  const diveChance = 0.0008 + max(0, stage - 2) * 0.00035 + (eLevel - 2) * 0.00045 + stageBias;
  if (random() < diveChance) {
    enemy.diveActive = true;
    enemy.diveSpeed = 3.3 + stage * 0.25 + eLevel * 0.2;
    enemy.diveWobble = random(TWO_PI);
  }
}

function resetDiver(enemy) {
  enemy.diveActive = false;
  enemy.y = -40;
  enemy.x = random(40, width - 40);
  enemy.phase = random(TWO_PI);
}

function updatePowerups() {
  for (let pu of powerups) {
    pu.y += pu.vy;
  }
  powerups = powerups.filter(pu => pu.y < height + 20);

  if (rapidFire.active && millis() - rapidFire.timer > rapidFire.duration) {
    rapidFire.active = false;
    shotDelay = baseShotDelay;
  }

  if (shield.active && millis() - shield.timer > shield.duration) {
    shield.active = false;
  }
}

function maybeEnemyFire() {
  if (stage < 2 || gameState !== "play") return;

  const eLevel = effectiveLevel();
  const difficultyRamp = (stage - 1) * 0.35 + (eLevel - 1) * 0.4;
  const volleyChance = 0.0035 + difficultyRamp * 0.0015;
  if (random() > volleyChance) return;

  const shooters = min(enemies.length, 1 + floor((stage + eLevel) / 3));
  const weighted = [];
  for (const e of enemies) {
    let weight = 1;
    if (e.type === "sporeLauncher") weight += 2;
    else if (e.type === "mutant" || e.type === "macroparasite") weight += 1;
    for (let i = 0; i < weight; i++) weighted.push(e);
  }

  const pick = [];
  for (const e of shuffle(weighted)) {
    if (!pick.includes(e)) {
      pick.push(e);
    }
    if (pick.length >= shooters) break;
  }

  const baseVy = 2.4 + stage * 0.25 + eLevel * 0.2;
  for (let e of pick) {
    const bullet = {
      x: e.x,
      y: e.y + e.h / 2,
      vy: baseVy
    };
    if (e.type === "sporeLauncher") {
      bullet.vy = baseVy * 0.85;
      bullet.swayPhase = random(TWO_PI);
      bullet.swayAmp = 1.6;
    }
    enemyBullets.push(bullet);
  }
}

function updateParticles() {
  for (let p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 4;
    p.size += 0.2;
  }
  particles = particles.filter(p => p.alpha > 0);
}

// ---------- COLLISIONS & GAME LOGIC ----------

function handleCollisions() {
  // bullets vs enemies
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (circleRectCollision(b.x, b.y, 4, e.x, e.y, e.w, e.h)) {
        e.hp--;
        spawnEngulfParticles(e.x, e.y, e.type);

        bullets.splice(i, 1);
        if (e.hp <= 0) {
          maybeDropPowerup(e);
          if (e.type === "spore" && e.detached) detachedSpores = max(0, detachedSpores - 1);
          enemies.splice(j, 1);
          addScore(100 + stage * 10 + (level - 1) * 20);
        } else {
          addScore(40 + stage * 4 + (level - 1) * 8);
        }
        break;
      }
    }
  }

  // powerups vs player
  for (let i = powerups.length - 1; i >= 0; i--) {
    const pu = powerups[i];
    if (dist(pu.x, pu.y, player.x, player.y) < 30) {
      powerups.splice(i, 1);
      activatePowerup(pu.kind);
    }
  }

  // enemy bullets vs player
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const eb = enemyBullets[i];
    if (dist(eb.x, eb.y, player.x, player.y) < player.w / 2 + 4) {
      enemyBullets.splice(i, 1);
      if (shield.active) {
        shield.active = false;
        spawnEngulfParticles(player.x, player.y, "shield");
      } else {
        loseLife();
        return; // arrays are reset in loseLife; exit to avoid stale references
      }
    }
  }

  // enemies vs player or bottom
  for (let e of enemies) {
    if (circleRectCollision(player.x, player.y, player.w / 2, e.x, e.y, e.w, e.h)) {
      if (shield.active) {
        shield.active = false;
        spawnEngulfParticles(player.x, player.y, "shield");
      } else {
        loseLife();
      }
      break;
    }
    if (!e.diveActive && e.y > height - 50) {
      if (shield.active) {
        shield.active = false;
        spawnEngulfParticles(player.x, player.y, "shield");
      } else {
        loseLife();
      }
      break;
    }
  }
}

function maybeDropPowerup(enemy) {
  let dropChance = 0.15;
  if (enemy.type === "virus" || enemy.type === "mutant") dropChance = 0.35;
  else if (enemy.type === "parasite" || enemy.type === "swarm" || enemy.type === "sporeLauncher") dropChance = 0.25;
  else if (enemy.type === "capsule" || enemy.type === "helminth") dropChance = 0.2;
  else if (enemy.type === "macroparasite") dropChance = 1;
  else if (enemy.type === "spore") dropChance = 0.12;
  if (random() < dropChance) {
    const kind = random() < 0.55 ? "rapid" : "shield";
    powerups.push({
      x: enemy.x,
      y: enemy.y,
      vy: 2.4,
      kind
    });
  }
}

function loseLife() {
  lives--;
  spawnEngulfParticles(player.x, player.y, "hit");
  playImplosionSound();
  refreshSounds();
  bullets = [];
  enemies = [];
  powerups = [];
  enemyBullets = [];
  detachedSpores = 0;
  enemyDir = 1;
  initPlayer();
  if (lives <= 0) {
    gameState = "gameover";
  } else {
    respawnTimer = millis();
    gameState = "respawn";
  }
}

function checkWinLose() {
  if (gameState !== "play") return;

  if (enemies.length === 0) {
    refreshSounds();
    registerMemoryCells();
    stage++;
    if (stage > stagesPerLevel) {
      stage = 1;
      level++;
    }
    spawnWave();
  }
}

function registerMemoryCells() {
  for (const type of currentWaveTypes) {
    memoryCells[type] = (memoryCells[type] || 0) + 1;
  }
  if (currentWaveTypes.size) {
    statusPanel.title = "Memory cells";
    statusPanel.text = "Past encounters prime defenses: repeated pathogens spawn with less HP.";
    statusPanel.timer = millis();
  }
}

function activatePowerup(kind) {
  if (kind === "rapid") {
    rapidFire.active = true;
    rapidFire.timer = millis();
    shotDelay = 80;
    statusPanel.title = "B-cells";
    statusPanel.text = "Antibodies flood in: rapid-fire bursts for a short window.";
    statusPanel.timer = millis();
  } else if (kind === "shield") {
    shield.active = true;
    shield.timer = millis();
    statusPanel.title = "T-cells";
    statusPanel.text = "T-cells reinforce your membrane, blocking the next hit.";
    statusPanel.timer = millis();
  }
}

function loadOptionalSound(path, volume) {
  let soundFile = null;
  try {
    soundFile = loadSound(
      path,
      snd => {
        snd.setVolume?.(volume);
        soundFile = snd;
      },
      () => {
        console.warn(`Optional sound missing or failed to load: ${path}`);
        soundFile = null;
      }
    );
  } catch (err) {
    console.warn(`Sound library error while loading ${path}:`, err);
    soundFile = null;
  }
  return soundFile;
}

function refreshSounds() {
  if (typeof loadSound !== "function") return;

  shootSounds = shootSounds.filter(Boolean);
  for (const snd of shootSounds) {
    try {
      snd.stop?.();
      snd.playMode?.("restart");
      snd.setVolume?.(shootVolume);
    } catch (err) {
      console.warn("Unable to refresh shot sound:", err);
    }
  }

  if (implosionSound) {
    try {
      implosionSound.stop?.();
      implosionSound.playMode?.("restart");
      implosionSound.setVolume?.(implosionVolume);
    } catch (err) {
      console.warn("Unable to refresh implosion sound:", err);
    }
  }
}

function playShootSound() {
  if (!shootSounds.length) return;
  const snd = random(shootSounds);
  if (!snd) return;
  if (!snd.isLoaded || snd.isLoaded()) {
    snd.play();
  }
}

function playImplosionSound() {
  if (!implosionSound) return;
  if (!implosionSound.isLoaded || implosionSound.isLoaded()) {
    implosionSound.play();
  }
}

function saveHighScore() {
  try {
    localStorage.setItem(highScoreKey, String(highScore));
  } catch (err) {
    console.warn("Unable to save high score", err);
  }
}

function addScore(amount) {
  score += amount;
  if (score > highScore) {
    highScore = score;
    newHighScore = true;
    newHighScoreTimer = millis();
    saveHighScore();
  }

  while (score >= nextExtraLifeScore) {
    lives++;
    nextExtraLifeScore += 50000;
    statusPanel.title = "Immune surge";
    statusPanel.text = "Immune system rallies—extra life granted at 50,000 points.";
    statusPanel.timer = millis();
    spawnEngulfParticles(player.x, player.y, "shield");
  }
}

// ---------- UTILS ----------

function spawnEngulfParticles(x, y, type) {
  let baseCol;
  if (type === "virus") {
    baseCol = [200, 140, 255];
  } else if (type === "bacteria") {
    baseCol = [120, 255, 160];
  } else if (type === "capsule") {
    baseCol = [140, 220, 240];
  } else if (type === "spore" || type === "sporeLauncher") {
    baseCol = [255, 190, 120];
  } else if (type === "swarm") {
    baseCol = [170, 230, 220];
  } else if (type === "helminth") {
    baseCol = [240, 200, 120];
  } else if (type === "mutant") {
    baseCol = [120, 200, 230];
  } else if (type === "macroparasite") {
    baseCol = [210, 110, 50];
  } else if (type === "shield") {
    baseCol = [120, 255, 220];
  } else {
    baseCol = [255, 255, 255];
  }

  for (let i = 0; i < 15; i++) {
    particles.push({
      x: x,
      y: y,
      vx: random(-1.5, 1.5),
      vy: random(-1.5, 1.5),
      size: random(4, 9),
      alpha: 255,
      col: baseCol
    });
  }
}

function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
  // standard circle-rect collision
  let testX = cx;
  let testY = cy;

  if (cx < rx - rw / 2) testX = rx - rw / 2;
  else if (cx > rx + rw / 2) testX = rx + rw / 2;

  if (cy < ry - rh / 2) testY = ry - rh / 2;
  else if (cy > ry + rh / 2) testY = ry + rh / 2;

  const distX = cx - testX;
  const distY = cy - testY;
  const distance = sqrt(distX * distX + distY * distY);

  return distance <= cr;
}

// ---------- INPUT ----------

function keyPressed() {
  if (key === " ") {
    tryShoot();
  }

  if (isLevelSelectCombo()) {
    secretLevelSelect();
    return;
  }

  if (keyCode === ENTER) {
    if (gameState === "title" || gameState === "gameover") {
      resetGame();
      gameState = "play";
    }
  }
}

function mousePressed() {
  if (gameState === "title" || gameState === "gameover") {
    resetGame();
    gameState = "play";
  }
}

function isLevelSelectCombo() {
  const normalized = key.toLowerCase();
  const ctrl = keyIsDown(CONTROL);
  const shift = keyIsDown(SHIFT);
  const alt = keyIsDown(ALT);

  // Primary: Ctrl+Shift+0 (may be blocked by browser zoom shortcuts)
  if (key === "0" && ctrl && shift) return true;

  // Fallbacks that tend to avoid browser defaults
  // Ctrl+Shift+L ("level") and Ctrl+Alt+L for Chrome/Firefox safety
  if (normalized === "l" && ctrl && (shift || alt)) return true;

  // Ctrl+Alt+` (backtick) as a final option when number row is blocked
  if (key === "`" && ctrl && alt) return true;

  return false;
}

function tryShoot() {
  if (gameState !== "play") return;
  const now = millis();
  if (now - lastShotTime < shotDelay) return;

  bullets.push({
    x: player.x,
    y: player.y - 30,
    vy: -8
  });

  playShootSound();
  lastShotTime = now;
}

function secretLevelSelect() {
  const input = prompt("Secret level select (1-9): enter target level", level);
  if (input === null) return;

  const parsed = int(input.trim());
  if (isNaN(parsed)) {
    statusPanel.title = "Debug: invalid level";
    statusPanel.text = "Enter a number between 1 and 9.";
    statusPanel.timer = millis();
    return;
  }

  const targetLevel = constrain(parsed, 1, 9);
  level = targetLevel;
  stage = 1;
  enemyDir = 1;
  respawnTimer = 0;
  if (lives <= 0) lives = 3;
  gameState = "play";
  bullets = [];
  powerups = [];
  enemyBullets = [];
  currentWaveTypes = new Set();
  refreshSounds();
  spawnWave();

  statusPanel.title = "Level jump";
  statusPanel.text = `Ctrl+Shift+0: testing Level ${level}, Stage ${stage}`;
  statusPanel.timer = millis();
}

function touchStarted() {
  touchFiring = true;

  if (gameState === "title" || gameState === "gameover" || gameState === "win") {
    resetGame();
    gameState = "play";
  }

  return false;
}

function touchMoved() {
  touchFiring = true;
  return false;
}

function touchEnded() {
  touchFiring = false;
  touchTargetX = null;
  return false;
}

function windowResized() {
  applyCanvasLayout();
}
