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
const scoreDisplay = document.getElementById("score-display");
const scoreValue = document.getElementById("score-value");
const flipIndicator = document.getElementById("flip-indicator");
const adminPanel = document.getElementById("admin-panel");
const adminLevelButtons = document.querySelectorAll(".admin-level-button");
const adminCoinButton = document.getElementById("admin-add-coins");
const levelMusic = document.getElementById("level-music");
const minecraftTrackInput = document.getElementById("minecraft-track");
const minecraftAudio = document.getElementById("minecraft-audio");
const comboDisplay = document.getElementById("combo-display");
const achievementCount = document.getElementById("achievement-count");
const achievementToast = document.getElementById("achievement-toast");
const titleScreen = document.getElementById("title-screen");
const gameMenuButton = document.getElementById("game-menu-button");
const menuCoinCount = document.getElementById("menu-coin-count");
const coinCount = document.getElementById("coin-count");
const menuPages = document.querySelectorAll(".menu-page");
const caseReveal = document.getElementById("case-reveal");
const caseRarity = document.getElementById("case-rarity");
const caseItemName = document.getElementById("case-item-name");
const caseRoundLabel = document.getElementById("case-round-label");
const caseReelViewport = document.getElementById("case-reel-viewport");
const caseReelTrack = document.getElementById("case-reel-track");
const caseCollectionLineup = document.getElementById("case-collection-lineup");
const caseCollectionCount = document.getElementById("case-collection-count");
const caseSoundButton = document.getElementById("case-sound-button");
const caseMessage = document.getElementById("case-message");
const openCaseButton = document.getElementById("open-case-button");
const caseRewardActions = document.getElementById("case-reward-actions");
const caseSellButton = document.getElementById("case-sell-button");
const caseKeepButton = document.getElementById("case-keep-button");
const paddleInventory = document.getElementById("paddle-inventory");
const ballInventory = document.getElementById("ball-inventory");
const trailInventory = document.getElementById("trail-inventory");
const equippedPaddleSkinName = document.getElementById("equipped-paddle-skin-name");
const equippedBallSkinName = document.getElementById("equipped-ball-skin-name");
const equippedTrailName = document.getElementById("equipped-trail-name");
const caseTypeButtons = document.querySelectorAll("[data-case-type]");

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
const STARTER_BALL_SPEED = 6;
const BALL_SIZE = 12;
const STARTING_RESERVES = 4;

let balls = [];
let reserveCount = STARTING_RESERVES;
let gameState = "menu";
let currentLevel = 1;
let score = 0;
let isUpsideDown = false;
let adminKeyBuffer = "";
let minecraftTrackUrl = null;
let particles = [];
let comboStreak = 0;
let levelStartedAt = null;
let levelStartReserveCount = STARTING_RESERVES;
let achievementToastUntil = 0;
let coins = 0;
let paddleDrops = [];
let ballDrops = [];
let trailDrops = [];
let caseIsOpening = false;
let pendingCaseDrop = null;
let caseSoundEnabled = true;
let caseAudioContext = null;
let caseRollFrame = null;
let caseNoiseBuffer = null;
let caseRollTickIndex = 0;
let equippedPaddleSkin = null;
let equippedBallSkin = null;
let equippedTrail = null;
let activeCaseType = "paddle";

const ACHIEVEMENTS = [
  { id: "speed-run", title: "Quick Finish" },
  { id: "hot-streak", title: "On Fire" },
  { id: "clean-sweep", title: "Clean Sweep" }
];
const ACHIEVEMENT_STORAGE_KEY = "block-breaker-achievements";
const ECONOMY_STORAGE_KEY = "block-breaker-economy";
const CASE_COST = 100;
const CASE_REEL_STOP_INDEX = 24;
let unlockedAchievements = new Set();
const PADDLE_CASE_TIERS = [
  { id: "grey", label: "GREY", weight: 60, items: ["Court Classic", "Rookie Stripe", "Concrete Fade", "Baseline", "Marble Court"] },
  { id: "blue", label: "BLUE", weight: 30, items: ["Fast Break", "Neon Cross", "Skyline Slam", "Heat Check", "Pixel Dunk"] },
  { id: "purple", label: "PURPLE", weight: 15, items: ["Night League", "Royal Rumble", "Violet Voltage", "Court Phantom", "Electric Crown"] },
  { id: "gold", label: "GOLD", weight: 3, items: ["Golden Legend", "Championship Glow", "Crown Jewel", "Galaxy Gold", "Ember Dynasty", "Starbound MVP"] }
];
const PADDLE_SKINS = {
  "Court Classic": { top: "#fff1e8", base: "#e43a43", edge: "#7c101c", glow: "#e43a43" },
  "Rookie Stripe": { top: "#e9f5ff", base: "#3688d9", edge: "#164873", glow: "#3688d9" },
  "Concrete Fade": { top: "#e3e8e8", base: "#788687", edge: "#313a3b", glow: "#aab6b6" },
  "Fast Break": { top: "#fff0bf", base: "#f37935", edge: "#923712", glow: "#f37935" },
  "Neon Cross": { top: "#e8ff7a", base: "#9dc920", edge: "#3f6013", glow: "#a9df22" },
  "Skyline Slam": { top: "#c8f5ff", base: "#25a9c4", edge: "#13526a", glow: "#25c3d9" },
  "Night League": { top: "#e9ddff", base: "#7152a9", edge: "#302345", glow: "#9b75db" },
  "Royal Rumble": { top: "#ffe89c", base: "#9f3d85", edge: "#461c57", glow: "#d175c1" },
  "Violet Voltage": { top: "#ffa9ef", base: "#973bd1", edge: "#45156b", glow: "#c65bec" },
  "Court Phantom": { top: "#d4f9ff", base: "#354d76", edge: "#17243e", glow: "#54d8ff", effect: "aurora", colors: ["#d4f9ff", "#54d8ff", "#354d76"] },
  "Electric Crown": { top: "#ffe2fb", base: "#7b39bd", edge: "#34165a", glow: "#ed5aff", effect: "prism", colors: ["#ffe2fb", "#ed5aff", "#5f37d2"] },
  "Golden Legend": { top: "#fff2ac", base: "#493072", edge: "#18132f", glow: "#ffd166", effect: "galaxy", sellValue: 2000, colors: ["#fff0a6", "#ffbd45", "#a448a0", "#3c286d", "#10152f", "#59dce2"] },
  "Championship Glow": { top: "#fff3b0", base: "#a53669", edge: "#351c58", glow: "#71edff", effect: "aurora", sellValue: 1250, colors: ["#fff4aa", "#ff8f58", "#ec4f9a", "#704bd0", "#39d5ca"] },
  "Crown Jewel": { top: "#fff6c5", base: "#b96528", edge: "#532248", glow: "#ffd166", effect: "prism", sellValue: 1500, colors: ["#fff1a8", "#e89934", "#db5684", "#7446a6", "#4bd0bd"] },
  "Galaxy Gold": { top: "#fff1a6", base: "#422568", edge: "#11132e", glow: "#ffd166", effect: "galaxy", sellValue: 1800, colors: ["#fff2a8", "#ffb63e", "#f05b9c", "#7146bd", "#151a42", "#54e4e2"] },
  "Ember Dynasty": { top: "#fff0bf", base: "#bd482f", edge: "#542044", glow: "#ffac45", effect: "aurora", sellValue: 500, colors: ["#fff0bf", "#ffc247", "#f05b52", "#762c77"] },
  "Starbound MVP": { top: "#fff8d5", base: "#225b89", edge: "#172447", glow: "#63efff", effect: "galaxy", sellValue: 1000, colors: ["#fff8d5", "#ffd166", "#ff69ad", "#553db2", "#225b89", "#63efff"] },
  "Baseline": { top: "#fbf3de", base: "#718b88", edge: "#324a4c", glow: "#bde4d6", colors: ["#fbf3de", "#bde4d6", "#718b88"] },
  "Marble Court": { top: "#f5f8ff", base: "#63849e", edge: "#26394e", glow: "#9ce5ed", colors: ["#f5f8ff", "#9ce5ed", "#63849e"] },
  "Heat Check": { top: "#fff0bb", base: "#ed4b38", edge: "#711e35", glow: "#ff9a43", colors: ["#fff0bb", "#ff9a43", "#ed4b38"] },
  "Pixel Dunk": { top: "#e0f8ff", base: "#3669d8", edge: "#202d7a", glow: "#76eaff", effect: "prism", colors: ["#e0f8ff", "#76eaff", "#4775ff", "#a04bda"] }
};
const BALL_CASE_TIERS = [
  { id: "grey", label: "GREY", weight: 60, items: ["Street Orange", "Cloud Break", "Concrete Spin", "Sunset Bounce", "Ice Breaker"] },
  { id: "blue", label: "BLUE", weight: 30, items: ["Blue Orbit", "Neon Bounce", "Tidal Flight", "Comet Drive", "Volt Runner"] },
  { id: "purple", label: "PURPLE", weight: 15, items: ["Night Circuit", "Royal Spin", "Violet Arc", "Deep Space", "Eclipse Core"] },
  { id: "gold", label: "GOLD", weight: 3, items: ["Solar Crown", "Golden Flight", "Prism Dunk", "Galaxy Gold", "Nova Monarch", "Celestial Slam"] }
];
const BALL_SKINS = {
  "Street Orange": { top: "#ffd28a", base: "#e98232", edge: "#873715", seam: "#542312", glow: "#e98232" },
  "Cloud Break": { top: "#ffffff", base: "#b6cbd8", edge: "#547180", seam: "#304856", glow: "#b6cbd8" },
  "Concrete Spin": { top: "#d9e0de", base: "#82918d", edge: "#3b4946", seam: "#27322f", glow: "#9eaaa6" },
  "Blue Orbit": { top: "#b8edff", base: "#287fd1", edge: "#103d81", seam: "#092b55", glow: "#45b5ff" },
  "Neon Bounce": { top: "#edff8a", base: "#8cbd2c", edge: "#3c6716", seam: "#26430e", glow: "#b8ef4b" },
  "Tidal Flight": { top: "#a8fff0", base: "#21a9a5", edge: "#155064", seam: "#103c50", glow: "#45dfd2" },
  "Night Circuit": { top: "#d8caff", base: "#7056a9", edge: "#302449", seam: "#211a35", glow: "#a07fe0" },
  "Royal Spin": { top: "#ffdcaa", base: "#a84b8c", edge: "#4c275f", seam: "#311b40", glow: "#d981bd" },
  "Violet Arc": { top: "#ffc4ef", base: "#a23bd1", edge: "#45156b", seam: "#32104c", glow: "#d365f0" },
  "Deep Space": { top: "#d9d8ff", base: "#443e9b", edge: "#201a54", seam: "#17123b", glow: "#8d82ff", effect: "galaxy", colors: ["#d9d8ff", "#8d82ff", "#443e9b"] },
  "Eclipse Core": { top: "#ffdcf6", base: "#9a376f", edge: "#4d1b4c", seam: "#36143a", glow: "#ff6fd3", effect: "prism", colors: ["#ffdcf6", "#ff6fd3", "#793dc4"] },
  "Solar Crown": { top: "#fff0a6", base: "#6b347c", edge: "#21143d", seam: "#21143d", glow: "#ffd166", effect: "galaxy", sellValue: 2000, colors: ["#fff4ac", "#ffb63e", "#e7549a", "#7047c0", "#101935", "#62e4df"] },
  "Golden Flight": { top: "#fff3b8", base: "#bd5429", edge: "#48204b", seam: "#32183d", glow: "#ffdc55", effect: "aurora", sellValue: 1250, colors: ["#fff4b3", "#ff9e44", "#ef527e", "#7855d7", "#43d8c9"] },
  "Prism Dunk": { top: "#baffdf", base: "#31a889", edge: "#14535b", seam: "#103746", glow: "#5ee1b5", effect: "prism", sellValue: 1500, colors: ["#fff2aa", "#ff9b56", "#e84f9e", "#7455d7", "#45dfca"] },
  "Galaxy Gold": { top: "#fff1a6", base: "#593478", edge: "#171631", seam: "#100e28", glow: "#ffd166", effect: "galaxy", sellValue: 1800, colors: ["#fff2a8", "#ffb63e", "#f05b9c", "#7146bd", "#151a42", "#54e4e2"] },
  "Nova Monarch": { top: "#fff6c8", base: "#753fae", edge: "#31194d", seam: "#201239", glow: "#f9c954", effect: "galaxy", sellValue: 500, colors: ["#fff6c8", "#f9c954", "#e75cb4", "#753fae", "#48d9e0"] },
  "Celestial Slam": { top: "#fff3c5", base: "#176e78", edge: "#123a54", seam: "#102a41", glow: "#75f1d5", effect: "aurora", sellValue: 1000, colors: ["#fff3c5", "#f6bd55", "#ed6a84", "#6a54c8", "#176e78"] },
  "Sunset Bounce": { top: "#fff0d0", base: "#dc6544", edge: "#733746", seam: "#52273b", glow: "#ffad61", colors: ["#fff0d0", "#ffad61", "#dc6544"] },
  "Ice Breaker": { top: "#f5ffff", base: "#6fb9c8", edge: "#315f7a", seam: "#24455f", glow: "#b0f8ff", colors: ["#f5ffff", "#b0f8ff", "#6fb9c8"] },
  "Comet Drive": { top: "#e5fbff", base: "#277cc6", edge: "#193e87", seam: "#122a60", glow: "#62dfff", effect: "aurora", colors: ["#e5fbff", "#62dfff", "#277cc6"] },
  "Volt Runner": { top: "#f4ffc2", base: "#6caa32", edge: "#36571d", seam: "#294319", glow: "#baff54", effect: "prism", colors: ["#f4ffc2", "#baff54", "#35c6a1"] }
};
const TRAIL_CASE_TIERS = [
  { id: "grey", label: "GREY", weight: 60, items: ["Comet Dust", "Afterimage", "Stardust", "Dust Devil", "Carbon Echo"] },
  { id: "blue", label: "BLUE", weight: 30, items: ["Neon Circuit", "Tidal Wake", "Blue Streak", "Pulse Runner", "Glacier Arc"] },
  { id: "purple", label: "PURPLE", weight: 15, items: ["Nebula Wake", "Witchlight", "Violet Spiral", "Phantom Loop", "Laser Bloom"] },
  { id: "gold", label: "GOLD", weight: 3, items: ["Galaxy Gold Trail", "Solar Flare", "Prismatic Comet", "Aurora Burst", "King's Ransom Trail"] }
];
const BALL_TRAILS = {
  "Comet Dust": { top: "#fff1c0", base: "#e98232", glow: "#ffb253", colors: ["#fff1c0", "#ffb253", "#e98232"], shape: "spark" },
  "Afterimage": { top: "#e4e7e7", base: "#77888c", glow: "#bdc7c9", colors: ["#f5f7f7", "#bdc7c9", "#77888c"], shape: "ring" },
  "Stardust": { top: "#fff5d1", base: "#b8a888", glow: "#fff0bd", colors: ["#fff5d1", "#decba4", "#b8a888"], shape: "star" },
  "Neon Circuit": { top: "#a8fff4", base: "#26b5dc", glow: "#57e9ff", colors: ["#f6ff91", "#57e9ff", "#2683ff"], shape: "square" },
  "Tidal Wake": { top: "#c0fff1", base: "#27c6bd", glow: "#65ffe3", colors: ["#d8fff2", "#65ffe3", "#1997c8"], shape: "ring" },
  "Blue Streak": { top: "#d5f8ff", base: "#2f76ff", glow: "#70baff", colors: ["#e5fbff", "#70baff", "#694eff"], shape: "spark" },
  "Nebula Wake": { top: "#ffc5fa", base: "#a749ee", glow: "#dc72ff", colors: ["#ffd3f8", "#dc72ff", "#725bff"], shape: "galaxy" },
  "Witchlight": { top: "#e8d1ff", base: "#8651ca", glow: "#c69bff", colors: ["#f0d8ff", "#c69bff", "#7458ed"], shape: "spark" },
  "Violet Spiral": { top: "#ffc5ef", base: "#b842d6", glow: "#f17de7", colors: ["#ffe1f6", "#f17de7", "#734fff"], shape: "ring" },
  "Phantom Loop": { top: "#dbd6ff", base: "#5b4cc3", glow: "#a99cff", colors: ["#dbd6ff", "#a99cff", "#5b4cc3"], shape: "galaxy" },
  "Laser Bloom": { top: "#ffd7f7", base: "#bd3d9b", glow: "#ff68d8", colors: ["#fff0f9", "#ff68d8", "#8a50ef"], shape: "ring" },
  "Galaxy Gold Trail": { top: "#fff0a6", base: "#704bd5", glow: "#ffd166", sellValue: 2000, colors: ["#fff1a6", "#ffd166", "#ff67ba", "#8a5cff", "#54e4e2"], shape: "galaxy" },
  "Solar Flare": { top: "#fff3b3", base: "#f36e35", glow: "#ffe27a", sellValue: 1250, colors: ["#fff8c2", "#ffe27a", "#ff8a3d", "#f04c68"], shape: "spark" },
  "Prismatic Comet": { top: "#fff0b0", base: "#e64f9f", glow: "#ffd166", sellValue: 1500, colors: ["#fff0b0", "#68f0df", "#7f6aff", "#f45cc5"], shape: "ring" },
  "Aurora Burst": { top: "#e4fff5", base: "#348a8e", glow: "#a4ffcf", sellValue: 500, colors: ["#fff2bd", "#8dffd5", "#48b9c2", "#7657d9"], shape: "spark" },
  "King's Ransom Trail": { top: "#fff4c5", base: "#a66b21", glow: "#ffd166", sellValue: 1000, colors: ["#fff4c5", "#ffd166", "#ec8f3f", "#bb4d8d"], shape: "star" },
  "Dust Devil": { top: "#ffe0bd", base: "#a6744d", glow: "#e5b181", colors: ["#fff0de", "#e5b181", "#a6744d"], shape: "spark" },
  "Carbon Echo": { top: "#f0f4f3", base: "#586c70", glow: "#b1d6d5", colors: ["#f0f4f3", "#b1d6d5", "#586c70"], shape: "ring" },
  "Pulse Runner": { top: "#d8fff5", base: "#20a9bb", glow: "#69f5e6", colors: ["#e7ffcf", "#69f5e6", "#2785e0"], shape: "square" },
  "Glacier Arc": { top: "#f3ffff", base: "#469bc1", glow: "#adf5ff", colors: ["#f3ffff", "#adf5ff", "#469bc1"], shape: "ring" }
};

function caseTiers(type) {
  if (type === "ball") return BALL_CASE_TIERS;
  if (type === "trail") return TRAIL_CASE_TIERS;
  return PADDLE_CASE_TIERS;
}

function skinPalette(type) {
  if (type === "ball") return BALL_SKINS;
  if (type === "trail") return BALL_TRAILS;
  return PADDLE_SKINS;
}

function caseSellValue(drop) {
  if (drop.tier === "grey") return 30;
  if (drop.tier === "blue") return 80;
  if (drop.tier === "purple") return 180;
  return skinPalette(drop.type)[drop.name].sellValue;
}

function ownedDrops(type) {
  if (type === "ball") return ballDrops;
  if (type === "trail") return trailDrops;
  return paddleDrops;
}

function setOwnedDrops(type, drops) {
  if (type === "ball") {
    ballDrops = drops;
  } else if (type === "trail") {
    trailDrops = drops;
  } else {
    paddleDrops = drops;
  }
}

function equippedSkin(type) {
  if (type === "ball") return equippedBallSkin;
  if (type === "trail") return equippedTrail;
  return equippedPaddleSkin;
}

function setEquippedSkin(type, skinName) {
  if (type === "ball") {
    equippedBallSkin = skinName;
  } else if (type === "trail") {
    equippedTrail = skinName;
  } else {
    equippedPaddleSkin = skinName;
  }
}

function updateAchievementList() {
  document.querySelectorAll("[data-achievement-status]").forEach(status => {
    const isUnlocked = unlockedAchievements.has(status.dataset.achievementStatus);
    status.textContent = isUnlocked ? "UNLOCKED" : "LOCKED";
    status.classList.toggle("unlocked", isUnlocked);
  });
  achievementCount.textContent = `${unlockedAchievements.size}/${ACHIEVEMENTS.length}`;
}

function saveAchievements() {
  try {
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify([...unlockedAchievements]));
  } catch {
    // Achievements still work for the current session when storage is unavailable.
  }
}

function unlockAchievement(id) {
  const achievement = ACHIEVEMENTS.find(item => item.id === id);
  if (!achievement || unlockedAchievements.has(id)) {
    return;
  }

  unlockedAchievements.add(id);
  saveAchievements();
  updateAchievementList();
  achievementToast.textContent = `ACHIEVEMENT UNLOCKED: ${achievement.title}`;
  achievementToast.hidden = false;
  achievementToastUntil = performance.now() + 2600;
}

function loadAchievements() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACHIEVEMENT_STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) {
      unlockedAchievements = new Set(saved.filter(id => ACHIEVEMENTS.some(item => item.id === id)));
    }
  } catch {
    unlockedAchievements = new Set();
  }
  updateAchievementList();
}

function updateCoinDisplay() {
  menuCoinCount.textContent = coins.toLocaleString();
  coinCount.textContent = coins.toLocaleString();
}

function addCoins(amount) {
  coins += amount;
  updateCoinDisplay();
  saveEconomy();
}

function saveEconomy() {
  try {
    localStorage.setItem(ECONOMY_STORAGE_KEY, JSON.stringify({
      coins,
      paddleDrops,
      ballDrops,
      trailDrops,
      equippedPaddleSkin,
      equippedBallSkin,
      equippedTrail
    }));
  } catch {
    caseMessage.textContent = "Save unavailable in this browser session.";
  }
}

function loadEconomy() {
  try {
    const saved = JSON.parse(localStorage.getItem(ECONOMY_STORAGE_KEY) || "{}");
    coins = Number.isSafeInteger(saved.coins) && saved.coins >= 0 ? saved.coins : 0;
    const validDrops = (drops, tiers) => Array.isArray(drops)
      ? drops.filter(drop => drop && tiers.some(tier => tier.id === drop.tier && tier.items.includes(drop.name)))
      : [];
    paddleDrops = validDrops(saved.paddleDrops || saved.caseDrops, PADDLE_CASE_TIERS);
    ballDrops = validDrops(saved.ballDrops, BALL_CASE_TIERS);
    trailDrops = validDrops(saved.trailDrops, TRAIL_CASE_TIERS);
    const oldEquippedSkin = saved.equippedPaddleSkin || saved.equippedSkin;
    equippedPaddleSkin = typeof oldEquippedSkin === "string" && paddleDrops.some(drop => drop.name === oldEquippedSkin)
      ? oldEquippedSkin
      : null;
    equippedBallSkin = typeof saved.equippedBallSkin === "string" && ballDrops.some(drop => drop.name === saved.equippedBallSkin)
      ? saved.equippedBallSkin
      : null;
    equippedTrail = typeof saved.equippedTrail === "string" && trailDrops.some(drop => drop.name === saved.equippedTrail)
      ? saved.equippedTrail
      : null;
  } catch {
    coins = 0;
    paddleDrops = [];
    ballDrops = [];
    trailDrops = [];
    equippedPaddleSkin = null;
    equippedBallSkin = null;
    equippedTrail = null;
  }
  updateCoinDisplay();
  renderSkinInventory("paddle");
  renderSkinInventory("ball");
  renderSkinInventory("trail");
}

function saveProgress() {
  saveAchievements();
  saveEconomy();
}

window.addEventListener("pagehide", saveProgress);
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "hidden") {
    saveProgress();
  }
});

function renderSkinInventory(type) {
  const inventory = type === "ball" ? ballInventory : type === "trail" ? trailInventory : paddleInventory;
  const equippedName = type === "ball" ? equippedBallSkinName : type === "trail" ? equippedTrailName : equippedPaddleSkinName;
  const drops = ownedDrops(type);
  const skins = skinPalette(type);
  inventory.replaceChildren();
  equippedName.textContent = equippedSkin(type) || "NONE";
  const ownedSkins = [...new Map(drops.map(drop => [drop.name, drop])).values()];
  if (ownedSkins.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "inventory-empty";
    emptyMessage.textContent = `No ${type} skins yet. Open a ${type} case to collect one.`;
    inventory.append(emptyMessage);
    return;
  }

  for (const drop of ownedSkins) {
    const skin = skins[drop.name];
    const isEquipped = equippedSkin(type) === drop.name;
    const item = document.createElement("li");
    item.className = `inventory-item rarity-${drop.tier}`;
    const swatch = document.createElement("span");
    swatch.className = type === "ball"
      ? "inventory-swatch ball-swatch"
      : type === "trail" ? "inventory-swatch trail-swatch" : "inventory-swatch";
    swatch.setAttribute("aria-hidden", "true");
    swatch.style.setProperty("--skin-top", skin.top);
    swatch.style.setProperty("--skin-base", skin.base);
    if (skin.colors) {
      swatch.style.setProperty("--skin-colors", skin.colors.join(", "));
      swatch.style.setProperty("--trail-colors", skin.colors.join(", "));
    }
    const rarity = document.createElement("span");
    rarity.textContent = drop.tier.toUpperCase();
    const name = document.createElement("strong");
    name.textContent = drop.name;
    const details = document.createElement("div");
    details.className = "inventory-item-details";
    details.append(name, rarity);
    const equipButton = document.createElement("button");
    equipButton.className = "inventory-equip-button";
    equipButton.type = "button";
    equipButton.textContent = isEquipped ? "EQUIPPED" : "EQUIP";
    equipButton.disabled = isEquipped;
    equipButton.setAttribute("aria-pressed", String(isEquipped));
    equipButton.addEventListener("click", function () {
      setEquippedSkin(type, drop.name);
      saveEconomy();
      renderSkinInventory(type);
    });
    item.append(swatch, details, equipButton);
    inventory.append(item);
  }
}

function chooseCaseTier(tiers) {
  let roll = Math.random() * tiers.reduce((total, tier) => total + tier.weight, 0);
  for (const tier of tiers) {
    roll -= tier.weight;
    if (roll < 0) {
      return tier;
    }
  }
  return tiers[0];
}

function createCaseReelCard(type, name, tierId) {
  const palette = skinPalette(type)[name];
  const card = document.createElement("div");
  card.className = `case-reel-card rarity-${tierId}`;
  card.dataset.caseType = type;

  const art = document.createElement("div");
  art.className = "case-reel-card-art";
  art.style.setProperty("--item-top", palette.top);
  art.style.setProperty("--item-base", palette.base);
  art.style.setProperty("--item-glow", palette.glow);
  if (palette.colors) {
    art.style.setProperty("--item-finish", `linear-gradient(110deg, ${palette.colors.join(", ")})`);
  }
  if (palette.effect) art.dataset.effect = palette.effect;

  const label = document.createElement("div");
  label.className = "case-reel-card-label";
  const rarity = document.createElement("span");
  rarity.textContent = tierId.toUpperCase();
  const itemName = document.createElement("strong");
  itemName.textContent = name;
  label.append(rarity, itemName);
  card.append(art, label);
  return card;
}

function renderCaseCollectionLineup(type) {
  const tiers = caseTiers(type);
  const cards = tiers.flatMap(tier => tier.items.map(name => {
    const card = createCaseReelCard(type, name, tier.id);
    card.classList.add("case-lineup-card");
    card.setAttribute("role", "listitem");
    return card;
  }));
  caseCollectionLineup.replaceChildren(...cards);
  caseCollectionCount.textContent = `${cards.length} ITEMS`;
}

function fillCaseReel(type, tiers, rewardTier, rewardName) {
  const reelCards = [];
  for (let index = 0; index <= CASE_REEL_STOP_INDEX + 3; index++) {
    if (index === CASE_REEL_STOP_INDEX) {
      const winningCard = createCaseReelCard(type, rewardName, rewardTier.id);
      winningCard.classList.add("is-winner");
      reelCards.push(winningCard);
      continue;
    }

    const tier = chooseCaseTier(tiers);
    const name = tier.items[Math.floor(Math.random() * tier.items.length)];
    reelCards.push(createCaseReelCard(type, name, tier.id));
  }
  caseReelTrack.replaceChildren(...reelCards);
  return reelCards[CASE_REEL_STOP_INDEX];
}

function getCaseAudioContext() {
  if (!caseSoundEnabled) return null;
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;
  if (!caseAudioContext) caseAudioContext = new AudioContextConstructor();
  if (caseAudioContext.state === "suspended") caseAudioContext.resume().catch(() => {});
  return caseAudioContext;
}

function playCaseTick(progress) {
  const audioContext = getCaseAudioContext();
  if (!audioContext) return;

  const startTime = audioContext.currentTime;
  if (!caseNoiseBuffer) {
    caseNoiseBuffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * 0.04), audioContext.sampleRate);
    const noiseData = caseNoiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index++) {
      noiseData[index] = Math.random() * 2 - 1;
    }
  }

  const noise = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const pitchVariation = (Math.random() - 0.5) * 150;
  noise.buffer = caseNoiseBuffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2300 - progress * 720, startTime);
  filter.Q.setValueAtTime(caseRollTickIndex % 2 === 0 ? 1.1 : 0.72, startTime);
  noiseGain.gain.setValueAtTime(0.0001, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.085, startTime + 0.002);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.032);
  oscillator.type = caseRollTickIndex % 2 === 0 ? "triangle" : "sine";
  oscillator.frequency.setValueAtTime(1540 - progress * 620 + pitchVariation, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(560 - progress * 140, startTime + 0.026);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.04, startTime + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audioContext.destination);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  noise.start(startTime);
  noise.stop(startTime + 0.04);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.037);
  caseRollTickIndex++;
}

function playCaseOpenSound() {
  const audioContext = getCaseAudioContext();
  if (!audioContext) return;

  const startTime = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(132, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(48, startTime + 0.13);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.11, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.17);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.18);
}

function startCaseRollSound() {
  window.cancelAnimationFrame(caseRollFrame);
  if (!caseSoundEnabled || !getCaseAudioContext()) return;
  caseRollTickIndex = 0;
  const markerCenter = caseReelViewport.clientWidth / 2;
  const cards = [...caseReelTrack.children];
  let lastCardIndex = cards.reduce((index, card, cardIndex) => (
    card.offsetLeft + card.offsetWidth / 2 <= markerCenter ? cardIndex : index
  ), -1);
  const firstCardIndex = Math.max(lastCardIndex, 0);

  const onReelFrame = () => {
    if (!caseIsOpening || !caseSoundEnabled) return;
    const transform = window.getComputedStyle(caseReelTrack).transform;
    const offset = transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m41;
    const markerPosition = markerCenter - offset;
    while (lastCardIndex + 1 < cards.length) {
      const nextCard = cards[lastCardIndex + 1];
      if (nextCard.offsetLeft + nextCard.offsetWidth / 2 > markerPosition) break;
      lastCardIndex++;
      const progress = Math.min((lastCardIndex - firstCardIndex) / (CASE_REEL_STOP_INDEX - firstCardIndex), 1);
      playCaseTick(progress);
    }
    caseRollFrame = window.requestAnimationFrame(onReelFrame);
  };

  caseRollFrame = window.requestAnimationFrame(onReelFrame);
}

function stopCaseRollSound() {
  window.cancelAnimationFrame(caseRollFrame);
  caseRollFrame = null;
}

function playCaseResultSound(tierId) {
  const audioContext = getCaseAudioContext();
  if (!audioContext) return;
  const startTime = audioContext.currentTime;
  const notes = tierId === "gold" ? [660, 880, 1320] : tierId === "purple" ? [520, 780] : [440, 660];
  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const noteStart = startTime + index * 0.09;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.06, noteStart + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.26);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.27);
  });
}

function openCase() {
  if (caseIsOpening) {
    return;
  }
  if (coins < CASE_COST) {
    caseMessage.textContent = `You need ${CASE_COST - coins} more coins to open a case.`;
    return;
  }

  const type = activeCaseType;
  caseReveal.dataset.caseType = type;
  const tiers = caseTiers(type);
  const rewardTier = chooseCaseTier(tiers);
  const rewardName = rewardTier.items[Math.floor(Math.random() * rewardTier.items.length)];
  coins -= CASE_COST;
  saveEconomy();
  updateCoinDisplay();
  caseIsOpening = true;
  openCaseButton.disabled = true;
  caseTypeButtons.forEach(button => { button.disabled = true; });
  caseRewardActions.hidden = true;
  caseMessage.textContent = "The case is opening...";
  caseReveal.classList.remove("has-awarded");
  caseReelTrack.style.transition = "none";
  caseReelTrack.style.transform = "translateX(0px)";
  const winningCard = fillCaseReel(type, tiers, rewardTier, rewardName);
  caseReveal.dataset.tier = "grey";
  caseReveal.classList.add("is-spinning");
  playCaseOpenSound();
  pendingCaseDrop = { type, tier: rewardTier.id, name: rewardName };

  let fallbackTimer;
  let openingFinished = false;
  const finishOpening = () => {
    if (openingFinished) return;
    openingFinished = true;
    window.clearTimeout(fallbackTimer);
    stopCaseRollSound();
    playCaseResultSound(rewardTier.id);
    caseReelTrack.removeEventListener("transitionend", onReelStop);
    caseReveal.classList.remove("is-spinning");
    caseReveal.classList.add("has-awarded");
    caseReveal.dataset.tier = rewardTier.id;
    caseRarity.textContent = rewardTier.label;
    caseItemName.textContent = rewardName;
    caseSellButton.textContent = `SELL FOR ${caseSellValue(pendingCaseDrop).toLocaleString()} COINS`;
    caseRewardActions.hidden = false;
    caseMessage.textContent = "CHOOSE TO SELL OR KEEP YOUR DROP";
    caseIsOpening = false;
    openCaseButton.disabled = false;
    caseTypeButtons.forEach(button => { button.disabled = false; });
  };
  const onReelStop = event => {
    if (event.propertyName === "transform") finishOpening();
  };

  caseReelTrack.addEventListener("transitionend", onReelStop);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reelStartDelay = reducedMotion ? 0 : 1550;
  fallbackTimer = window.setTimeout(finishOpening, reducedMotion ? 100 : 7400);
  window.setTimeout(() => {
    if (!caseIsOpening) return;
    startCaseRollSound();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const markerCenter = caseReelViewport.clientWidth / 2;
      const winningCardCenter = winningCard.offsetLeft + winningCard.offsetWidth / 2;
      caseReelTrack.style.transition = "";
      caseReelTrack.style.transform = `translateX(${markerCenter - winningCardCenter}px)`;
    }));
  }, reelStartDelay);
}

function showMenuPage(pageId) {
  menuPages.forEach(page => {
    page.hidden = page.id !== pageId;
  });
  if (pageId !== "cases-page") {
    caseCollectionLineup.scrollLeft = 0;
  }
}

document.getElementById("play-button").addEventListener("click", function () {
  resetGame();
  titleScreen.hidden = true;
  gameMenuButton.hidden = false;
});

document.getElementById("achievements-button").addEventListener("click", function () {
  showMenuPage("achievements-page");
});

document.getElementById("cases-button").addEventListener("click", function () {
  caseCollectionLineup.scrollLeft = 0;
  caseMessage.textContent = "Earn 5 coins for every brick you break.";
  showMenuPage("cases-page");
});

function resolveCaseReward(keepDrop) {
  if (!pendingCaseDrop) return;
  const drop = pendingCaseDrop;
  pendingCaseDrop = null;
  if (keepDrop) {
    setOwnedDrops(drop.type, [{ tier: drop.tier, name: drop.name }, ...ownedDrops(drop.type)]);
    saveEconomy();
    renderSkinInventory(drop.type);
    caseMessage.textContent = `${drop.name.toUpperCase()} ADDED TO YOUR COLLECTION`;
  } else {
    const sellValue = caseSellValue(drop);
    addCoins(sellValue);
    caseMessage.textContent = `${drop.name.toUpperCase()} SOLD FOR ${sellValue.toLocaleString()} COINS`;
  }
  caseRewardActions.hidden = true;
  caseReveal.classList.remove("has-awarded", "is-spinning");
}

caseSellButton.addEventListener("click", () => resolveCaseReward(false));
caseKeepButton.addEventListener("click", () => resolveCaseReward(true));

function returnToMenu() {
  gameState = "menu";
  gameOverlay.hidden = true;
  gameMenuButton.hidden = true;
  titleScreen.hidden = false;
  minecraftAudio.pause();
  showMenuPage("home-page");
}

gameMenuButton.addEventListener("click", returnToMenu);

caseTypeButtons.forEach(button => {
  button.addEventListener("click", function () {
    if (caseIsOpening) {
      return;
    }
    activeCaseType = button.dataset.caseType;
    caseReveal.dataset.caseType = activeCaseType;
    renderCaseCollectionLineup(activeCaseType);
    caseTypeButtons.forEach(caseButton => {
      const isActive = caseButton === button;
      caseButton.classList.toggle("is-active", isActive);
      caseButton.setAttribute("aria-pressed", String(isActive));
    });
    caseReveal.dataset.tier = "grey";
    caseReveal.classList.remove("has-awarded", "is-spinning");
    caseRoundLabel.textContent = `COLLECTION: ${activeCaseType.toUpperCase()}`;
    caseReelTrack.replaceChildren();
    caseReelTrack.style.transition = "none";
    caseReelTrack.style.transform = "translateX(0px)";
    caseRarity.textContent = "READY";
    caseItemName.textContent = activeCaseType === "trail" ? "BALL TRAIL CASE" : `${activeCaseType.toUpperCase()} SKIN CASE`;
    caseMessage.textContent = "Earn 5 coins for every brick you break.";
  });
});

renderCaseCollectionLineup(activeCaseType);

document.getElementById("inventory-button").addEventListener("click", function () {
  showMenuPage("inventory-page");
});

document.querySelectorAll(".menu-back-button").forEach(button => {
  button.addEventListener("click", function () {
    showMenuPage("home-page");
  });
});

openCaseButton.addEventListener("click", openCase);
caseSoundButton.addEventListener("click", function () {
  caseSoundEnabled = !caseSoundEnabled;
  caseSoundButton.setAttribute("aria-pressed", String(caseSoundEnabled));
  caseSoundButton.textContent = caseSoundEnabled ? "SOUND ON" : "SOUND OFF";
  if (!caseSoundEnabled) stopCaseRollSound();
});

document.getElementById("menu-button").addEventListener("click", function () {
  returnToMenu();
});

function makeBall(x, y, vx, vy, isStarter = false) {
  return { x, y, width: BALL_SIZE, height: BALL_SIZE, vx, vy, isStarter, trail: [] };
}

function makeStarterBall() {
  return makeBall(
    paddle.x + paddle.width / 2 - BALL_SIZE / 2,
    paddle.y - BALL_SIZE,
    0,
    0,
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
  speed: 7,
  movement: 0
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

function trackAdminSequence(key) {
  const candidate = adminKeyBuffer + key;
  if (candidate.endsWith("admin")) {
    adminKeyBuffer = "";
    toggleAdminPanel();
    return true;
  }

  adminKeyBuffer = ["admi", "adm", "ad", "a"].find(prefix => candidate.endsWith(prefix)) || "";
  return adminKeyBuffer.length > 0;
}

function toggleAdminPanel() {
  adminPanel.hidden = !adminPanel.hidden;
  document.body.classList.toggle("admin-open", !adminPanel.hidden);
}

function adminTeleportToLevel(level) {
  if (!Number.isInteger(level) || level < 1 || level > 3) {
    return;
  }

  currentLevel = level;
  reserveCount = STARTING_RESERVES;
  updateLevelTheme();
  resetLevelBoard();
}

adminLevelButtons.forEach(button => {
  button.addEventListener("click", function () {
    adminTeleportToLevel(Number(button.dataset.adminLevel));
  });
});

adminCoinButton.addEventListener("click", function () {
  addCoins(1000);
});

document.addEventListener("keydown", function (event) {
  const key = event.key.toLowerCase();
  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat && gameState === "playing") {
      const starterBall = balls.find(ball => ball.isStarter && ball.vx === 0 && ball.vy === 0);
      if (starterBall) {
        if (levelStartedAt === null) {
          levelStartedAt = performance.now();
        }
        const launchDirection = Math.sign(paddle.movement) || (Math.random() < 0.5 ? -1 : 1);
        if (paddle.movement === 0) {
          starterBall.vx = launchDirection * STARTER_BALL_SPEED * 0.5;
          starterBall.vy = -Math.sqrt(STARTER_BALL_SPEED ** 2 - starterBall.vx ** 2);
        } else {
          starterBall.vx = launchDirection * STARTER_BALL_SPEED * Math.SQRT1_2;
          starterBall.vy = -STARTER_BALL_SPEED * Math.SQRT1_2;
        }
      }
    }
  }

  const enteringAdminSequence = key.length === 1 && trackAdminSequence(key);
  keys[key] = !(enteringAdminSequence && (key === "a" || key === "d"));
  // Stop the arrow keys from scrolling the page.
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
});

document.addEventListener("keyup", function (event) {
  keys[event.key.toLowerCase()] = false;
});

window.addEventListener("blur", function () {
  adminKeyBuffer = "";
  for (const key of Object.keys(keys)) {
    keys[key] = false;
  }
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
  updateParticles();
  if (achievementToastUntil && performance.now() >= achievementToastUntil) {
    achievementToast.hidden = true;
    achievementToastUntil = 0;
  }

  if (gameState !== "playing") {
    return;
  }

  movePaddle();

  for (let index = balls.length - 1; index >= 0; index--) {
    const activeBall = balls[index];
    if (activeBall.isStarter && activeBall.vx === 0 && activeBall.vy === 0) {
      activeBall.x = paddle.x + paddle.width / 2 - activeBall.width / 2;
      activeBall.y = paddle.y - activeBall.height;
      continue;
    }

    moveBall(activeBall);

    bounceOffWalls(activeBall);   // collisions.js
    bounceOffPaddle(activeBall);  // collisions.js
    const hitBrick = bounceOffBricks(activeBall);  // collisions.js

    if (hitBrick) {
      comboStreak++;
      const multiplier = Math.min(5, 1 + Math.floor((comboStreak - 1) / 3));
      score += 100 * multiplier;
      addCoins(5);
      updateScore();
      updateComboDisplay(multiplier);
      spawnBrickBurst(hitBrick);
      if (multiplier === 5) {
        unlockAchievement("hot-streak");
      }
      if (hitBrick.powerup === "invert") {
        isUpsideDown = true;
        flipIndicator.hidden = false;
      } else if (hitBrick.powerup === "multiball") {
        balls.push(makeBall(
          hitBrick.x + hitBrick.width / 2 - BALL_SIZE / 2,
          hitBrick.y + hitBrick.height / 2 - BALL_SIZE / 2,
          -BALL_SPEED,
          -BALL_SPEED
        ));
      }
    }

    if (activeBall.y > HEIGHT) {
      balls.splice(index, 1);
      if (activeBall.isStarter) {
        resetComboStreak();
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

  if (gameState === "playing" && bricks.every(brick => brick.optional)) {
    finishGame("You Win!");
  }
}

function updateComboDisplay(multiplier) {
  comboDisplay.textContent = `COMBO x${multiplier}`;
  comboDisplay.hidden = comboStreak === 0;
}

function resetComboStreak() {
  comboStreak = 0;
  comboDisplay.hidden = true;
}

function spawnBrickBurst(brick) {
  let color = currentLevel === 2 ? "#b9a17c" : currentLevel === 3 ? "#ffb36f" : "#ff737a";
  if (brick.powerup === "multiball") color = "#91e8ff";
  if (brick.powerup === "invert") color = "#e0a3ff";
  if (brick.material === "diamond") color = "#74f2ff";

  const centerX = brick.x + brick.width / 2;
  const centerY = brick.y + brick.height / 2;
  for (let index = 0; index < 10; index++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2.8;
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 24 + Math.random() * 14,
      maxLife: 38,
      size: 2 + Math.random() * 3,
      color
    });
  }
}

function updateParticles() {
  for (let index = particles.length - 1; index >= 0; index--) {
    const particle = particles[index];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.035;
    particle.life--;
    if (particle.life <= 0) {
      particles.splice(index, 1);
    }
  }
}

function drawParticles() {
  for (const particle of particles) {
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function updateScore() {
  scoreValue.textContent = score.toLocaleString();
  scoreDisplay.setAttribute("aria-label", `Score: ${score}`);
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
  if (isWin) {
    const elapsed = levelStartedAt === null ? Infinity : performance.now() - levelStartedAt;
    if (elapsed <= 30000) {
      unlockAchievement("speed-run");
    }
    if (reserveCount === levelStartReserveCount) {
      unlockAchievement("clean-sweep");
    }
  }
  gameState = isWin ? "won" : "lost";
  gameMenuButton.hidden = true;
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
  score = 0;
  updateScore();
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
  particles = [];
  resetComboStreak();
  levelStartedAt = null;
  levelStartReserveCount = reserveCount;
  isUpsideDown = false;
  flipIndicator.hidden = true;
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
  const previousX = paddle.x;
  let direction = 0;
  if (keys["arrowleft"] || keys["a"]) {
    direction--;
  }
  if (keys["arrowright"] || keys["d"]) {
    direction++;
  }
  paddle.x += direction * paddle.speed * (isUpsideDown ? -1 : 1);

  // Keep the paddle on the screen.
  if (paddle.x < 0) {
    paddle.x = 0;
  }
  if (paddle.x + paddle.width > WIDTH) {
    paddle.x = WIDTH - paddle.width;
  }
  paddle.movement = paddle.x - previousX;
}

function moveBall(activeBall) {
  activeBall.x = activeBall.x + activeBall.vx;
  activeBall.y = activeBall.y + activeBall.vy;
  if (equippedTrail) {
    activeBall.trail.unshift({
      x: activeBall.x + activeBall.width / 2,
      y: activeBall.y + activeBall.height / 2
    });
    activeBall.trail.length = Math.min(activeBall.trail.length, 24);
  }
}

function drawBallTrail(activeBall) {
  const skin = BALL_TRAILS[equippedTrail];
  if (!skin || activeBall.trail.length === 0) {
    return;
  }

  const trailLength = activeBall.trail.length;
  const animationTime = performance.now() / 1000;
  const animationStep = Math.floor(animationTime * 12);
  const oldestPoint = activeBall.trail[trailLength - 1];
  const newestPoint = activeBall.trail[0];
  const tailGradient = ctx.createLinearGradient(
    newestPoint.x,
    newestPoint.y,
    oldestPoint.x,
    oldestPoint.y
  );
  skin.colors.forEach((color, index) => {
    tailGradient.addColorStop(index / Math.max(1, skin.colors.length - 1), color);
  });

  ctx.save();
  if (trailLength > 1) {
    ctx.beginPath();
    ctx.moveTo(newestPoint.x, newestPoint.y);
    for (let index = 1; index < trailLength - 1; index++) {
      const point = activeBall.trail[index];
      const nextPoint = activeBall.trail[index + 1];
      ctx.quadraticCurveTo(
        point.x,
        point.y,
        (point.x + nextPoint.x) / 2,
        (point.y + nextPoint.y) / 2
      );
    }
    ctx.lineTo(oldestPoint.x, oldestPoint.y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = tailGradient;
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 15;
    ctx.globalAlpha = 0.52;
    ctx.lineWidth = activeBall.width * 1.15;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.84;
    ctx.lineWidth = activeBall.width * 0.42;
    ctx.stroke();
    ctx.globalAlpha = 0.78;
    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.lineWidth = Math.max(1, activeBall.width * 0.1);
    ctx.stroke();
  }

  activeBall.trail.forEach((point, index) => {
    const progress = index / Math.max(1, trailLength - 1);
    const size = activeBall.width * (0.48 - progress * 0.34);
    const color = skin.colors[(index + animationStep) % skin.colors.length];
    const flicker = 0.82 + Math.sin(animationTime * 16 + index * 1.7) * 0.18;
    ctx.globalAlpha = 0.7 * (1 - progress) * flicker;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 7 * (1 - progress);
    ctx.save();
    ctx.translate(point.x, point.y);

    if (skin.shape === "ring") {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, size * 0.28);
      ctx.stroke();
    } else if (skin.shape === "square") {
      ctx.rotate(animationTime * 2.4 + index * 0.12);
      ctx.fillRect(-size * 0.65, -size * 0.65, size * 1.3, size * 1.3);
    } else if (skin.shape === "galaxy") {
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 1.55, size * 0.48, animationTime * 0.8 + index * 0.2, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, size * 0.18);
      ctx.stroke();
    } else if (skin.shape === "star" || skin.shape === "spark") {
      ctx.rotate(animationTime * 1.8 + index * 0.08);
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.5);
      ctx.lineTo(size * 0.28, -size * 0.28);
      ctx.lineTo(size * 1.5, 0);
      ctx.lineTo(size * 0.28, size * 0.28);
      ctx.lineTo(0, size * 1.5);
      ctx.lineTo(-size * 0.28, size * 0.28);
      ctx.lineTo(-size * 1.5, 0);
      ctx.lineTo(-size * 0.28, -size * 0.28);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size, 0);
      ctx.closePath();
      ctx.fill();
    }

    if (skin.shape === "galaxy" && index % 3 === 0) {
      ctx.fillStyle = "#fff6ca";
      ctx.beginPath();
      ctx.arc(size * 1.35, -size * 0.8, Math.max(0.7, size * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
  ctx.restore();
  ctx.globalAlpha = 1;
}


// ------------------------------------------------------------
// DRAW: paints everything on the canvas. Black background,
// white shapes.
// ------------------------------------------------------------
function draw() {
  ctx.save();
  if (isUpsideDown) {
    ctx.translate(WIDTH, HEIGHT);
    ctx.rotate(Math.PI);
  }
  drawCourt();
  drawPaddle();
  for (const activeBall of balls) {
    drawBallTrail(activeBall);
    drawBasketball(activeBall);
  }

  drawBricks();  // bricks.js
  drawParticles();
  ctx.restore();
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

function drawPaddleSkinEffects(skin) {
  const now = performance.now();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
  ctx.clip();

  const shimmerOffset = (now % 1800) / 1800 * (paddle.width + paddle.height) - paddle.height;
  const shimmer = ctx.createLinearGradient(
    paddle.x + shimmerOffset,
    paddle.y,
    paddle.x + shimmerOffset + paddle.height,
    paddle.y + paddle.height
  );
  shimmer.addColorStop(0, "rgb(255 255 255 / 0%)");
  shimmer.addColorStop(0.5, "rgb(255 255 255 / 52%)");
  shimmer.addColorStop(1, "rgb(255 255 255 / 0%)");
  ctx.fillStyle = shimmer;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

  if (skin.effect === "galaxy") {
    for (let index = 0; index < 9; index++) {
      const x = paddle.x + ((index * 37 + 13) % 89) + 1;
      const y = paddle.y + 3 + (index * 7) % 7;
      const twinkle = 0.35 + (Math.sin(now / 180 + index * 1.7) + 1) * 0.32;
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = index % 2 === 0 ? "#fff4bc" : "#73f3f0";
      ctx.fillRect(x, y, index % 3 === 0 ? 2 : 1, index % 3 === 0 ? 2 : 1);
    }
  } else if (skin.effect === "aurora") {
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "rgb(199 255 243 / 85%)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(paddle.x, paddle.y + paddle.height * 0.7);
    ctx.quadraticCurveTo(paddle.x + paddle.width * 0.48, paddle.y - 3, paddle.x + paddle.width, paddle.y + paddle.height * 0.55);
    ctx.stroke();
  } else {
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = "#fff4c2";
    for (let index = 0; index < 5; index++) {
      const x = paddle.x + 10 + index * 17;
      const y = paddle.y + (index % 2 ? 3 : 7);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-1.2, -1.2, 2.4, 2.4);
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawPaddle() {
  const skin = PADDLE_SKINS[equippedPaddleSkin];
  if (skin) {
    ctx.save();
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 14;
    const skinGradient = skin.colors
      ? ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y + paddle.height)
      : ctx.createLinearGradient(0, paddle.y, 0, paddle.y + paddle.height);
    const skinColors = skin.colors || [skin.top, skin.base, skin.edge];
    skinColors.forEach((color, index) => {
      skinGradient.addColorStop(index / (skinColors.length - 1), color);
    });
    ctx.fillStyle = skinGradient;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
    ctx.fill();
    if (skin.effect) {
      drawPaddleSkinEffects(skin);
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = skin.top;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    return;
  }

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

function drawBallSkinEffects(skin, centerX, centerY, radius) {
  const now = performance.now();
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  if (skin.effect === "galaxy") {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(now / 2300);
    ctx.strokeStyle = "rgb(105 240 242 / 76%)";
    ctx.lineWidth = Math.max(0.7, radius * 0.12);
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.92, radius * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const stars = [[-0.48, -0.38], [0.42, -0.5], [0.5, 0.32], [-0.15, 0.6], [-0.65, 0.12]];
    stars.forEach(([x, y], index) => {
      ctx.globalAlpha = 0.42 + (Math.sin(now / 170 + index * 2) + 1) * 0.26;
      ctx.fillStyle = index % 2 === 0 ? "#fff3bd" : "#a2f8f0";
      ctx.beginPath();
      ctx.arc(centerX + x * radius, centerY + y * radius, Math.max(0.6, radius * 0.12), 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (skin.effect === "aurora") {
    ctx.globalAlpha = 0.68;
    ctx.strokeStyle = "rgb(221 255 245 / 82%)";
    ctx.lineWidth = Math.max(0.7, radius * 0.14);
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY + radius * 0.25);
    ctx.quadraticCurveTo(centerX, centerY - radius * 0.95, centerX + radius, centerY - radius * 0.15);
    ctx.stroke();
    ctx.strokeStyle = "rgb(255 210 132 / 74%)";
    ctx.beginPath();
    ctx.moveTo(centerX - radius * 0.8, centerY + radius * 0.65);
    ctx.quadraticCurveTo(centerX, centerY - radius * 0.2, centerX + radius * 0.8, centerY + radius * 0.5);
    ctx.stroke();
  } else {
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = "#fff4c2";
    for (let index = 0; index < 4; index++) {
      const angle = now / 1900 + index * Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius * 0.56;
      const y = centerY + Math.sin(angle) * radius * 0.56;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-radius * 0.11, -radius * 0.11, radius * 0.22, radius * 0.22);
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawBasketball(activeBall) {
  const radius = activeBall.width / 2;
  const centerX = activeBall.x + radius;
  const centerY = activeBall.y + radius;
  const skin = BALL_SKINS[equippedBallSkin];
  if (skin) {
    const skinGradient = ctx.createRadialGradient(
      centerX - radius * 0.38,
      centerY - radius * 0.45,
      radius * 0.1,
      centerX,
      centerY,
      radius * 1.1
    );
    const skinColors = skin.colors || [skin.top, skin.base, skin.edge];
    skinColors.forEach((color, index) => {
      skinGradient.addColorStop(index / (skinColors.length - 1), color);
    });
    ctx.save();
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 10;
    ctx.fillStyle = skinGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    if (skin.effect) {
      drawBallSkinEffects(skin, centerX, centerY, radius);
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = skin.seam;
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
    return;
  }

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
  loadAchievements();
  loadEconomy();
  resetGame();
  gameState = "menu";
  titleScreen.hidden = false;
  gameMenuButton.hidden = true;
  showMenuPage("home-page");
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

restartButton.addEventListener("click", function () {
  if (gameState === "won" && currentLevel < 3) {
    startNextLevel();
    gameMenuButton.hidden = false;
    return;
  }

  resetGame();
  gameMenuButton.hidden = false;
});

// Wait until all three script files have loaded, then start.
window.addEventListener("load", start);
