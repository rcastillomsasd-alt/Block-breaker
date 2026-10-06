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
const restartButton = document.getElementById("restart-button");

const WIDTH = canvas.width;   // 600
const HEIGHT = canvas.height; // 450


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
  gameState = message === "You Win!" ? "won" : "lost";
  gameMessage.textContent = message;
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
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "white";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  for (const activeBall of balls) {
    ctx.fillStyle = activeBall.isStarter ? "white" : "#168bff";
    ctx.fillRect(activeBall.x, activeBall.y, activeBall.width, activeBall.height);
  }

  drawBricks();  // bricks.js
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
