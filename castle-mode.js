import * as THREE from "three";

const canvas = document.getElementById("starfall-canvas");
const gameScreen = document.getElementById("starfall-game");
const titleScreen = document.getElementById("title-screen");
const exitButton = document.getElementById("starfall-exit");
const objective = document.getElementById("starfall-objective");
const prompt = document.getElementById("starfall-prompt");
const status = document.getElementById("starfall-status");
const worldName = document.getElementById("starfall-world-name");
const starCount = document.getElementById("starfall-star-count");
const touchButtons = document.querySelectorAll("[data-starfall-move]");
const jumpButton = document.getElementById("starfall-jump");
const interactButton = document.getElementById("starfall-interact");

let renderer;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 180);
const clock = new THREE.Clock();
const materials = {
  stone: new THREE.MeshStandardMaterial({ color: 0xb9b39a, roughness: 0.94 }),
  paleStone: new THREE.MeshStandardMaterial({ color: 0xe7dcb9, roughness: 0.85 }),
  darkStone: new THREE.MeshStandardMaterial({ color: 0x555c55, roughness: 0.96 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x5d9c67, roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x2d704f, roughness: 1 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x754d37, roughness: 0.92 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xf2c85b, metalness: 0.38, roughness: 0.38 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf5edda, roughness: 0.8 })
};

const gates = [
  { name: "SUNLIT MEADOW", color: "#e89a55", x: -9, destination: "meadow" },
  { name: "CLOUD GARDEN", color: "#67b8d2", x: 0, destination: "clouds" },
  { name: "MOONLIT RUINS", color: "#a589d1", x: 9, destination: "ruins" }
];
const worlds = {
  meadow: { name: "SUNLIT MEADOW", color: 0x9acbdf, fog: 0x9acbdf, star: [5, 1.9, -8] },
  clouds: { name: "CLOUD GARDEN", color: 0x9bcde8, fog: 0x9bcde8, star: [-5, 1.9, -9] },
  ruins: { name: "MOONLIT RUINS", color: 0x35405d, fog: 0x35405d, star: [4, 1.9, -8] }
};

let active = false;
let currentWorld = "hub";
let stars = 0;
let player;
let star;
let activeStage;
let stages;
let yaw = 0;
let velocityY = 0;
let grounded = true;
let jumpRequested = false;
let pointerHeld = false;
let previousPointerX = 0;
const held = new Set();
const touchHeld = new Set();

function box(parent, width, height, depth, material, x, y, z, castShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, radiusTop, radiusBottom, height, material, x, y, z, segments = 10) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    material
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addGround(parent, color, size = 48) {
  const groundMaterial = new THREE.MeshStandardMaterial({ color, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  parent.add(ground);
}

function makePortalTexture(color, variant) {
  const art = document.createElement("canvas");
  art.width = 256;
  art.height = 320;
  const context = art.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, 320);
  gradient.addColorStop(0, variant === "ruins" ? "#202a48" : "#b9e2e8");
  gradient.addColorStop(1, color);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 320);
  context.fillStyle = variant === "clouds" ? "#f5f5e5" : "#477d62";
  context.beginPath();
  context.moveTo(0, 230);
  context.lineTo(72, 140);
  context.lineTo(132, 224);
  context.lineTo(192, 154);
  context.lineTo(256, 226);
  context.lineTo(256, 320);
  context.lineTo(0, 320);
  context.fill();
  context.fillStyle = "#fff1bd";
  context.beginPath();
  context.arc(174, 76, 26, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#fff8df";
  context.font = "bold 16px Courier New";
  context.textAlign = "center";
  context.fillText("STARFALL", 128, 294);

  const texture = new THREE.CanvasTexture(art);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture });
}

function addPortal(parent, gate) {
  const group = new THREE.Group();
  group.position.set(gate.x, 0, -9);
  parent.add(group);
  box(group, 3.2, 4.3, 0.38, materials.darkStone, 0, 2.13, 0);
  box(group, 2.65, 3.65, 0.16, materials.gold, 0, 2.15, 0.25);
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(2.28, 3.25),
    makePortalTexture(gate.color, gate.destination)
  );
  art.position.set(0, 2.15, 0.35);
  group.add(art);
  box(group, 3.5, 0.35, 0.7, materials.paleStone, 0, 0.18, 0);
  for (const side of [-1, 1]) {
    cylinder(group, 0.13, 0.18, 4.45, materials.paleStone, side * 1.63, 2.18, 0, 8);
  }
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512;
  labelCanvas.height = 72;
  const context = labelCanvas.getContext("2d");
  context.fillStyle = "#192b2d";
  context.fillRect(0, 0, 512, 72);
  context.fillStyle = "#fff2c9";
  context.font = "bold 30px Courier New";
  context.textAlign = "center";
  context.fillText(gate.name, 256, 48);
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.45),
    new THREE.MeshBasicMaterial({ map: labelTexture })
  );
  label.position.set(0, 4.8, 0.2);
  group.add(label);
}

function addTree(parent, x, z, scale = 1) {
  cylinder(parent, 0.32 * scale, 0.48 * scale, 2.1 * scale, materials.wood, x, 1.05 * scale, z, 7);
  const leaves = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.35 * scale, 1),
    materials.leaf
  );
  leaves.position.set(x, 2.5 * scale, z);
  leaves.castShadow = true;
  parent.add(leaves);
}

function buildHub() {
  const group = new THREE.Group();
  addGround(group, 0x829b76, 52);
  box(group, 39, 0.35, 39, materials.grass, 0, -0.22, 0, false);
  box(group, 34, 0.18, 18, materials.stone, 0, 0.02, 3, false);
  for (let x = -15; x <= 15; x += 3) {
    for (let z = -4; z <= 10; z += 3) {
      box(group, 2.85, 0.05, 2.85, materials.paleStone, x, 0.14, z, false);
    }
  }

  box(group, 39, 8, 1.3, materials.paleStone, 0, 4, -20);
  box(group, 1.3, 8, 39, materials.paleStone, -19, 4, 0);
  box(group, 1.3, 8, 39, materials.paleStone, 19, 4, 0);
  box(group, 9.5, 9, 2, materials.stone, 0, 4.5, -20.6);
  box(group, 2.3, 3.9, 0.4, materials.darkStone, 0, 1.95, -19.35);
  for (const x of [-16, 16]) {
    cylinder(group, 2.4, 2.8, 14, materials.stone, x, 7, -18, 8);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3, 4, 8), materials.wood);
    roof.position.set(x, 16, -18);
    roof.castShadow = true;
    group.add(roof);
  }
  box(group, 20, 1, 2, materials.darkStone, 0, 8, -18.4);
  for (const gate of gates) addPortal(group, gate);

  cylinder(group, 2.1, 2.5, 0.65, materials.paleStone, 0, 0.45, 7, 12);
  cylinder(group, 0.25, 0.4, 2.2, materials.white, 0, 1.65, 7, 10);
  const water = new THREE.MeshStandardMaterial({ color: 0x7dc7d0, metalness: 0.15, roughness: 0.25 });
  cylinder(group, 1.75, 1.75, 0.12, water, 0, 0.82, 7, 16);
  for (const x of [-16, -12, 12, 16]) {
    for (const z of [-3, 8, 14]) addTree(group, x, z, 0.85);
  }
  return group;
}

function buildStage(destination) {
  const config = worlds[destination];
  const group = new THREE.Group();
  addGround(group, destination === "ruins" ? 0x596052 : 0x6da76d, 44);
  box(group, 31, 0.8, 31, destination === "ruins" ? materials.darkStone : materials.grass, 0, -0.45, 0, false);

  if (destination === "meadow") {
    for (const x of [-12, -8, 8, 12]) addTree(group, x, -7, 1.05);
    for (let i = 0; i < 8; i++) {
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 6),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0xffdf8d : 0xf28d80 })
      );
      flower.position.set((i - 3.5) * 1.4, 0.25, 2 + (i % 2) * 1.1);
      group.add(flower);
    }
  } else if (destination === "clouds") {
    for (let i = 0; i < 7; i++) {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(2.5 + (i % 3) * 0.5, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xf3f2e7, roughness: 1 })
      );
      cloud.position.set(-14 + i * 4.7, 1.5 + (i % 2), -15 - (i % 3) * 2);
      cloud.scale.y = 0.35;
      group.add(cloud);
    }
    for (const x of [-12, -8, 8, 12]) {
      cylinder(group, 1.2, 1.5, 4, materials.paleStone, x, 2, -11, 8);
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 1), materials.leaf);
      leaf.position.set(x, 4.5, -11);
      group.add(leaf);
    }
  } else {
    for (const x of [-12, -8, 8, 12]) {
      box(group, 2.2, 6 + (x % 3), 2.2, materials.darkStone, x, 3, -11);
      box(group, 2.8, 0.45, 2.8, materials.stone, x, 6.2 + (x % 3), -11);
    }
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0xffe6a3 })
    );
    moon.position.set(-9, 12, -16);
    group.add(moon);
  }

  const [starX, starY, starZ] = config.star;
  cylinder(group, 0.85, 1.05, 0.7, materials.paleStone, starX, 0.35, starZ, 10);
  const orb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.83, 1),
    new THREE.MeshStandardMaterial({
      color: 0xffdf68,
      emissive: 0xe39c25,
      emissiveIntensity: 1.5,
      metalness: 0.25,
      roughness: 0.23
    })
  );
  orb.position.set(starX, starY, starZ);
  orb.castShadow = true;
  group.add(orb);
  const light = new THREE.PointLight(0xffd66b, 4, 10);
  light.position.copy(orb.position);
  group.add(light);
  return { group, orb, light };
}

function makePlayer() {
  const group = new THREE.Group();
  const tunic = new THREE.MeshStandardMaterial({ color: 0x387a87, roughness: 0.72 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x39435c, roughness: 0.8 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd9a77d, roughness: 0.82 });
  box(group, 0.9, 1.05, 0.55, tunic, 0, 1.05, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), skin);
  head.position.set(0, 1.88, 0);
  head.castShadow = true;
  group.add(head);
  box(group, 0.98, 0.2, 0.65, materials.gold, 0, 2.28, 0);
  box(group, 0.27, 0.75, 0.38, skin, -0.61, 1.1, 0);
  box(group, 0.27, 0.75, 0.38, skin, 0.61, 1.1, 0);
  box(group, 0.34, 0.72, 0.4, trousers, -0.24, 0.35, 0);
  box(group, 0.34, 0.72, 0.4, trousers, 0.24, 0.35, 0);
  scene.add(group);
  return group;
}

function resize() {
  if (!renderer) return;
  const width = Math.max(1, gameScreen.clientWidth);
  const height = Math.max(1, gameScreen.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function setWorld(destination) {
  currentWorld = destination;
  const inHub = destination === "hub";
  hub.visible = inHub;
  if (!inHub) {
    activeStage = stages[destination];
    star = activeStage.orb;
  }
  Object.entries(stages).forEach(([name, stage]) => {
    const visible = name === destination;
    stage.group.visible = visible;
    stage.orb.visible = visible;
    stage.light.visible = visible;
  });
  scene.background = new THREE.Color(inHub ? 0x9bc7d3 : worlds[destination].color);
  scene.fog = new THREE.Fog(inHub ? 0x9bc7d3 : worlds[destination].fog, 38, 95);
  worldName.textContent = inHub ? "THE LANTERN KEEP" : worlds[destination].name;
  objective.textContent = inHub
    ? stars === 3 ? "Every star is yours. Wander the courtyard or explore again." : "Find a painted gate and press E to explore its world."
    : `Explore ${worlds[destination].name.toLowerCase()} and touch the star.`;
  player.position.set(0, 0, inHub ? 13 : 10);
  velocityY = 0;
  grounded = true;
  prompt.hidden = true;
}

function start() {
  if (!renderer) {
    try {
      const nextRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      nextRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
      nextRenderer.shadowMap.enabled = true;
      nextRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
      nextRenderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer = nextRenderer;
    } catch (error) {
      console.error("Starfall could not initialize WebGL.", error);
      status.textContent = "Starfall could not start. Enable WebGL or try a current browser.";
      status.hidden = false;
      return false;
    }
  }

  active = true;
  held.clear();
  touchHeld.clear();
  stars = 0;
  starCount.textContent = "0 / 3";
  titleScreen.hidden = true;
  status.hidden = true;
  gameScreen.hidden = false;
  resize();
  setWorld("hub");
  canvas.focus({ preventScroll: true });
  clock.getDelta();
  return true;
}

function exit() {
  active = false;
  held.clear();
  touchHeld.clear();
  jumpRequested = false;
  pointerHeld = false;
  prompt.hidden = true;
  gameScreen.hidden = true;
  titleScreen.hidden = false;
}

function findNearbyGate() {
  if (currentWorld !== "hub") return null;
  return gates.find(gate => Math.hypot(player.position.x - gate.x, player.position.z + 9) < 3.4) || null;
}

function interact() {
  if (currentWorld === "hub") {
    const gate = findNearbyGate();
    if (gate) setWorld(gate.destination);
    return;
  }
  setWorld("hub");
  objective.textContent = "Back in the courtyard. Choose another painted gate.";
}

function update(delta) {
  const forward = Number(held.has("w") || held.has("arrowup") || touchHeld.has("forward"))
    - Number(held.has("s") || held.has("arrowdown") || touchHeld.has("back"));
  const sideways = Number(held.has("d") || held.has("arrowright") || touchHeld.has("right"))
    - Number(held.has("a") || held.has("arrowleft") || touchHeld.has("left"));
  const length = Math.hypot(forward, sideways) || 1;
  const moveX = (-Math.sin(yaw) * forward + Math.cos(yaw) * sideways) / length;
  const moveZ = (-Math.cos(yaw) * forward - Math.sin(yaw) * sideways) / length;
  const moving = forward !== 0 || sideways !== 0;
  const speed = 7.2;
  player.position.x += moveX * speed * delta;
  player.position.z += moveZ * speed * delta;
  player.position.x = THREE.MathUtils.clamp(player.position.x, -17, 17);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -17, 17);
  if (moving) player.rotation.y = Math.atan2(-moveX, -moveZ);

  if (jumpRequested && grounded) {
    velocityY = 8.8;
    grounded = false;
  }
  jumpRequested = false;
  velocityY -= 22 * delta;
  player.position.y = Math.max(0, player.position.y + velocityY * delta);
  if (player.position.y === 0) {
    velocityY = 0;
    grounded = true;
  }

  const gate = findNearbyGate();
  if (gate) {
    prompt.textContent = `E  ENTER ${gate.name}`;
    prompt.hidden = false;
  } else if (currentWorld !== "hub") {
    prompt.textContent = "E  RETURN TO THE COURTYARD";
    prompt.hidden = false;
  } else {
    prompt.hidden = true;
  }

  if (currentWorld !== "hub") {
    star.rotation.y += delta * 1.5;
    star.rotation.x = Math.sin(performance.now() * 0.0015) * 0.13;
    star.position.y = worlds[currentWorld].star[1] + Math.sin(performance.now() * 0.002) * 0.22;
    const target = new THREE.Vector3(...worlds[currentWorld].star);
    const playerCenter = player.position.clone().add(new THREE.Vector3(0, 1.1, 0));
    if (playerCenter.distanceTo(target) < 1.65) {
      stars += 1;
      starCount.textContent = `${stars} / 3`;
      setWorld("hub");
      objective.textContent = `Star collected! ${stars} of 3. Choose another painted gate.`;
    }
  }

  const cameraDistance = 10;
  const desiredPosition = new THREE.Vector3(
    player.position.x + Math.sin(yaw) * cameraDistance,
    player.position.y + 6.5,
    player.position.z + Math.cos(yaw) * cameraDistance
  );
  camera.position.lerp(desiredPosition, 1 - Math.exp(-7 * delta));
  camera.lookAt(player.position.x, player.position.y + 1.05, player.position.z);
}

function frame() {
  if (!active) return;
  const delta = Math.min(clock.getDelta(), 0.04);
  update(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

function beginFrame() {
  if (active) {
    clock.getDelta();
    requestAnimationFrame(frame);
  }
}

scene.add(new THREE.HemisphereLight(0xe4f3ef, 0x6b6654, 2.1));
const sunlight = new THREE.DirectionalLight(0xfff1d2, 3);
sunlight.position.set(-12, 22, 11);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(1024, 1024);
sunlight.shadow.camera.left = -28;
sunlight.shadow.camera.right = 28;
sunlight.shadow.camera.top = 28;
sunlight.shadow.camera.bottom = -28;
scene.add(sunlight);

const hub = buildHub();
scene.add(hub);
activeStage = buildStage("meadow");
scene.add(activeStage.group);
star = activeStage.orb;
const cloudStage = buildStage("clouds");
scene.add(cloudStage.group);
const ruinStage = buildStage("ruins");
scene.add(ruinStage.group);
stages = { meadow: activeStage, clouds: cloudStage, ruins: ruinStage };
player = makePlayer();
setWorld("hub");

window.startStarfall = () => {
  if (start()) beginFrame();
};
exitButton.addEventListener("click", exit);
window.addEventListener("resize", resize);
window.addEventListener("blur", () => {
  held.clear();
  touchHeld.clear();
  pointerHeld = false;
});

document.addEventListener("keydown", event => {
  if (!active) return;
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }
  held.add(key);
  if (key === " " && !event.repeat) jumpRequested = true;
  if (key === "e" && !event.repeat) interact();
  if (key === "escape") exit();
});

document.addEventListener("keyup", event => held.delete(event.key.toLowerCase()));
canvas.addEventListener("pointerdown", event => {
  pointerHeld = true;
  previousPointerX = event.clientX;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  if (!pointerHeld || event.pointerType === "touch") return;
  yaw += (event.clientX - previousPointerX) * 0.006;
  previousPointerX = event.clientX;
});
canvas.addEventListener("pointerup", () => { pointerHeld = false; });
canvas.addEventListener("pointercancel", () => { pointerHeld = false; });

touchButtons.forEach(button => {
  const direction = button.dataset.starfallMove;
  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    touchHeld.add(direction);
    button.setPointerCapture(event.pointerId);
  });
  const release = () => touchHeld.delete(direction);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

jumpButton.addEventListener("pointerdown", event => {
  event.preventDefault();
  jumpRequested = true;
});
interactButton.addEventListener("click", interact);

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(gameScreen);
