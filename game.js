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
const restartButton = document.getElementById("restart-button");

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
  speed: 6
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
  gameMessage.textContent = message;
  winPortrait.hidden = !isWin;
  gameOverlay.hidden = false;
}

function resetGame() {
  bricks = makeBricks();
  balls = [makeStarterBall()];
  reserveCount = STARTING_RESERVES;
  gameState = "playing";
  gameOverlay.hidden = true;
  updateReserveHolder();
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

function drawPaddle() {
  ctx.save();
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

restartButton.addEventListener("click", resetGame);

// Wait until all three script files have loaded, then start.
window.addEventListener("load", start);
