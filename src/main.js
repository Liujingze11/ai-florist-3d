import * as THREE from "../vendor/three.module.js";

const flowers = [
  { id: "rose", name: "玫瑰", note: "经典主花，表达明确", category: "main", role: "focal", color: "#d8587b", accent: "#f5b0bf" },
  { id: "peony", name: "芍药", note: "大花头，柔软丰盛", category: "main", role: "focal", color: "#ef8fb0", accent: "#fff0f4" },
  { id: "tulip", name: "郁金香", note: "弯茎副花，增加动态", category: "secondary", role: "mass", color: "#f1885f", accent: "#ffd1a6" },
  { id: "lily", name: "百合", note: "线条副花，拉开高度", category: "secondary", role: "line", color: "#fff3d7", accent: "#c9953d" },
  { id: "iris", name: "鸢尾", note: "冷调线条，做外轮廓", category: "secondary", role: "line", color: "#8a6fd6", accent: "#c5b8ff" },
  { id: "daisy", name: "雏菊", note: "配花填充，补空气感", category: "filler", role: "filler", color: "#f8f3de", accent: "#e4b847" }
];

const foliageOptions = [
  { id: "eucalyptus", name: "尤加利", note: "灰绿叶材，提升高级感", color: "#7f9b83" },
  { id: "fern", name: "蕨叶", note: "细碎轮廓，增加层次", color: "#477b5a" },
  { id: "ruscus", name: "鲁斯克斯", note: "硬挺叶片，撑开外形", color: "#5f8a5c" }
];

const wrapOptions = [
  { id: "ivory", name: "雾面米白", note: "温柔、干净、百搭", color: "#e8dfd2", ribbon: "#c9953d" },
  { id: "kraft", name: "牛皮纸", note: "自然、日常、有手作感", color: "#c9a56f", ribbon: "#6c4f32" },
  { id: "charcoal", name: "炭灰纸", note: "适合深色与高级感花束", color: "#4d4b47", ribbon: "#d6c4a1" },
  { id: "blush", name: "浅粉纸", note: "礼物感强，适合庆祝", color: "#f1c8cf", ribbon: "#b84c68" }
];

const shelfGroups = [
  { id: "main", title: "主花", hint: "决定花束第一眼的重心" },
  { id: "secondary", title: "副花 / 线条花", hint: "负责高度、方向和姿态" },
  { id: "filler", title: "配花", hint: "填补空隙，让花束更自然" },
  { id: "foliage", title: "叶材", hint: "撑开轮廓，连接花与包装" }
];

const occasions = {
  celebration: {
    mood: "温柔庆祝",
    title: "晨光玫瑰花束",
    palette: "玫瑰粉 / 杏橙 / 鼠尾草绿",
    budget: "中高端 · ¥368-520"
  },
  proposal: {
    mood: "浓烈浪漫",
    title: "暮色求婚花束",
    palette: "深玫红 / 奶油白 / 金色",
    budget: "高端 · ¥680-980"
  },
  home: {
    mood: "自然松弛",
    title: "餐桌野趣花束",
    palette: "奶油白 / 鸢尾紫 / 叶绿",
    budget: "日常 · ¥198-328"
  },
  gift: {
    mood: "明亮有记忆点",
    title: "礼盒鲜花花束",
    palette: "珊瑚橙 / 芍药粉 / 青绿",
    budget: "精选 · ¥298-468"
  }
};

const state = {
  selected: {
    main: new Set(["rose", "peony"]),
    secondary: new Set(["tulip", "iris"]),
    filler: new Set(["daisy"]),
    foliage: new Set(["eucalyptus", "ruscus"])
  },
  wrap: "ivory",
  occasion: "celebration",
  density: 18,
  height: 58,
  spread: 54,
  leaves: 42,
  uploadTone: null
};

const canvas = document.querySelector("#bouquetCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 2.15, 7.5);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
keyLight.position.set(4.5, 7.5, 5);
keyLight.castShadow = true;
scene.add(keyLight);
scene.add(new THREE.HemisphereLight(0xfffbf2, 0x9fb28c, 1.6));

const fillLight = new THREE.PointLight(0xffe8d4, 1.4, 12);
fillLight.position.set(-3.5, 2.6, 3.5);
scene.add(fillLight);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(3.2, 96),
  new THREE.MeshStandardMaterial({ color: "#eee7da", roughness: 0.96 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.94;
floor.receiveShadow = true;
scene.add(floor);

const bouquetGroup = new THREE.Group();
scene.add(bouquetGroup);

const shelf = document.querySelector("#flowerShelf");
const wrapGrid = document.querySelector("#wrapGrid");
const titleEl = document.querySelector("#bouquetTitle");
const moodLabel = document.querySelector("#moodLabel");
const stemCount = document.querySelector("#stemCount");
const heroFlower = document.querySelector("#heroFlower");
const paletteText = document.querySelector("#paletteText");
const budgetText = document.querySelector("#budgetText");
const aiModeText = document.querySelector("#aiModeText");
const renderBadge = document.querySelector("#renderBadge");
const wrapLabel = document.querySelector("#wrapLabel");

function createFlowerButtons() {
  shelfGroups.forEach((group) => {
    const groupEl = document.createElement("div");
    groupEl.className = "shelf-group";
    groupEl.innerHTML = `
      <div class="shelf-title">
        <strong>${group.title}</strong>
        <span>${group.hint}</span>
      </div>
      <div class="flower-grid" data-group="${group.id}"></div>
    `;
    shelf.append(groupEl);

    const grid = groupEl.querySelector(".flower-grid");
    const items = group.id === "foliage" ? foliageOptions : flowers.filter((flower) => flower.category === group.id);
    items.forEach((item) => {
      const button = document.createElement("button");
      button.className = "flower-chip";
      button.type = "button";
      button.dataset.category = group.id;
      button.dataset.item = item.id;
      button.innerHTML = `
        <span class="swatch" style="background:${item.color}"></span>
        <span>
          <span class="chip-name">${item.name}</span>
          <span class="chip-note">${item.note}</span>
        </span>
      `;
      button.addEventListener("click", () => {
        const bucket = state.selected[group.id];
        const minimum = group.id === "main" ? 1 : 0;
        if (bucket.has(item.id) && bucket.size > minimum) {
          bucket.delete(item.id);
        } else {
          bucket.add(item.id);
        }
        updateUI();
        rebuildBouquet();
      });
      grid.append(button);
    });
  });

  wrapOptions.forEach((wrap) => {
    const button = document.createElement("button");
    button.className = "wrap-chip";
    button.type = "button";
    button.dataset.wrap = wrap.id;
    button.innerHTML = `
      <span class="wrap-swatch" style="background:${wrap.color}"></span>
      <span>
        <span class="chip-name">${wrap.name}</span>
        <span class="chip-note">${wrap.note}</span>
      </span>
    `;
    button.addEventListener("click", () => {
      state.wrap = wrap.id;
      updateUI();
      rebuildBouquet();
    });
    wrapGrid.append(button);
  });
}

function material(color, roughness = 0.78) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.02,
    side: THREE.DoubleSide,
    envMapIntensity: 0.45
  });
}

function makePetalGeometry(width, length, cup = 0.08, pinch = 0.22) {
  const geometry = new THREE.PlaneGeometry(width, length, 8, 14);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i) + length / 2;
    const yRatio = y / length;
    const taper = 1 - Math.pow(Math.abs(yRatio - 0.48) * 1.24, 2);
    const edge = Math.abs(x) / (width / 2);
    position.setX(i, x * Math.max(0.18, taper));
    position.setY(i, y);
    position.setZ(i, Math.sin(yRatio * Math.PI) * cup * (1 - edge * 0.45) - edge * pinch * 0.04);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function makePetal(color, width, length, cup, pinch = 0.22) {
  const petal = new THREE.Mesh(makePetalGeometry(width, length, cup, pinch), material(color, 0.64));
  petal.castShadow = true;
  return petal;
}

function makeCurvedStem(points, radius = 0.018, color = "#416f4d") {
  const curve = new THREE.CatmullRomCurve3(points);
  const stem = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 28, radius, 7, false),
    material(color, 0.82)
  );
  stem.castShadow = true;
  return { stem, curve };
}

function addStamen(group, count, radius, height, color = "#c9953d") {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, height, 6), material("#e8d8a8", 0.7));
    stem.position.set(Math.cos(angle) * radius, height * 0.24, Math.sin(angle) * radius);
    stem.rotation.z = Math.cos(angle) * 0.18;
    stem.rotation.x = Math.sin(angle) * 0.18;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), material(color, 0.5));
    tip.position.y = height * 0.52;
    stem.add(tip);
    group.add(stem);
  }
}

function makeRose(flower, size, variant) {
  const group = new THREE.Group();
  for (let layer = 0; layer < 5; layer += 1) {
    const petals = 5 + layer * 2;
    const radius = (0.045 + layer * 0.038) * size;
    for (let i = 0; i < petals; i += 1) {
      const angle = (i / petals) * Math.PI * 2 + layer * 0.72 + variant * 0.1;
      const petal = makePetal(layer < 2 ? flower.accent : flower.color, 0.16 * size + layer * 0.018, 0.34 * size + layer * 0.038, 0.08 + layer * 0.012, 0.3);
      petal.position.set(Math.cos(angle) * radius, 0.01 * layer, Math.sin(angle) * radius);
      petal.rotation.set(1.05 - layer * 0.12, 0.14 * Math.sin(angle), angle - Math.PI / 2);
      group.add(petal);
    }
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.08 * size, 18, 14), material(flower.accent, 0.58));
  core.scale.set(0.86, 1.08, 0.86);
  core.castShadow = true;
  group.add(core);
  return group;
}

function makeTulip(flower, size, variant) {
  const group = new THREE.Group();
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2 + variant * 0.08;
    const petal = makePetal(i % 2 ? flower.accent : flower.color, 0.24 * size, 0.62 * size, 0.16, 0.38);
    petal.position.set(Math.cos(angle) * 0.11 * size, 0.02, Math.sin(angle) * 0.11 * size);
    petal.rotation.set(0.42, Math.sin(angle) * 0.24, angle - Math.PI / 2);
    group.add(petal);
  }
  group.scale.set(1, 1.08, 1);
  return group;
}

function makePeony(flower, size, variant) {
  const group = new THREE.Group();
  for (let layer = 0; layer < 4; layer += 1) {
    const petals = 9 + layer * 4;
    for (let i = 0; i < petals; i += 1) {
      const angle = (i / petals) * Math.PI * 2 + layer * 0.4;
      const loose = Math.sin(i * 1.9 + variant) * 0.045;
      const petal = makePetal(i % 4 === 0 ? flower.accent : flower.color, 0.2 * size + layer * 0.018, 0.42 * size + layer * 0.035, 0.12, 0.18);
      petal.position.set(Math.cos(angle) * (0.07 + layer * 0.04 + loose) * size, Math.sin(layer) * 0.02, Math.sin(angle) * (0.07 + layer * 0.04) * size);
      petal.rotation.set(0.78 - layer * 0.08 + loose, loose, angle - Math.PI / 2);
      group.add(petal);
    }
  }
  return group;
}

function makeLily(flower, size, variant) {
  const group = new THREE.Group();
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2 + variant * 0.06;
    const petal = makePetal(i % 2 ? flower.color : "#fff9e8", 0.22 * size, 0.72 * size, 0.1, 0.08);
    petal.position.set(Math.cos(angle) * 0.08 * size, 0, Math.sin(angle) * 0.08 * size);
    petal.rotation.set(0.95, Math.sin(angle) * 0.22, angle - Math.PI / 2);
    group.add(petal);
  }
  addStamen(group, 6, 0.04 * size, 0.38 * size, flower.accent);
  return group;
}

function makeDaisy(flower, size, variant) {
  const group = new THREE.Group();
  for (let i = 0; i < 26; i += 1) {
    const angle = (i / 26) * Math.PI * 2 + variant * 0.05;
    const petal = makePetal(flower.color, 0.08 * size, 0.42 * size, 0.045, 0.08);
    petal.position.set(Math.cos(angle) * 0.18 * size, 0, Math.sin(angle) * 0.18 * size);
    petal.rotation.set(1.24, 0, angle - Math.PI / 2);
    group.add(petal);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.13 * size, 22, 14), material(flower.accent, 0.5));
  core.scale.set(1, 0.42, 1);
  core.rotation.x = Math.PI / 2;
  core.castShadow = true;
  group.add(core);
  return group;
}

function makeIris(flower, size, variant) {
  const group = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const angle = (i / 3) * Math.PI * 2 + variant * 0.08;
    const upright = makePetal(flower.accent, 0.24 * size, 0.58 * size, 0.12, 0.15);
    upright.position.set(Math.cos(angle) * 0.07 * size, 0.04, Math.sin(angle) * 0.07 * size);
    upright.rotation.set(0.34, Math.sin(angle) * 0.36, angle - Math.PI / 2);
    group.add(upright);

    const fall = makePetal(flower.color, 0.3 * size, 0.54 * size, 0.09, 0.12);
    fall.position.set(Math.cos(angle + Math.PI / 3) * 0.13 * size, -0.02, Math.sin(angle + Math.PI / 3) * 0.13 * size);
    fall.rotation.set(1.28, Math.sin(angle) * 0.16, angle - Math.PI / 2);
    group.add(fall);
  }
  addStamen(group, 3, 0.025 * size, 0.24 * size, "#f0c85a");
  return group;
}

function makeBloom(flower, size, variant) {
  const makers = {
    rose: makeRose,
    tulip: makeTulip,
    peony: makePeony,
    lily: makeLily,
    daisy: makeDaisy,
    iris: makeIris
  };
  return (makers[flower.id] || makeRose)(flower, size, variant);
}

function makeBud(flower, size = 1) {
  const bud = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.12 * size, 18, 14), material(flower.color, 0.62));
  body.scale.set(0.82, 1.28, 0.82);
  body.castShadow = true;
  bud.add(body);

  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2;
    const sepal = makePetal("#477b5a", 0.055 * size, 0.2 * size, 0.02, 0.05);
    sepal.position.set(Math.cos(angle) * 0.07 * size, -0.11 * size, Math.sin(angle) * 0.07 * size);
    sepal.rotation.set(1.12, 0, angle - Math.PI / 2);
    bud.add(sepal);
  }
  return bud;
}

function makeLeaf(size, angle, color = "#477b5a", shape = "oval") {
  const geometry = makePetalGeometry(0.16 * size, 0.76 * size, 0.055, 0.06);
  if (shape === "fern") geometry.scale(0.62, 1.16, 1);
  if (shape === "ruscus") geometry.scale(1.18, 0.84, 1);
  const leaf = new THREE.Mesh(geometry, material(color, 0.86));
  leaf.rotation.z = angle;
  leaf.rotation.x = 1.1;
  leaf.castShadow = true;
  return leaf;
}

function makeNodeLeaf(size, side, lift = 0) {
  const leaf = makeLeaf(size, side > 0 ? -0.22 : 0.22);
  leaf.rotation.y = side > 0 ? -0.72 : 0.72;
  leaf.rotation.z = side > 0 ? -0.6 : 0.6;
  leaf.position.y = lift;
  return leaf;
}

function makeBranchlet(flower, start, end, scale, variant) {
  const group = new THREE.Group();
  const mid = start.clone().lerp(end, 0.55);
  mid.x += Math.sin(variant) * 0.08;
  const { stem } = makeCurvedStem([start, mid, end], 0.01 * scale, "#477b5a");
  group.add(stem);
  const bud = flower.role === "filler" ? makeBloom(flower, 0.38 * scale, variant) : makeBud(flower, 0.74 * scale);
  bud.position.copy(end);
  bud.rotation.set(0.5, variant, Math.sin(variant) * 0.2);
  group.add(bud);
  return group;
}

function makeCutFlowerStem(flower, stemPlan, index) {
  const group = new THREE.Group();
  const base = new THREE.Vector3(stemPlan.baseX, -1.78, stemPlan.baseZ);
  const shoulder = new THREE.Vector3(stemPlan.x * 0.22, -0.2 + stemPlan.lift * 0.22, stemPlan.z * 0.14);
  const neck = new THREE.Vector3(stemPlan.x * 0.64, stemPlan.y - 0.42, stemPlan.z * 0.62);
  const tip = new THREE.Vector3(stemPlan.x, stemPlan.y, stemPlan.z);
  const bend = flower.role === "mass" ? 0.22 : flower.role === "line" ? 0.13 : 0.08;

  shoulder.x += Math.sin(index * 1.7) * bend;
  neck.z += Math.cos(index * 1.3) * bend * 0.7;
  const { stem } = makeCurvedStem([base, shoulder, neck, tip], stemPlan.radius, "#3f7550");
  group.add(stem);

  const headScale = stemPlan.headScale * (flower.role === "focal" ? 1.16 : flower.role === "filler" ? 0.7 : 0.92);
  const bloom = makeBloom(flower, headScale, stemPlan.angle);
  bloom.position.copy(tip);
  bloom.rotation.set(stemPlan.pitch, stemPlan.angle + Math.PI, stemPlan.roll);
  group.add(bloom);

  const leafSlots = flower.role === "line" ? [0.32, 0.54, 0.72] : flower.role === "focal" ? [0.35, 0.58] : [0.42];
  leafSlots.forEach((slot, leafIndex) => {
    const point = base.clone().lerp(tip, slot);
    const leaf = makeNodeLeaf(0.72 + leafIndex * 0.12, leafIndex % 2 === 0 ? 1 : -1, 0);
    leaf.position.copy(point);
    leaf.rotation.y += stemPlan.angle;
    group.add(leaf);
  });

  if (flower.role === "filler") {
    for (let i = 0; i < 3; i += 1) {
      const start = base.clone().lerp(tip, 0.48 + i * 0.12);
      const side = i % 2 === 0 ? 1 : -1;
      const end = start.clone().add(new THREE.Vector3(side * (0.22 + i * 0.06), 0.34 + i * 0.08, Math.sin(index + i) * 0.18));
      group.add(makeBranchlet(flower, start, end, 0.8, index + i * 0.9));
    }
  } else if (flower.role === "line") {
    const start = base.clone().lerp(tip, 0.62);
    const end = start.clone().add(new THREE.Vector3(Math.cos(stemPlan.angle) * 0.22, 0.42, Math.sin(stemPlan.angle) * 0.2));
    group.add(makeBranchlet(flower, start, end, 0.72, index));
  }

  return group;
}

function getSelectedFlowers() {
  const selectedIds = new Set([
    ...state.selected.main,
    ...state.selected.secondary,
    ...state.selected.filler
  ]);
  return flowers.filter((flower) => selectedIds.has(flower.id));
}

function getSelectedFoliage() {
  return foliageOptions.filter((leaf) => state.selected.foliage.has(leaf.id));
}

function getWrap() {
  return wrapOptions.find((wrap) => wrap.id === state.wrap) || wrapOptions[0];
}

function rebuildBouquet() {
  bouquetGroup.clear();
  const chosen = getSelectedFlowers();
  const count = state.density;
  const spread = THREE.MathUtils.mapLinear(state.spread, 20, 92, 0.5, 1.75);
  const heightVariance = THREE.MathUtils.mapLinear(state.height, 0, 100, 0.05, 0.72);
  const leafCount = Math.round(THREE.MathUtils.mapLinear(state.leaves, 0, 100, 4, 22));
  const selectedFoliage = getSelectedFoliage();

  for (let i = 0; i < count; i += 1) {
    const focal = chosen.filter((flower) => flower.role === "focal");
    const line = chosen.filter((flower) => flower.role === "line");
    const filler = chosen.filter((flower) => flower.role === "filler");
    const mass = chosen.filter((flower) => flower.role === "mass");
    const pool = i % 7 === 0 && line.length ? line : i % 5 === 0 && filler.length ? filler : i % 3 === 0 && mass.length ? mass : focal.length ? focal : chosen;
    const flower = pool[i % pool.length];
    const angle = i * 2.399 + (state.height * 0.01);
    const ringBias = flower.role === "focal" ? 0.5 : flower.role === "line" ? 1.05 : flower.role === "filler" ? 1.18 : 0.78;
    const ring = Math.sqrt((i + 1) / count) * spread * ringBias;
    const x = Math.cos(angle) * ring;
    const z = Math.sin(angle) * ring * 0.52;
    const roleHeight = flower.role === "line" ? 0.62 : flower.role === "filler" ? 0.18 : flower.role === "focal" ? -0.06 : 0.08;
    const topY = 1.75 + roleHeight + Math.sin(i * 1.7) * heightVariance + (i % 3) * 0.06;
    const stemPlan = {
      x,
      y: topY,
      z,
      lift: roleHeight,
      angle,
      baseX: Math.cos(angle + Math.PI) * 0.18,
      baseZ: Math.sin(angle + Math.PI) * 0.08,
      radius: flower.role === "focal" ? 0.022 : 0.016,
      headScale: 0.78 + (i % 5) * 0.045,
      pitch: flower.role === "line" ? 0.54 : 0.34 + z * 0.04,
      roll: -x * 0.08
    };
    bouquetGroup.add(makeCutFlowerStem(flower, stemPlan, i));
  }

  for (let i = 0; i < leafCount; i += 1) {
    const foliage = selectedFoliage[i % Math.max(selectedFoliage.length, 1)] || foliageOptions[0];
    const angle = i * 1.618;
    const leaf = makeLeaf(1.2 + (i % 4) * 0.16, angle, foliage.color, foliage.id === "fern" ? "fern" : foliage.id === "ruscus" ? "ruscus" : "oval");
    leaf.position.set(Math.cos(angle) * 0.92, -0.92 + (i % 5) * 0.22, Math.sin(angle) * 0.42);
    leaf.rotation.y = angle;
    bouquetGroup.add(leaf);
  }

  const wrapStyle = getWrap();
  const wrap = new THREE.Mesh(
    new THREE.ConeGeometry(0.92, 1.28, 5, 1, true),
    new THREE.MeshStandardMaterial({
      color: wrapStyle.color,
      roughness: 0.92,
      metalness: 0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.86
    })
  );
  wrap.position.y = -1.28;
  wrap.rotation.y = Math.PI / 5;
  wrap.castShadow = true;
  bouquetGroup.add(wrap);

  const ribbon = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.035, 8, 48),
    material(state.occasion === "proposal" ? "#8a203a" : wrapStyle.ribbon, 0.52)
  );
  ribbon.position.y = -0.74;
  ribbon.rotation.x = Math.PI / 2;
  bouquetGroup.add(ribbon);
}

function updateUI() {
  document.querySelectorAll(".flower-chip").forEach((button) => {
    button.classList.toggle("active", state.selected[button.dataset.category].has(button.dataset.item));
  });
  document.querySelectorAll(".wrap-chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.wrap === state.wrap);
  });
  document.querySelectorAll("#occasionTabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.occasion === state.occasion);
  });

  const occasion = occasions[state.occasion];
  const wrap = getWrap();
  const mainNames = flowers.filter((flower) => state.selected.main.has(flower.id)).map((flower) => flower.name);
  const secondaryNames = flowers.filter((flower) => state.selected.secondary.has(flower.id)).map((flower) => flower.name);
  const fillerNames = flowers.filter((flower) => state.selected.filler.has(flower.id)).map((flower) => flower.name);
  const foliageNames = getSelectedFoliage().map((leaf) => leaf.name);
  titleEl.textContent = state.uploadTone ? "照片灵感定制花束" : occasion.title;
  moodLabel.textContent = occasion.mood;
  stemCount.textContent = `${state.density} 枝`;
  heroFlower.textContent = mainNames.join(" · ") || "请选择主花";
  paletteText.textContent = state.uploadTone || occasion.palette;
  budgetText.textContent = `${wrap.name} · ${occasion.budget}`;
  aiModeText.textContent = `本地模拟规划 · ${secondaryNames.length + fillerNames.length + foliageNames.length} 类辅材`;
  wrapLabel.textContent = wrap.name;
}

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / Math.max(rect.height, 1);
  camera.updateProjectionMatrix();
}

function animate() {
  bouquetGroup.rotation.y += 0.003;
  bouquetGroup.rotation.x = Math.sin(Date.now() * 0.0008) * 0.025;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function simulatePlanning() {
  renderBadge.textContent = "florist arranging";
  setTimeout(() => {
    renderBadge.textContent = "spiral bouquet ready";
  }, 720);
}

function randomize() {
  state.density = Math.round(THREE.MathUtils.randInt(12, 28));
  state.height = Math.round(THREE.MathUtils.randInt(26, 88));
  state.spread = Math.round(THREE.MathUtils.randInt(34, 86));
  state.leaves = Math.round(THREE.MathUtils.randInt(18, 84));
  flowers.forEach((flower) => {
    const bucket = state.selected[flower.category];
    if (Math.random() > 0.5) bucket.add(flower.id);
    else if (bucket.size > (flower.category === "main" ? 1 : 0)) bucket.delete(flower.id);
  });
  foliageOptions.forEach((leaf) => {
    if (Math.random() > 0.42) state.selected.foliage.add(leaf.id);
    else if (state.selected.foliage.size > 1) state.selected.foliage.delete(leaf.id);
  });
  state.wrap = wrapOptions[THREE.MathUtils.randInt(0, wrapOptions.length - 1)].id;
  syncControls();
  updateUI();
  rebuildBouquet();
  simulatePlanning();
}

function syncControls() {
  document.querySelector("#densityRange").value = state.density;
  document.querySelector("#heightRange").value = state.height;
  document.querySelector("#spreadRange").value = state.spread;
  document.querySelector("#leafRange").value = state.leaves;
}

function bindControls() {
  [
    ["densityRange", "density"],
    ["heightRange", "height"],
    ["spreadRange", "spread"],
    ["leafRange", "leaves"]
  ].forEach(([id, key]) => {
    document.querySelector(`#${id}`).addEventListener("input", (event) => {
      state[key] = Number(event.target.value);
      updateUI();
      rebuildBouquet();
    });
  });

  document.querySelector("#occasionTabs").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.occasion = button.dataset.occasion;
    updateUI();
    rebuildBouquet();
  });

  document.querySelector("#generateBtn").addEventListener("click", () => {
    simulatePlanning();
    randomize();
  });

  document.querySelector("#randomizeBtn").addEventListener("click", randomize);

  document.querySelector("#exportBtn").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "ai-florist-render.png";
    link.href = renderer.domElement.toDataURL("image/png");
    link.click();
  });

  document.querySelector("#flowerUpload").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    document.querySelector("#uploadPreview").style.backgroundImage = `url(${previewUrl})`;
    document.querySelector("#uploadLabel").textContent = file.name;
    state.uploadTone = "参考照片色调 / 模拟提取 / 待接真实视觉 API";
    state.selected.main.add("peony");
    state.selected.secondary.add("iris");
    state.selected.foliage.add("eucalyptus");
    updateUI();
    rebuildBouquet();
    simulatePlanning();
  });
}

createFlowerButtons();
bindControls();
syncControls();
updateUI();
rebuildBouquet();
resize();
animate();
window.addEventListener("resize", resize);
