// Immune Defender: White Blood Cell vs Pathogens
// Paste this into sketch.js in the p5.js Web Editor

let player;
let bullets = [];
let enemies = [];
let particles = [];
let powerups = [];
let stars = [];
let enemyBullets = [];

let enemyDir = 1; // horizontal direction of enemy swarm
let enemySpeed = 1.2;
let gameState = "title"; // "title", "play", "gameover"

let score = 0;
let lives = 3;
let level = 1;
let stage = 1; // 1-6 within a level
let announceTimer = 0;
const stagesPerLevel = 6;

let lastShotTime = 0;
const baseShotDelay = 260; // ms between shots
let shotDelay = baseShotDelay;

const rapidFire = { active: false, timer: 0, duration: 8000 };
const shield = { active: false, timer: 0, duration: 6500 };

function setup() {
  createCanvas(800, 600);
  textFont("monospace");
  initStars();
  resetGame();
}

// ---------- SETUP HELPERS ----------

function resetGame() {
  score = 0;
  lives = 3;
  level = 1;
  stage = 1;
  enemyDir = 1;
  enemySpeed = 1.2;
  shotDelay = baseShotDelay;
  bullets = [];
  enemies = [];
  particles = [];
  powerups = [];
  enemyBullets = [];
  rapidFire.active = false;
  shield.active = false;
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

function spawnWave() {
  enemies = [];
  bullets = [];
  powerups = [];
  enemyBullets = [];
  enemyDir = 1;

  const cols = min(10, 6 + floor((stage - 1) / 1) + floor((level - 1) / 2));
  const rows = min(6, 3 + floor((stage - 1) / 2) + floor((level - 1) / 2));
  const spacingX = 80 - min(16, stage * 2 + level);
  const spacingY = 55;
  const offsetX = (width - (cols - 1) * spacingX) / 2;
  const offsetY = 80;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const type = random() < 0.22 ? "virus" : "bacteria"; // 22% special
      enemies.push({
        x: offsetX + c * spacingX,
        y: offsetY + r * spacingY,
        w: 34,
        h: 26,
        type: type,
        hp: type === "virus" ? 2 : 1,
      });
    }
  }

  enemySpeed = 1.2 + (stage - 1) * 0.18 + (level - 1) * 0.2;
  announceTimer = millis();
}

// ---------- MAIN LOOP ----------

function draw() {
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
  } else if (gameState === "gameover") {
    drawHud();
    drawPlayer();
    drawEnemies();
    drawParticles();
    drawEndScreen("INFECTION OVERWHELMED DEFENSE", "Press ENTER to try again");
  }

  drawScanlines();
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

function drawHud() {
  fill(255);
  noStroke();
  textSize(16);
  textAlign(LEFT, TOP);
  text("SCORE: " + score, 16, 10);
  text("LIVES: " + lives, 16, 32);
  text("LEVEL: " + level, 16, 54);
  text("STAGE: " + stage + "/" + stagesPerLevel, 16, 76);

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
    } else {
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
  if (keyIsDown(LEFT_ARROW)) {
    player.x -= player.speed;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    player.x += player.speed;
  }
  player.x = constrain(player.x, 30, width - 30);

  // shooting handled in keyPressed for nicer feel
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
  }
  enemyBullets = enemyBullets.filter(eb => eb.y < height + 30);
}

function updateEnemies() {
  if (enemies.length === 0) return;

  let edgeHit = false;
  for (let e of enemies) {
    e.x += enemySpeed * enemyDir;
    if (e.x < 30 || e.x > width - 30) {
      edgeHit = true;
    }
  }

  if (edgeHit) {
    enemyDir *= -1;
    for (let e of enemies) {
      e.y += 16;
    }
  }

  for (let e of enemies) {
    e.y += sin(frameCount * 0.05 + e.x * 0.02) * 0.2;
  }

  maybeEnemyFire();
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

  const difficultyRamp = (stage - 1) * 0.35 + (level - 1) * 0.4;
  const volleyChance = 0.0035 + difficultyRamp * 0.0015;
  if (random() > volleyChance) return;

  const shooters = min(enemies.length, 1 + floor((stage + level) / 3));
  const pick = shuffle([...enemies]).slice(0, shooters);
  for (let e of pick) {
    enemyBullets.push({
      x: e.x,
      y: e.y + e.h / 2,
      vy: 2.4 + stage * 0.25 + level * 0.2
    });
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
          enemies.splice(j, 1);
          score += 100 + stage * 10 + (level - 1) * 20;
        } else {
          score += 40 + stage * 4 + (level - 1) * 8;
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
    if (e.y > height - 50) {
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
  const dropChance = enemy.type === "virus" ? 0.35 : 0.15;
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
  bullets = [];
  enemies = [];
  powerups = [];
  enemyBullets = [];
  enemyDir = 1;
  if (lives <= 0) {
    gameState = "gameover";
  } else {
    spawnWave();
  }
}

function checkWinLose() {
  if (enemies.length === 0) {
    stage++;
    if (stage > stagesPerLevel) {
      stage = 1;
      level++;
    }
    spawnWave();
  }
}

function activatePowerup(kind) {
  if (kind === "rapid") {
    rapidFire.active = true;
    rapidFire.timer = millis();
    shotDelay = 80;
  } else if (kind === "shield") {
    shield.active = true;
    shield.timer = millis();
  }
}

// ---------- UTILS ----------

function spawnEngulfParticles(x, y, type) {
  let baseCol;
  if (type === "virus") {
    baseCol = [200, 140, 255];
  } else if (type === "bacteria") {
    baseCol = [120, 255, 160];
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

  if (keyCode === ENTER) {
    if (gameState === "title" || gameState === "gameover") {
      resetGame();
      gameState = "play";
    }
  }
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

  lastShotTime = now;
}
