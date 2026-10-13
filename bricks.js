// ============================================================
// bricks.js: where the bricks are, and how they are drawn
// ============================================================

const BRICK_COLUMNS = 8;
const BRICK_ROWS = 4;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 6;     // empty space between bricks
const BRICKS_TOP = 50;   // how far down the first row starts

// Builds the list of bricks. Each brick is an object with an
// x, y, width, and height.
function makeBricks(level = 1) {
  if (level === 2) {
    return makeSwordBricks();
  }
  if (level === 3) {
    return makeBikeBricks();
  }

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

  return markOptionalPowerup(list);
}

function markOptionalPowerup(bricks, candidates = bricks) {
  const brick = candidates[Math.floor(Math.random() * candidates.length)];
  brick.powerup = true;
  brick.optional = true;
  return bricks;
}

function makeSwordBricks() {
  const tileWidth = 42;
  const tileHeight = 22;
  const gap = 2;
  const columns = 10;
  const rows = 10;
  const left = (WIDTH - columns * (tileWidth + gap) + gap) / 2;
  const tiles = [];
  const bladeRows = [
    [8],
    [7, 8],
    [6, 7, 8],
    [5, 6, 7],
    [4, 5, 6],
    [3, 4, 5]
  ];

  for (let row = 0; row < bladeRows.length; row++) {
    for (const col of bladeRows[row]) {
      tiles.push({ col, row, material: "diamond" });
    }
  }
  for (const col of [2, 3, 4, 5, 6]) {
    tiles.push({ col, row: 6, material: "guard" });
  }
  for (const row of [7, 8]) {
    for (const col of [3, 4]) {
      tiles.push({ col, row, material: "handle" });
    }
  }
  for (const col of [2, 3, 4]) {
    tiles.push({ col, row: 9, material: "pommel" });
  }

  const bricks = tiles.map(tile => {
    const brick = {
      x: left + tile.col * (tileWidth + gap),
      y: 42 + tile.row * (tileHeight + gap),
      width: tileWidth,
      height: tileHeight,
      material: tile.material
    };
    return brick;
  });
  return markOptionalPowerup(bricks, bricks.filter(brick => brick.material === "diamond"));
}

function makeBikeBricks() {
  const tileWidth = 27;
  const tileHeight = 18;
  const gap = 2;
  const columns = 20;
  const left = (WIDTH - columns * (tileWidth + gap) + gap) / 2;
  const top = 95;
  const tiles = new Map();
  const addTile = (col, row, part) => {
    const key = `${col},${row}`;
    if (!tiles.has(key) || tiles.get(key) !== "wheel") {
      tiles.set(key, part);
    }
  };
  const wheelShape = [
    [-1, -3], [0, -3], [1, -3], [-2, -2], [2, -2],
    [-3, -1], [3, -1], [-3, 0], [3, 0], [-3, 1], [3, 1],
    [-2, 2], [2, 2], [-1, 3], [0, 3], [1, 3]
  ];

  for (const [centerCol, centerRow] of [[3, 7], [16, 7]]) {
    for (const [colOffset, rowOffset] of wheelShape) {
      addTile(centerCol + colOffset, centerRow + rowOffset, "wheel");
    }
    addTile(centerCol, centerRow, "hub");
  }

  for (const [col, row] of [
    [4, 6], [5, 5], [6, 4], [7, 3], [8, 4], [9, 5], [10, 6], [10, 7],
    [9, 7], [8, 7], [7, 7], [6, 7], [5, 7], [4, 7],
    [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3],
    [12, 4], [11, 5], [14, 4], [15, 5], [16, 6],
    [7, 2], [7, 1], [5, 1], [6, 1], [13, 2], [14, 2], [15, 2]
  ]) {
    addTile(col, row, "frame");
  }
  for (const [col, row] of [[9, 4], [10, 4], [11, 4], [10, 5]]) {
    addTile(col, row, "body");
  }

  const bricks = [];
  for (const [position, part] of tiles) {
    const [col, row] = position.split(",").map(Number);
    bricks.push({
      x: left + col * (tileWidth + gap),
      y: top + row * (tileHeight + gap),
      width: tileWidth,
      height: tileHeight,
      part
    });
  }
  return markOptionalPowerup(bricks);
}

// Draws every brick in the list.
function drawBricks() {
  for (const brick of bricks) {
    if (brick.material) {
      drawSwordBrick(brick);
      continue;
    }

    if (currentLevel === 3) {
      drawBeachBrick(brick);
      continue;
    }

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

function drawBeachBrick(brick) {
  if (brick.part) {
    const colors = {
      wheel: ["#707677", "#30383a", "#151b1e"],
      hub: ["#fff2c2", "#f5bd62", "#9d573f"],
      frame: ["#ffd191", "#ef5d68", "#912f50"],
      body: ["#b5fff0", "#27a7a7", "#126b77"]
    }[brick.part];
    const [highlight, face, shade] = colors;
    ctx.fillStyle = shade;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    ctx.fillStyle = face;
    ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height - 4);
    ctx.fillStyle = highlight;
    ctx.fillRect(brick.x + 3, brick.y + 2, brick.width - 6, 3);
    if (brick.powerup) {
      ctx.fillStyle = "#fff7cf";
      ctx.fillRect(brick.x + brick.width / 2 - 2, brick.y + brick.height / 2 - 2, 4, 4);
    }
    return;
  }

  const colors = brick.y < 78
    ? ["#fff0b8", "#f29b66", "#c95c69"]
    : brick.y < 105 ? ["#ffe0a0", "#ed765f", "#b64c62"]
      : ["#9af0dc", "#38b5b6", "#167d91"];
  const [highlight, face, shade] = colors;
  ctx.fillStyle = shade;
  ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
  ctx.fillStyle = face;
  ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height - 4);
  ctx.fillStyle = highlight;
  ctx.fillRect(brick.x + 3, brick.y + 2, brick.width - 6, 3);
  if (brick.powerup) {
    ctx.fillStyle = "#fff7cf";
    ctx.beginPath();
    ctx.arc(brick.x + brick.width / 2, brick.y + brick.height / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSwordBrick(brick) {
  const palette = {
    diamond: brick.powerup
      ? ["#d9ffff", "#67e8ed", "#1592a8"]
      : ["#b7ffff", "#49cbd5", "#177f91"],
    guard: ["#fff1a5", "#d59a35", "#805021"],
    handle: ["#bb8153", "#70462f", "#3d2b29"],
    pommel: ["#e0ad69", "#94633e", "#533a30"]
  }[brick.material];
  const [highlight, face, shade] = palette;

  ctx.fillStyle = shade;
  ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
  ctx.fillStyle = face;
  ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height - 4);
  ctx.fillStyle = highlight;
  ctx.fillRect(brick.x + 3, brick.y + 2, brick.width - 9, 3);
  ctx.fillStyle = "rgb(255 255 255 / 22%)";
  ctx.fillRect(brick.x + 4, brick.y + 6, 3, brick.height - 10);
  if (brick.powerup) {
    ctx.fillStyle = "#f1ffff";
    ctx.fillRect(brick.x + brick.width - 11, brick.y + 5, 4, 4);
  }
}
