// ============================================================
// bricks.js: where the bricks are, and how they are drawn
// ============================================================

const BRICK_COLUMNS = 8;
const BRICK_ROWS = 4;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 6;     // empty space between bricks
const BRICKS_TOP = 50;   // how far down the first row starts
const POWERUP_BRICK_COUNT = 3;

// Builds the list of bricks. Each brick is an object with an
// x, y, width, and height.
function makeBricks() {
  const list = [];

  // Center the whole block of bricks on the screen.
  const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
  const left = (WIDTH - totalWidth) / 2;

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLUMNS; col++) {
      list.push({
        x: left + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICKS_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT
      });
    }
  }

  const powerupIndices = new Set();
  while (powerupIndices.size < POWERUP_BRICK_COUNT) {
    powerupIndices.add(Math.floor(Math.random() * list.length));
  }
  for (const index of powerupIndices) {
    list[index].powerup = true;
  }

  return list;
}

// Draws every brick in the list.
function drawBricks() {
  for (const brick of bricks) {
    const inset = 1;
    const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
    if (brick.powerup) {
      gradient.addColorStop(0, "#8bd8ff");
      gradient.addColorStop(0.18, "#168bff");
      gradient.addColorStop(1, "#0753b5");
      ctx.shadowColor = "rgb(22 139 255 / 65%)";
      ctx.shadowBlur = 10;
    } else {
      gradient.addColorStop(0, "#ff7474");
      gradient.addColorStop(0.18, "#d52a36");
      gradient.addColorStop(1, "#81111d");
      ctx.shadowColor = "rgb(0 0 0 / 55%)";
      ctx.shadowBlur = 5;
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(brick.x + inset, brick.y + inset, brick.width - inset * 2, brick.height - inset * 2);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = brick.powerup ? "#9ee4ff" : "#ff9999";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(brick.x + 3, brick.y + 2);
    ctx.lineTo(brick.x + brick.width - 3, brick.y + 2);
    ctx.stroke();

    if (brick.powerup) {
      ctx.fillStyle = "rgb(255 255 255 / 85%)";
      ctx.beginPath();
      ctx.arc(brick.x + brick.width / 2, brick.y + brick.height / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
