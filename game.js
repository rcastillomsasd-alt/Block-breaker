// ============================================================
// BLOCK BREAKER (base game)
//
// game.js  = the canvas, the ball, the paddle, and the game loop
// bricks.js     = where the bricks are and how they are drawn
// collisions.js = what happens when the ball touches things
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const reserveHolder = document.getElementById("reserve-balls");
const gameOverlay = document.getElementById("game-overlay");
const gameMessage = document.getElementById("game-message");
const winPortrait = document.getElementById("win-portrait");
const watermelonPortrait = document.getElementById("watermelon-portrait");
const bikePortrait = document.getElementById("bike-portrait");
const restartButton = document.getElementById("restart-button");
const levelLabel = document.getElementById("level-label");
const levelMusic = document.getElementById("level-music");
const minecraftTrackInput = document.getElementById("minecraft-track");
const minecraftAudio = document.getElementById("minecraft-audio");

const WIDTH = 600;
const HEIGHT = 450;
const PIXEL_RATIO = Math.min(window.devicePixelRatio || 1, 3);
canvas.width = WIDTH * PIXEL_RATIO;
canvas.height = HEIGHT * PIXEL_RATIO;
ctx.scale(PIXEL_RATIO, PIXEL_RATIO);


// ------------------------------------------------------------
// THE BALL
// x and y are the top-left corner. vx and vy are how many pixels
// the ball moves each update (vx = sideways, vy = up/down).
// A positive vy means the ball is moving DOWN the screen.
// ------------------------------------------------------------
const BALL_SPEED = 4;
const BALL_SIZE = 12;
const STARTING_RESERVES = 4;

let balls = [];
let reserveCount = STARTING_RESERVES;
let gameState = "playing";
let currentLevel = 1;
let minecraftTrackUrl = null;

function makeBall(x, y, vx, vy, isStarter = false) {
  return { x, y, width: BALL_SIZE, height: BALL_SIZE, vx, vy, isStarter };
}

function makeStarterBall() {
  return makeBall(
    WIDTH / 2 - BALL_SIZE / 2,
    HEIGHT / 2 - BALL_SIZE / 2,
    BALL_SPEED,
    BALL_SPEED,
    true
  );
}


// ------------------------------------------------------------
// THE PADDLE
// ------------------------------------------------------------
const paddle = {
  x: WIDTH / 2 - 45,
  y: HEIGHT - 30,
  width: 90,
  height: 12,
  speed: 7
};


// ------------------------------------------------------------
// THE BRICKS (the list is filled in by makeBricks() in bricks.js)
// ------------------------------------------------------------
let bricks = [];


// ------------------------------------------------------------
// KEYBOARD
// keys["arrowleft"] is true while the left arrow is held down.
// ------------------------------------------------------------
const keys = {};

document.addEventListener("keydown", function (event) {
  keys[event.key.toLowerCase()] = true;
  // Stop the arrow keys from scrolling the page.
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
});

document.addEventListener("keyup", function (event) {
  keys[event.key.toLowerCase()] = false;
});

minecraftTrackInput.addEventListener("change", function () {
  const track = minecraftTrackInput.files[0];
  if (!track) {
    return;
  }

  if (minecraftTrackUrl) {
    URL.revokeObjectURL(minecraftTrackUrl);
  }
  minecraftTrackUrl = URL.createObjectURL(track);
  minecraftAudio.src = minecraftTrackUrl;
  minecraftAudio.play().catch(() => {});
});


// ------------------------------------------------------------
// UPDATE: runs 60 times every second. Move things, then check
// what they touched.
// ------------------------------------------------------------
function update() {
  if (gameState !== "playing") {
    return;
  }

  movePaddle();

  for (let index = balls.length - 1; index >= 0; index--) {
    const activeBall = balls[index];
    moveBall(activeBall);

    bounceOffWalls(activeBall);   // collisions.js
    bounceOffPaddle(activeBall);  // collisions.js
    const hitBrick = bounceOffBricks(activeBall);  // collisions.js

    if (hitBrick && hitBrick.powerup) {
      balls.push(makeBall(
        hitBrick.x + hitBrick.width / 2 - BALL_SIZE / 2,
        hitBrick.y + hitBrick.height / 2 - BALL_SIZE / 2,
        -BALL_SPEED,
        -BALL_SPEED
      ));
    }

    if (activeBall.y > HEIGHT) {
      balls.splice(index, 1);
      if (activeBall.isStarter) {
        if (reserveCount > 0) {
          reserveCount--;
          updateReserveHolder();
          balls.push(makeStarterBall());
        } else {
          finishGame("Game Over");
        }
      }
    }
  }

  if (bricks.length === 0) {
    finishGame("You Win!");
  }
}

function updateReserveHolder() {
  const reserveBalls = reserveHolder.querySelectorAll(".reserve-ball");
  reserveBalls.forEach((reserveBall, index) => {
    reserveBall.classList.toggle("spent", index >= reserveCount);
  });
  reserveHolder.setAttribute("aria-label", `${reserveCount} spare balls`);
}

function finishGame(message) {
  const isWin = message === "You Win!";
  gameState = isWin ? "won" : "lost";
  minecraftAudio.pause();
  gameMessage.textContent = message;
  winPortrait.hidden = !isWin || currentLevel !== 1;
  watermelonPortrait.hidden = !isWin || currentLevel !== 2;
  bikePortrait.hidden = !isWin || currentLevel !== 3;
  restartButton.textContent = isWin && currentLevel < 3 ? "Next Level" : "Play Again";
  gameOverlay.hidden = false;
}

function resetGame() {
  currentLevel = 1;
  reserveCount = STARTING_RESERVES;
  updateLevelTheme();
  resetLevelBoard();
}

function startNextLevel() {
  currentLevel++;
  reserveCount = STARTING_RESERVES;
  updateLevelTheme();
  resetLevelBoard();
}

function resetLevelBoard() {
  bricks = makeBricks(currentLevel);
  balls = [makeStarterBall()];
  paddle.x = WIDTH / 2 - paddle.width / 2;
  gameState = "playing";
  gameOverlay.hidden = true;
  updateReserveHolder();
}

function updateLevelTheme() {
  const isMinecraftLevel = currentLevel === 2;
  const isBeachLevel = currentLevel === 3;
  document.body.classList.toggle("minecraft-level", isMinecraftLevel);
  document.body.classList.toggle("beach-level", isBeachLevel);
  document.getElementById("minecraft-character").hidden = !isMinecraftLevel;
  document.getElementById("bike-character").hidden = !isBeachLevel;
  levelMusic.hidden = !isMinecraftLevel;
  if (!isMinecraftLevel) {
    minecraftAudio.pause();
    minecraftAudio.currentTime = 0;
  } else if (minecraftAudio.src) {
    minecraftAudio.play().catch(() => {});
  }
  document.getElementById("edition-label").textContent = currentLevel === 1 ? "LEGEND" : "LEVEL";
  levelLabel.textContent = currentLevel === 1 ? "23" : `0${currentLevel}`;
  document.getElementById("arena-eyebrow").textContent = isMinecraftLevel
    ? "VOXEL QUEST / DIAMOND ARMOR"
    : isBeachLevel ? "COASTLINE RUN / ELECTRIC DIRTBIKE" : "BASKETBALL ARCADE / 1990s EDITION";
  document.querySelector(".arena-header h1").textContent = isMinecraftLevel
    ? "DIAMOND COURT"
    : isBeachLevel ? "SUNSET SHORE" : "FULL COURT";
}

function movePaddle() {
  if (keys["arrowleft"] || keys["a"]) {
    paddle.x = paddle.x - paddle.speed;
  }
  if (keys["arrowright"] || keys["d"]) {
    paddle.x = paddle.x + paddle.speed;
  }

  // Keep the paddle on the screen.
  if (paddle.x < 0) {
    paddle.x = 0;
  }
  if (paddle.x + paddle.width > WIDTH) {
    paddle.x = WIDTH - paddle.width;
  }
}

function moveBall(activeBall) {
  activeBall.x = activeBall.x + activeBall.vx;
  activeBall.y = activeBall.y + activeBall.vy;
}


// ------------------------------------------------------------
// DRAW: paints everything on the canvas. Black background,
// white shapes.
// ------------------------------------------------------------
function draw() {
  drawCourt();
  drawPaddle();
  for (const activeBall of balls) {
    drawBasketball(activeBall);
  }

  drawBricks();  // bricks.js
}

function drawCourt() {
  if (currentLevel === 3) {
    drawBeachCourt();
    return;
  }
  if (currentLevel === 2) {
    drawMinecraftCourt();
    return;
  }

  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, "#17171a");
  background.addColorStop(0.5, "#272326");
  background.addColorStop(1, "#111114");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const floor = ctx.createLinearGradient(0, HEIGHT * 0.42, 0, HEIGHT);
  floor.addColorStop(0, "rgb(123 43 36 / 8%)");
  floor.addColorStop(0.55, "rgb(161 75 49 / 19%)");
  floor.addColorStop(1, "rgb(44 25 27 / 35%)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, HEIGHT * 0.42, WIDTH, HEIGHT * 0.58);

  for (let y = 204; y < HEIGHT; y += 18) {
    ctx.fillStyle = y % 36 === 24 ? "rgb(255 255 255 / 2%)" : "rgb(0 0 0 / 5%)";
    ctx.fillRect(0, y, WIDTH, 9);
  }

  ctx.save();
  ctx.strokeStyle = "rgb(245 235 225 / 15%)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, WIDTH - 48, HEIGHT - 48);
  ctx.beginPath();
  ctx.moveTo(24, 185);
  ctx.lineTo(WIDTH - 24, 185);
  ctx.moveTo(24, 350);
  ctx.lineTo(WIDTH - 24, 350);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(WIDTH / 2, 285, 72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(WIDTH / 2, 285, 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgb(245 235 225 / 20%)";
  ctx.fill();
  ctx.restore();

  const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 100, WIDTH / 2, HEIGHT / 2, 430);
  vignette.addColorStop(0, "rgb(0 0 0 / 0%)");
  vignette.addColorStop(1, "rgb(0 0 0 / 52%)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawMinecraftCourt() {
  ctx.fillStyle = "#78bce8";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let row = 0; row < 8; row++) {
    const y = 150 + row * 24;
    const parallax = row * 13;
    for (let col = -1; col < 14; col++) {
      const x = col * 52 - parallax;
      const height = 35 + ((col * 7 + row * 11 + 90) % 4) * 12;
      ctx.fillStyle = row % 2 === 0 ? "#557d57" : "#456949";
      ctx.fillRect(x, y - height, 54, height + 2);
      ctx.fillStyle = "#79a968";
      ctx.fillRect(x, y - height, 54, 7);
      ctx.fillStyle = "rgb(25 54 42 / 24%)";
      ctx.fillRect(x + 46, y - height, 8, height + 2);
      if ((col + row) % 3 === 0) {
        ctx.fillStyle = "#3e684f";
        ctx.fillRect(x + 13, y - height - 12, 24, 13);
      }
    }

  }

  ctx.fillStyle = "#7e5839";
  ctx.fillRect(0, 356, WIDTH, HEIGHT - 356);
  ctx.fillStyle = "#936b43";
  ctx.fillRect(0, 356, WIDTH, 11);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 13; col++) {
      const x = col * 50 + (row % 2) * 25;
      const y = 368 + row * 22;
      ctx.fillStyle = (row + col) % 2 === 0 ? "#8a6341" : "#745035";
      ctx.fillRect(x, y, 49, 21);
      ctx.fillStyle = "rgb(255 221 157 / 10%)";
      ctx.fillRect(x + 2, y + 2, 45, 2);
    }
  }

  ctx.strokeStyle = "rgb(227 255 244 / 28%)";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, WIDTH - 36, HEIGHT - 36);
  ctx.fillStyle = "rgb(255 255 255 / 16%)";
  ctx.fillRect(18, 18, WIDTH - 36, 3);
}

function drawBeachCourt() {
  const sky = ctx.createLinearGradient(0, 0, 0, 260);
  sky.addColorStop(0, "#e96b73");
  sky.addColorStop(0.62, "#ffad78");
  sky.addColorStop(1, "#ffe0a0");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const sun = ctx.createRadialGradient(465, 146, 12, 465, 146, 68);
  sun.addColorStop(0, "#fff4c2");
  sun.addColorStop(1, "#ffd177");
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(465, 146, 57, 0, Math.PI * 2);
  ctx.fill();

  const sea = ctx.createLinearGradient(0, 232, 0, 370);
  sea.addColorStop(0, "#40b7bc");
  sea.addColorStop(1, "#167d91");
  ctx.fillStyle = sea;
  ctx.fillRect(0, 232, WIDTH, 138);
  for (let row = 0; row < 6; row++) {
    const y = 250 + row * 20;
    ctx.strokeStyle = row % 2 === 0 ? "rgb(225 255 226 / 42%)" : "rgb(255 214 161 / 40%)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= WIDTH; x += 36) {
      const waveY = y + Math.sin((x + row * 24) / 38) * 3;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }

  const sand = ctx.createLinearGradient(0, 350, 0, HEIGHT);
  sand.addColorStop(0, "#f0c17f");
  sand.addColorStop(1, "#d68c61");
  ctx.fillStyle = sand;
  ctx.fillRect(0, 350, WIDTH, HEIGHT - 350);

  ctx.fillStyle = "rgb(255 238 187 / 35%)";
  ctx.beginPath();
  ctx.moveTo(0, 350);
  ctx.quadraticCurveTo(150, 330, 300, 350);
  ctx.quadraticCurveTo(450, 368, WIDTH, 344);
  ctx.lineTo(WIDTH, 365);
  ctx.quadraticCurveTo(450, 386, 300, 368);
  ctx.quadraticCurveTo(150, 348, 0, 370);
  ctx.fill();

  ctx.fillStyle = "rgb(56 54 48 / 65%)";
  ctx.beginPath();
  ctx.moveTo(18, 354);
  ctx.quadraticCurveTo(50, 276, 88, 191);
  ctx.lineTo(101, 196);
  ctx.quadraticCurveTo(74, 286, 38, 360);
  ctx.fill();
  ctx.strokeStyle = "rgb(56 54 48 / 75%)";
  ctx.lineWidth = 8;
  for (const [endX, endY, curveX, curveY] of [[10, 171, 40, 190], [80, 154, 79, 180], [133, 185, 105, 195], [54, 151, 55, 176]]) {
    ctx.beginPath();
    ctx.moveTo(91, 196);
    ctx.quadraticCurveTo(curveX, curveY, endX, endY);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgb(255 244 211 / 34%)";
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, WIDTH - 36, HEIGHT - 36);
}

function drawPaddle() {
  ctx.save();
  if (currentLevel === 3) {
    ctx.shadowColor = "rgb(255 247 199 / 68%)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#f37963";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = "#fff0bf";
    ctx.fillRect(paddle.x + 2, paddle.y + 2, paddle.width - 4, 3);
    ctx.restore();
    return;
  }
  if (currentLevel === 2) {
    ctx.shadowColor = "rgb(66 245 245 / 48%)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#176f85";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = "#76f0ee";
    ctx.fillRect(paddle.x + 2, paddle.y + 2, paddle.width - 4, 4);
    ctx.fillStyle = "#36b9c7";
    ctx.fillRect(paddle.x + 5, paddle.y + 7, paddle.width - 10, 3);
    ctx.restore();
    return;
  }

  ctx.shadowColor = "rgb(255 45 57 / 45%)";
  ctx.shadowBlur = 14;
  const paddleGradient = ctx.createLinearGradient(0, paddle.y, 0, paddle.y + paddle.height);
  paddleGradient.addColorStop(0, "#fff1e8");
  paddleGradient.addColorStop(0.22, "#e43a43");
  paddleGradient.addColorStop(1, "#7c101c");
  ctx.fillStyle = paddleGradient;
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgb(255 255 255 / 80%)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawBasketball(activeBall) {
  const radius = activeBall.width / 2;
  const centerX = activeBall.x + radius;
  const centerY = activeBall.y + radius;
  if (currentLevel === 2) {
    ctx.fillStyle = "#171719";
    ctx.fillRect(activeBall.x, activeBall.y, activeBall.width, activeBall.height);
    ctx.fillStyle = activeBall.isStarter ? "#e58b45" : "#4ce7ed";
    ctx.fillRect(activeBall.x + 2, activeBall.y + 2, activeBall.width - 4, activeBall.height - 4);
    ctx.fillStyle = "rgb(255 255 255 / 60%)";
    ctx.fillRect(activeBall.x + 3, activeBall.y + 2, 3, 2);
    return;
  }

  const ballGradient = ctx.createRadialGradient(
    centerX - radius * 0.38,
    centerY - radius * 0.45,
    radius * 0.1,
    centerX,
    centerY,
    radius * 1.1
  );

  if (activeBall.isStarter) {
    ballGradient.addColorStop(0, "#ffcf86");
    ballGradient.addColorStop(0.38, "#e98232");
    ballGradient.addColorStop(1, "#873715");
  } else {
    ballGradient.addColorStop(0, "#e5f8ff");
    ballGradient.addColorStop(0.38, "#37aaff");
    ballGradient.addColorStop(1, "#064b9a");
  }

  ctx.save();
  ctx.shadowColor = activeBall.isStarter ? "rgb(255 137 61 / 45%)" : "rgb(37 151 255 / 75%)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = ballGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = activeBall.isStarter ? "#381b12" : "#092c4c";
  ctx.lineWidth = Math.max(1, radius * 0.14);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.96, -Math.PI / 2, Math.PI / 2);
  ctx.moveTo(centerX, centerY - radius);
  ctx.arc(centerX - radius, centerY, radius, -Math.PI / 2, Math.PI / 2);
  ctx.moveTo(centerX - radius * 0.8, centerY - radius * 0.6);
  ctx.quadraticCurveTo(centerX + radius * 0.15, centerY, centerX - radius * 0.8, centerY + radius * 0.6);
  ctx.moveTo(centerX + radius * 0.8, centerY - radius * 0.6);
  ctx.quadraticCurveTo(centerX - radius * 0.15, centerY, centerX + radius * 0.8, centerY + radius * 0.6);
  ctx.stroke();
  ctx.restore();
}


// ------------------------------------------------------------
// THE GAME LOOP
// The browser calls frame() every time it is ready to draw.
// Some screens are faster than others, so we make sure update()
// always runs exactly 60 times per second on every computer.
// ------------------------------------------------------------
const STEP = 1000 / 60;
let lastTime = 0;
let leftover = 0;

function frame(now) {
  leftover = leftover + (now - lastTime);
  lastTime = now;

  // If the tab was hidden for a while, don't try to catch up.
  if (leftover > 250) {
    leftover = 250;
  }

  while (leftover >= STEP) {
    update();
    leftover = leftover - STEP;
  }

  draw();
  requestAnimationFrame(frame);
}

function start() {
  resetGame();
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

restartButton.addEventListener("click", function () {
  if (gameState === "won" && currentLevel < 3) {
    startNextLevel();
    return;
  }

  resetGame();
});

// Wait until all three script files have loaded, then start.
window.addEventListener("load", start);
