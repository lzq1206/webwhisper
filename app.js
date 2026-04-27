const STORAGE_KEY = "webwhisper_demo_posts_v1";
const SETTINGS_KEY = "webwhisper_demo_settings_v1";
const MAX_RENDER = 80;

const defaults = {
  exploration: 55,
  rigor: 70,
  timeline: 45,
  minScore: 35,
  hideImages: false,
  autoRegulation: true,
  targetDiversity: 60
};

const majors = [
  "经济学", "天体物理", "软件工程", "艺术史", "历史学", "认知科学", "计算机图形学", "社会学", "材料科学", "法学", "心理学", "生物信息学"
];

const textPool = [
  "对比三组实验后，发现策略切换成本下降明显。",
  "今天复盘了数据漂移问题，发现凌晨时段波动最大。",
  "新版本上线后，用户停留时长和评论率同步上升。",
  "把模型解释层打开后，能够清楚看到权重变化路径。",
  "跨学科协作让选题更有意思，也更难做取舍。",
  "这个结果有点反直觉，但多次复现实验后稳定存在。",
  "我把流程拆分成四段后，整体效率提高了约 30%。",
  "短周期验证阶段建议先看增量，而不是只看绝对值。",
  "对照历史样本后，异常点更像是结构变化而非噪声。",
  "这条结论还需要更多样本补充，先记录为阶段性观察。"
];

const demoImages = [
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=60"
];

const feedList = document.getElementById("feedList");
const form = document.getElementById("postForm");
const formMessage = document.getElementById("formMessage");
const seedBtn = document.getElementById("seedBtn");
const resetBtn = document.getElementById("resetBtn");

const controls = {
  exploration: document.getElementById("exploration"),
  rigor: document.getElementById("rigor"),
  timeline: document.getElementById("timeline"),
  minScore: document.getElementById("minScore"),
  hideImages: document.getElementById("hideImages"),
  autoRegulation: document.getElementById("autoRegulation"),
  targetDiversity: document.getElementById("targetDiversity")
};

const values = {
  exploration: document.getElementById("explorationValue"),
  rigor: document.getElementById("rigorValue"),
  timeline: document.getElementById("timelineValue"),
  minScore: document.getElementById("minScoreValue"),
  targetDiversity: document.getElementById("targetDiversityValue")
};

const stats = {
  total: document.getElementById("statTotal"),
  shown: document.getElementById("statShown"),
  diversity: document.getElementById("statDiversity"),
  imageRatio: document.getElementById("statImageRatio")
};

let posts = [];
let settings = { ...defaults };

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(num) {
  return Math.max(0, Math.min(100, num));
}

function safeImageUrl(url) {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("data:image/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "";
}

function relativeTime(timestamp) {
  const diffMins = Math.max(1, Math.floor((Date.now() - timestamp) / 6e4));
  if (diffMins < 60) return `${diffMins} 分钟前`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaults };
    const data = JSON.parse(raw);
    return {
      exploration: clamp(Number(data.exploration ?? defaults.exploration)),
      rigor: clamp(Number(data.rigor ?? defaults.rigor)),
      timeline: clamp(Number(data.timeline ?? defaults.timeline)),
      minScore: clamp(Number(data.minScore ?? defaults.minScore)),
      hideImages: Boolean(data.hideImages),
      autoRegulation: data.autoRegulation !== false,
      targetDiversity: clamp(Number(data.targetDiversity ?? defaults.targetDiversity))
    };
  } catch {
    return { ...defaults };
  }
}

function persistSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function generateDemoPosts(count = 1000) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const major = majors[randomInt(0, majors.length - 1)];
    const summary = textPool[randomInt(0, textPool.length - 1)];
    const exploration = randomInt(5, 98);
    const rigor = randomInt(8, 97);
    const hasImage = Math.random() < 0.33;
    return {
      id: `demo-${now}-${i}`,
      author: `虚拟用户${i + 1}`,
      major,
      text: `${major}｜${summary}`,
      image: hasImage ? demoImages[randomInt(0, demoImages.length - 1)] : "",
      exploration,
      rigor,
      likes: randomInt(0, 300),
      createdAt: now - randomInt(3 * 60 * 1000, 14 * 24 * 60 * 60 * 1000),
      source: "demo"
    };
  });
}

function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return generateDemoPosts();
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return generateDemoPosts();
    return data;
  } catch {
    return generateDemoPosts();
  }
}

function persistPosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function uiState() {
  return {
    exploration: Number(controls.exploration.value),
    rigor: Number(controls.rigor.value),
    timeline: Number(controls.timeline.value),
    minScore: Number(controls.minScore.value),
    hideImages: controls.hideImages.checked,
    autoRegulation: controls.autoRegulation.checked,
    targetDiversity: Number(controls.targetDiversity.value)
  };
}

function scorePost(post, state, majorCounts) {
  const matchExploration = 100 - Math.abs(post.exploration - state.exploration);
  const matchRigor = 100 - Math.abs(post.rigor - state.rigor);
  const quality = matchExploration * 0.45 + matchRigor * 0.55;

  const hours = (Date.now() - post.createdAt) / 36e5;
  const fresh = clamp(100 - hours * 2.2);
  const engagement = clamp(post.likes / 3);

  const timelineWeight = state.timeline / 100;
  let score = fresh * timelineWeight + quality * (1 - timelineWeight) + engagement * 0.12;

  if (state.autoRegulation) {
    const currentMajorCount = majorCounts.get(post.major) || 1;
    const avg = posts.length / majors.length;
    const diversityBoost = clamp((avg / currentMajorCount) * state.targetDiversity * 0.15);
    score += diversityBoost;
  }

  return clamp(score);
}

function diversityIndex(list) {
  if (!list.length) return 0;
  const counts = new Map();
  for (const item of list) {
    counts.set(item.major, (counts.get(item.major) || 0) + 1);
  }
  const values = [...counts.values()];
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === 0) return 0;
  return Math.round((1 - (max - min) / max) * 100);
}

function clearFeed() {
  while (feedList.firstChild) {
    feedList.removeChild(feedList.firstChild);
  }
}

function renderFeed() {
  const state = uiState();
  settings = { ...state };
  persistSettings();

  const majorCounts = new Map();
  for (const post of posts) {
    majorCounts.set(post.major, (majorCounts.get(post.major) || 0) + 1);
  }

  const ranked = posts
    .map(post => ({ ...post, score: scorePost(post, state, majorCounts) }))
    .filter(post => post.score >= state.minScore)
    .filter(post => !state.hideImages || !post.image)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RENDER);

  clearFeed();

  for (const post of ranked) {
    const item = document.createElement("li");
    item.className = "feed-item";

    const head = document.createElement("div");
    head.className = "feed-head";
    const author = document.createElement("strong");
    author.textContent = `${post.author} · ${post.major}`;
    const time = document.createElement("span");
    time.textContent = relativeTime(post.createdAt);
    head.append(author, time);

    const text = document.createElement("p");
    text.className = "feed-text";
    text.textContent = post.text;

    item.appendChild(head);
    item.appendChild(text);

    if (post.image) {
      const image = document.createElement("img");
      image.className = "feed-image";
      image.src = post.image;
      image.alt = "用户发布图片";
      image.loading = "lazy";
      item.appendChild(image);
    }

    const tags = document.createElement("div");
    tags.className = "feed-tags";

    const tagScore = document.createElement("span");
    tagScore.textContent = `匹配:${post.score.toFixed(1)}`;
    const tagExplore = document.createElement("span");
    tagExplore.textContent = `探索:${post.exploration}`;
    const tagRigor = document.createElement("span");
    tagRigor.textContent = `严谨:${post.rigor}`;
    const tagSource = document.createElement("span");
    tagSource.textContent = post.source === "user" ? "匿名实发" : "虚拟样本";

    tags.append(tagScore, tagExplore, tagRigor, tagSource);
    item.appendChild(tags);
    feedList.appendChild(item);
  }

  const imagePosts = ranked.filter(post => Boolean(post.image)).length;
  stats.total.textContent = String(posts.length);
  stats.shown.textContent = String(ranked.length);
  stats.diversity.textContent = String(diversityIndex(ranked));
  stats.imageRatio.textContent = `${ranked.length ? Math.round((imagePosts / ranked.length) * 100) : 0}%`;
}

function syncControlUI() {
  values.exploration.textContent = controls.exploration.value;
  values.rigor.textContent = controls.rigor.value;
  values.timeline.textContent = controls.timeline.value;
  values.minScore.textContent = controls.minScore.value;
  values.targetDiversity.textContent = controls.targetDiversity.value;
}

function applySettingsToUI() {
  controls.exploration.value = String(settings.exploration);
  controls.rigor.value = String(settings.rigor);
  controls.timeline.value = String(settings.timeline);
  controls.minScore.value = String(settings.minScore);
  controls.hideImages.checked = Boolean(settings.hideImages);
  controls.autoRegulation.checked = Boolean(settings.autoRegulation);
  controls.targetDiversity.value = String(settings.targetDiversity);
  syncControlUI();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

async function handleSubmit(event) {
  event.preventDefault();
  formMessage.classList.remove("error");
  formMessage.textContent = "";

  const author = (document.getElementById("author").value || "").trim() || "匿名用户";
  const text = (document.getElementById("textContent").value || "").trim();
  const urlInput = (document.getElementById("imageUrl").value || "").trim();
  const imageFile = document.getElementById("imageFile").files[0];

  if (!text && !urlInput && !imageFile) {
    formMessage.classList.add("error");
    formMessage.textContent = "请至少输入文字或上传/填写图片。";
    return;
  }

  let image = safeImageUrl(urlInput);
  if (urlInput && !image) {
    formMessage.classList.add("error");
    formMessage.textContent = "图片地址仅支持 http/https 或 data:image。";
    return;
  }

  if (imageFile) {
    if (!imageFile.type.startsWith("image/")) {
      formMessage.classList.add("error");
      formMessage.textContent = "上传文件必须为图片类型。";
      return;
    }
    if (imageFile.size > 4 * 1024 * 1024) {
      formMessage.classList.add("error");
      formMessage.textContent = "图片请小于 4MB。";
      return;
    }
    try {
      image = await readFileAsDataUrl(imageFile);
    } catch {
      formMessage.classList.add("error");
      formMessage.textContent = "图片读取失败，请重试。";
      return;
    }
  }

  posts.unshift({
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author,
    major: "用户发布",
    text: text || "[仅图片帖子]",
    image,
    exploration: randomInt(20, 100),
    rigor: randomInt(20, 100),
    likes: randomInt(0, 10),
    createdAt: Date.now(),
    source: "user"
  });

  persistPosts();
  form.reset();
  syncControlUI();
  renderFeed();
  formMessage.textContent = "发布成功（无需注册）。";
}

function seedDemoPosts() {
  posts = generateDemoPosts();
  persistPosts();
  renderFeed();
}

function resetControls() {
  settings = { ...defaults };
  applySettingsToUI();
  persistSettings();
  renderFeed();
}

for (const [key, element] of Object.entries(controls)) {
  const eventName = element.type === "checkbox" ? "change" : "input";
  element.addEventListener(eventName, () => {
    if (values[key]) values[key].textContent = element.value;
    renderFeed();
  });
}

form.addEventListener("submit", handleSubmit);
seedBtn.addEventListener("click", seedDemoPosts);
resetBtn.addEventListener("click", resetControls);

settings = loadSettings();
posts = loadPosts();
if (posts.length < 1000) {
  posts = [...generateDemoPosts(1000 - posts.length), ...posts];
  persistPosts();
}
applySettingsToUI();
renderFeed();
