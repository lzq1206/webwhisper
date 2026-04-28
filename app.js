/* ============================================================
   WebWhisper app.js
   - 1000 demo posts across 12 categories
   - Anonymous posting (text + image)
   - Algorithm-scored feed with live admin controls
   - Like / reaction persisted per post
   - Category filter tabs
   - Per-category bar chart in admin stats
   - Load-more pagination
   - Mobile admin-panel toggle
   ============================================================ */

const STORAGE_KEY          = "webwhisper_demo_posts_v2";
const SETTINGS_KEY         = "webwhisper_demo_settings_v2";
const LIKES_KEY            = "webwhisper_demo_likes_v2";
const PAGE_SIZE            = 25;
const DEMO_POST_COUNT      = 1000;
const MIN_POST_AGE_MS      = 5 * 60 * 1000;
const MAX_POST_AGE_MS      = 14 * 24 * 60 * 60 * 1000;
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const DIVERSITY_BOOST      = 0.15;

const defaults = {
  exploration: 55, rigor: 70, timeline: 45,
  minScore: 35, hideImages: false, autoRegulation: true, targetDiversity: 60
};

const majors = [
  "经济学", "天体物理", "软件工程", "艺术史", "历史学",
  "认知科学", "计算机图形学", "社会学", "材料科学", "法学", "心理学", "生物信息学"
];

const authorNames = [
  "星尘探索者", "深渊观察员", "迷路的算法", "凌晨三点半", "思绪漫游者",
  "数据苦行僧", "概念收集人", "边界测试者", "逻辑拼图匠", "灰色地带人",
  "量子跳跃者", "不确定原则", "熵增守望者", "信息茧房破壁人", "理性乐观派",
  "结构主义者", "跨界蝴蝶", "认知边缘人", "随机游走客", "模型审计官"
];

const textsByMajor = {
  "经济学": [
    "用 DID 模型复盘平台补贴退坡后城市打车供给，弹性区间出现明显分层。",
    "对比五个季度的消费者信心数据，发现预期修复滞后于实际就业约六周。",
    "通货膨胀预期的黏性在低收入群体中显著高于高收入群体，这值得政策关注。",
    "拍卖理论在数字广告位竞价上的实证应用：赢家诅咒真的存在。",
    "货币政策的预期管理效应越来越强，前瞻指引已成为独立工具。",
    "制度经济学视角：产权界定的模糊性如何抑制了农村土地的最优配置。"
  ],
  "天体物理": [
    "新一轮系外行星凌日曲线显示大气中可能有钠吸收峰，后续需高分辨率验证。",
    "JWST 新数据显示某星系团的暗物质分布与模拟结果存在 2σ 的偏差。",
    "脉冲星计时阵列的最新结果：纳赫兹引力波背景的信号越来越显著。",
    "恒星形成区的湍流磁场结构比以往预测的更加复杂和各向异性。",
    "快速射电暴的起源讨论仍未定论，多源机制模型正在获得更多支持。",
    "宇宙再电离时期的氢 21cm 信号探测：数据降噪依然是最大挑战。"
  ],
  "软件工程": [
    "把热路径上的对象分配改成池化后，P99 延迟从 113ms 降到 71ms。",
    "技术债的量化：用圈复杂度结合变更频率，找到了最该重构的三个模块。",
    "单体迁移微服务的第三个月：服务边界切得不好，反而增加了耦合。",
    "异步 I/O 模型下的背压机制实现，防止生产者淹没消费者的关键一步。",
    "语义版本控制的实际执行困境：补丁版本里的破坏性变更是怎么溜进来的。",
    "代码审查效率研究：超过 400 行的 PR 缺陷发现率明显下降。"
  ],
  "艺术史": [
    "文艺复兴湿壁画中的颜料选择与贸易航线中矿物供给波动存在耦合关系。",
    "包豪斯运动的形式语言是如何渗透进当代 UI 设计的？一个谱系追溯。",
    "荷兰黄金时代静物画里的腐败意象：vanitas 传统的符号学解读。",
    "敦煌壁画色彩在千年氧化后的光谱重建研究取得阶段性进展。",
    "抽象表现主义与冷战意识形态：美国文化外交中的现代艺术工具化。",
    "数字化修复使拉斐尔草稿中原本不可见的笔触路径重新浮现。"
  ],
  "历史学": [
    "比较三份地方志后发现，灾荒叙事在不同政区呈现出制度性删改模式。",
    "明代商人网络的地理扩散：徽商的宗族联结如何支撑了长途贸易信任。",
    "中世纪瘟疫对劳动力稀缺性的影响——农奴制松动的经济学解释。",
    "冷战期间秘密文件解密后对战争起源叙事的修正效应。",
    "印刷术传播与宗教改革速度之间存在显著的地区相关性。",
    "殖民档案的缺失本身就是一种历史证据：沉默的政治学。"
  ],
  "认知科学": [
    "工作记忆实验中加入噪声提示后，受试者策略切换成本显著下降。",
    "预测编码框架下的感知：大脑在更新预期时的误差信号有多精确？",
    "双语者在情绪性决策场景下的激活模式与单语者存在系统性差异。",
    "睡眠剥夺对元认知准确性的损害比对基础任务的损害更早出现。",
    "具身认知视角：手势的使用对空间推理能力有真实的促进效应。",
    "心流状态下的时间感知压缩：神经机制层面的初步证据。"
  ],
  "计算机图形学": [
    "针对体渲染做了分层采样，视觉损失可控但渲染预算节省约 31%。",
    "基于神经辐射场的动态场景重建：时间一致性仍是主要瓶颈。",
    "实时全局光照的屏幕空间近似在复杂几何体下失效的边界条件。",
    "纹理压缩算法在移动端 GPU 的能效比分析：BC7 并非总是最优解。",
    "路径追踪去噪：空间降噪与时间降噪的权衡在动态场景下需要重新校准。",
    "程序化生成地形与手工设计地形在玩家空间认知上的差异测量。"
  ],
  "社会学": [
    "青年社群的「知识炫耀」行为在短视频场景下被强化与模仿。",
    "平台算法推荐如何加速了亚文化社群的内部同质化与外部区隔化。",
    "远程工作三年后的组织文化稀释：仪式感缺失对归属感的量化影响。",
    "城市收缩背景下的社区再生：自下而上的空间重构案例研究。",
    "网络公共事件中的情绪传染速度与信息失真程度正相关。",
    "数字劳动的隐性剥削：内容创作者的商业化焦虑与创作自由的张力。"
  ],
  "材料科学": [
    "二维材料应变调控实验里，电子迁移率在特定角度出现突变。",
    "高熵合金的晶格畸变效应比传统合金更能抑制位错运动。",
    "钙钛矿太阳能电池的界面钝化：缺陷密度降低一个数量级后稳定性如何。",
    "碳纳米管取向阵列在热管理应用中的导热各向异性测量结果。",
    "生物可降解聚合物在海水环境中的降解动力学比淡水中慢得多。",
    "拓扑绝缘体表面态对外部磁场扰动的响应超出了理论预测范围。"
  ],
  "法学": [
    "平台责任的「通知-删除」机制在 AI 生成内容泛滥时面临制度性失效。",
    "数据本地化要求与跨境数据流动自由之间的贸易法张力。",
    "比较法视角：不同法域对算法歧视的规制路径分叉正在加剧。",
    "宪法性权利在私人平台上的可诉性：国家行动理论的扩张与边界。",
    "仲裁条款的大范围使用如何实质性削弱了消费者的集体诉权。",
    "人工智能生成物的著作权归属：创作性标准的重新界定不可回避。"
  ],
  "心理学": [
    "自我消耗实验的可重复性危机：原始效应量被高估了多少？",
    "依恋理论在成人亲密关系中的神经生物学基础研究进展综述。",
    "行为激活疗法对轻中度抑郁的效果量与认知行为疗法基本相当。",
    "确认偏误在专业决策者（法官、医生）中并不比普通人弱。",
    "正念训练降低情绪反应性的效果在六个月后出现明显衰减。",
    "青少年社交媒体使用与睡眠质量的关系：时段比总时长更关键。"
  ],
  "生物信息学": [
    "单细胞转录组数据中的批次效应校正：不同算法在稀有细胞类型上的表现差异。",
    "蛋白质语言模型在突变效应预测上开始接近物理模拟的精度。",
    "基因组组装的 N50 指标被过度强调了，连续性不能代替准确性。",
    "多组学数据整合的降维策略：如何避免信息瓶颈导致的生物学信号丢失。",
    "CRISPR 脱靶效应的全基因组检测：敏感性与假阳性率的权衡依然存在。",
    "宏基因组数据的物种注释准确率在数据库覆盖度低的环境样本中急剧下降。"
  ]
};

const demoImages = [
  "https://images.unsplash.com/photo-1446776899648-aa78eefe8ed0?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=60",
  "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=60"
];

/* ── DOM refs ── */
const feedList      = document.getElementById("feedList");
const form          = document.getElementById("postForm");
const formMessage   = document.getElementById("formMessage");
const seedBtn       = document.getElementById("seedBtn");
const resetBtn      = document.getElementById("resetBtn");
const adminToggle   = document.getElementById("adminToggle");
const adminPanel    = document.getElementById("adminPanel");
const composerToggle= document.getElementById("composerToggle");
const composerBody  = document.getElementById("composerBody");
const filterBar     = document.getElementById("filterBar");
const loadMoreBtn   = document.getElementById("loadMoreBtn");
const categoryChart = document.getElementById("categoryChart");
const textContentEl = document.getElementById("textContent");
const charCount     = document.getElementById("charCount");

const controls = {
  exploration:    document.getElementById("exploration"),
  rigor:          document.getElementById("rigor"),
  timeline:       document.getElementById("timeline"),
  minScore:       document.getElementById("minScore"),
  hideImages:     document.getElementById("hideImages"),
  autoRegulation: document.getElementById("autoRegulation"),
  targetDiversity:document.getElementById("targetDiversity")
};

const valueEls = {
  exploration:    document.getElementById("explorationValue"),
  rigor:          document.getElementById("rigorValue"),
  timeline:       document.getElementById("timelineValue"),
  minScore:       document.getElementById("minScoreValue"),
  targetDiversity:document.getElementById("targetDiversityValue")
};

const statEls = {
  total:      document.getElementById("statTotal"),
  shown:      document.getElementById("statShown"),
  diversity:  document.getElementById("statDiversity"),
  imageRatio: document.getElementById("statImageRatio")
};

/* ── State ── */
let posts    = [];
let settings = { ...defaults };
let likes    = {};
let currentPage   = 1;
let rankedCache   = [];
let activeFilter  = "全部";

/* ── Helpers ── */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function safeImageUrl(url) {
  if (!url) return "";
  const t = url.trim();
  if (t.startsWith("data:image/")) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return "";
}

function relativeTime(ts) {
  const d = Math.max(1, Math.floor((Date.now() - ts) / 6e4));
  if (d < 60) return `${d} 分钟前`;
  const h = Math.floor(d / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}

/* ── Storage ── */
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaults };
    const d = JSON.parse(raw);
    return {
      exploration:    clamp(Number(d.exploration    ?? defaults.exploration)),
      rigor:          clamp(Number(d.rigor          ?? defaults.rigor)),
      timeline:       clamp(Number(d.timeline       ?? defaults.timeline)),
      minScore:       clamp(Number(d.minScore       ?? defaults.minScore)),
      hideImages:     Boolean(d.hideImages),
      autoRegulation: d.autoRegulation !== false,
      targetDiversity:clamp(Number(d.targetDiversity ?? defaults.targetDiversity))
    };
  } catch { return { ...defaults }; }
}

function persistSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadLikes() {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) || "{}");
  } catch { return {}; }
}

function persistLikes() {
  localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
}

function generateDemoPosts(count = DEMO_POST_COUNT) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const major   = majors[randomInt(0, majors.length - 1)];
    const pool    = textsByMajor[major];
    const text    = pool[randomInt(0, pool.length - 1)];
    const hasImg  = Math.random() < 0.28;
    return {
      id:        `demo-${now}-${i}`,
      author:    authorNames[randomInt(0, authorNames.length - 1)],
      major,
      text,
      image:     hasImg ? demoImages[randomInt(0, demoImages.length - 1)] : "",
      exploration: randomInt(5, 98),
      rigor:       randomInt(8, 97),
      likes:       randomInt(0, 350),
      createdAt:   now - randomInt(MIN_POST_AGE_MS, MAX_POST_AGE_MS),
      source:      "demo"
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
  } catch { return generateDemoPosts(); }
}

function persistPosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

/* ── Scoring ── */
function uiState() {
  return {
    exploration:    Number(controls.exploration.value),
    rigor:          Number(controls.rigor.value),
    timeline:       Number(controls.timeline.value),
    minScore:       Number(controls.minScore.value),
    hideImages:     controls.hideImages.checked,
    autoRegulation: controls.autoRegulation.checked,
    targetDiversity:Number(controls.targetDiversity.value)
  };
}

function scorePost(post, state, majorCounts) {
  const me = 100 - Math.abs(post.exploration - state.exploration);
  const mr = 100 - Math.abs(post.rigor       - state.rigor);
  const quality = me * 0.45 + mr * 0.55;

  const hours   = (Date.now() - post.createdAt) / 36e5;
  const fresh   = clamp(100 - hours * 2.0);
  const engage  = clamp((post.likes + (likes[post.id] ? 5 : 0)) / 3.5);

  const tw = state.timeline / 100;
  let score = fresh * tw + quality * (1 - tw) + engage * 0.1;

  if (state.autoRegulation) {
    const cnt = majorCounts.get(post.major) || 1;
    const avg = posts.length / majors.length;
    const boost = clamp((avg / cnt) * state.targetDiversity * DIVERSITY_BOOST);
    score += boost;
  }
  return clamp(score);
}

/* ── Diversity metric ── */
function diversityIndex(list) {
  if (!list.length) return 0;
  const cnts = new Map();
  for (const p of list) cnts.set(p.major, (cnts.get(p.major) || 0) + 1);
  const vals = [...cnts.values()];
  const mx = Math.max(...vals), mn = Math.min(...vals);
  return mx === 0 ? 0 : Math.round((1 - (mx - mn) / mx) * 100);
}

/* ── Category chart ── */
function renderChart(list) {
  categoryChart.innerHTML = "";
  if (!list.length) return;
  const cnts = new Map();
  for (const p of list) cnts.set(p.major, (cnts.get(p.major) || 0) + 1);
  const entries = [...cnts.entries()].sort((a, b) => b[1] - a[1]);
  const max = entries[0][1];

  for (const [label, count] of entries) {
    const row = document.createElement("div");
    row.className = "chart-row";

    const lbl = document.createElement("span");
    lbl.className = "chart-label";
    lbl.textContent = label;
    lbl.title = label;

    const track = document.createElement("div");
    track.className = "chart-track";
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.width = `${Math.round((count / max) * 100)}%`;
    track.appendChild(bar);

    const cnt = document.createElement("span");
    cnt.className = "chart-count";
    cnt.textContent = String(count);

    row.append(lbl, track, cnt);
    categoryChart.appendChild(row);
  }
}

/* ── Filter bar ── */
function buildFilterBar() {
  filterBar.innerHTML = "";
  const categories = ["全部", ...majors, "用户发布"];

  for (const cat of categories) {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (cat === activeFilter ? " active" : "");
    btn.textContent = cat;
    btn.type = "button";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", String(cat === activeFilter));
    btn.addEventListener("click", () => {
      activeFilter = cat;
      currentPage = 1;
      buildFilterBar();
      renderFeed();
    });
    filterBar.appendChild(btn);
  }
}

/* ── Feed rendering ── */
function createPostEl(post) {
  const item = document.createElement("li");
  item.className = "feed-item" + (post.source === "user" ? " user-post" : "");

  /* Head */
  const head = document.createElement("div");
  head.className = "feed-head";

  const authorBlock = document.createElement("div");
  const aName = document.createElement("div");
  aName.className = "feed-author";
  aName.textContent = post.author;
  const aMajor = document.createElement("div");
  aMajor.className = "feed-major";
  aMajor.textContent = post.major;
  authorBlock.append(aName, aMajor);

  const timeEl = document.createElement("span");
  timeEl.className = "feed-time";
  timeEl.textContent = relativeTime(post.createdAt);

  head.append(authorBlock, timeEl);
  item.appendChild(head);

  /* Text */
  const textEl = document.createElement("p");
  textEl.className = "feed-text";
  textEl.textContent = post.text;
  item.appendChild(textEl);

  /* Image */
  if (post.image) {
    const img = document.createElement("img");
    img.className = "feed-image";
    img.src = post.image;
    img.alt = "帖子图片";
    img.loading = "lazy";
    item.appendChild(img);
  }

  /* Footer: tags + like */
  const footer = document.createElement("div");
  footer.className = "feed-footer";

  const tags = document.createElement("div");
  tags.className = "feed-tags";

  const mkTag = (t) => {
    const s = document.createElement("span");
    s.textContent = t;
    tags.appendChild(s);
  };
  mkTag(`匹配 ${post.score.toFixed(1)}`);
  mkTag(`探索 ${post.exploration}`);
  mkTag(`严谨 ${post.rigor}`);
  if (post.source === "user") mkTag("匿名实发");

  /* Like button */
  const isLiked = Boolean(likes[post.id]);
  const likeBtn = document.createElement("button");
  likeBtn.className = "like-btn" + (isLiked ? " liked" : "");
  likeBtn.type = "button";
  likeBtn.setAttribute("aria-label", "点赞");
  likeBtn.innerHTML = `${isLiked ? "♥" : "♡"} <span>${post.likes + (isLiked ? 1 : 0)}</span>`;
  likeBtn.addEventListener("click", () => {
    if (likes[post.id]) {
      delete likes[post.id];
      post.likes = Math.max(0, post.likes - 1);
    } else {
      likes[post.id] = true;
      post.likes += 1;
    }
    persistLikes();
    persistPosts();
    const nowLiked = Boolean(likes[post.id]);
    likeBtn.className = "like-btn" + (nowLiked ? " liked" : "");
    likeBtn.innerHTML = `${nowLiked ? "♥" : "♡"} <span>${post.likes}</span>`;
  });

  footer.append(tags, likeBtn);
  item.appendChild(footer);
  return item;
}

function renderFeed() {
  const state = uiState();
  settings = { ...state };
  persistSettings();

  const majorCounts = new Map();
  for (const p of posts) majorCounts.set(p.major, (majorCounts.get(p.major) || 0) + 1);

  rankedCache = posts
    .map(p => ({ ...p, score: scorePost(p, state, majorCounts) }))
    .filter(p => p.score >= state.minScore)
    .filter(p => !state.hideImages || !p.image)
    .filter(p => activeFilter === "全部" || p.major === activeFilter)
    .sort((a, b) => b.score - a.score);

  /* Stats */
  const shown = rankedCache.slice(0, currentPage * PAGE_SIZE);
  const imgCount = shown.filter(p => Boolean(p.image)).length;
  statEls.total.textContent     = String(posts.length);
  statEls.shown.textContent     = String(rankedCache.length);
  statEls.diversity.textContent = String(diversityIndex(shown));
  statEls.imageRatio.textContent= `${shown.length ? Math.round(imgCount / shown.length * 100) : 0}%`;
  renderChart(shown);

  /* DOM */
  while (feedList.firstChild) feedList.removeChild(feedList.firstChild);

  for (const post of shown) {
    feedList.appendChild(createPostEl(post));
  }

  const hasMore = rankedCache.length > currentPage * PAGE_SIZE;
  loadMoreBtn.hidden = !hasMore;
}

/* ── Control UI sync ── */
function syncControlUI() {
  for (const [key, el] of Object.entries(valueEls)) {
    el.textContent = controls[key].value;
  }
}

function applySettingsToUI() {
  controls.exploration.value     = String(settings.exploration);
  controls.rigor.value           = String(settings.rigor);
  controls.timeline.value        = String(settings.timeline);
  controls.minScore.value        = String(settings.minScore);
  controls.hideImages.checked    = Boolean(settings.hideImages);
  controls.autoRegulation.checked= Boolean(settings.autoRegulation);
  controls.targetDiversity.value = String(settings.targetDiversity);
  syncControlUI();
}

/* ── File reader ── */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("读取失败"));
    r.readAsDataURL(file);
  });
}

/* ── Post submit ── */
async function handleSubmit(e) {
  e.preventDefault();
  formMessage.className = "form-message";
  formMessage.textContent = "";

  const author   = (document.getElementById("author").value || "").trim() || "匿名用户";
  const text     = (document.getElementById("textContent").value || "").trim();
  const urlInput = (document.getElementById("imageUrl").value || "").trim();
  const imgFile  = document.getElementById("imageFile").files[0];

  if (!text && !urlInput && !imgFile) {
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

  if (imgFile) {
    if (!imgFile.type.startsWith("image/")) {
      formMessage.classList.add("error");
      formMessage.textContent = "上传文件必须为图片类型。";
      return;
    }
    if (imgFile.size > MAX_IMAGE_SIZE_BYTES) {
      formMessage.classList.add("error");
      formMessage.textContent = "图片请小于 4MB。";
      return;
    }
    try {
      image = await readFileAsDataUrl(imgFile);
    } catch {
      formMessage.classList.add("error");
      formMessage.textContent = "图片读取失败，请重试。";
      return;
    }
  }

  posts.unshift({
    id:          `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author,
    major:       "用户发布",
    text:        text || "[仅图片帖子]",
    image,
    exploration: randomInt(20, 100),
    rigor:       randomInt(20, 100),
    likes:       0,
    createdAt:   Date.now(),
    source:      "user"
  });

  persistPosts();
  form.reset();
  charCount.textContent = "0";
  currentPage = 1;
  activeFilter = "全部";
  buildFilterBar();
  renderFeed();
  formMessage.classList.add("success");
  formMessage.textContent = "发布成功（无需注册）✓";
}

/* ── Event listeners ── */
for (const [key, el] of Object.entries(controls)) {
  const ev = el.type === "checkbox" ? "change" : "input";
  el.addEventListener(ev, () => {
    if (valueEls[key]) valueEls[key].textContent = el.value;
    currentPage = 1;
    renderFeed();
  });
}

textContentEl.addEventListener("input", () => {
  charCount.textContent = String(textContentEl.value.length);
});

composerToggle.addEventListener("click", () => {
  const open = composerBody.hidden;
  composerBody.hidden = !open;
  composerToggle.setAttribute("aria-expanded", String(open));
});

adminToggle.addEventListener("click", () => {
  const open = adminPanel.classList.toggle("open");
  adminToggle.setAttribute("aria-expanded", String(open));
  adminToggle.textContent = open ? "✕ 关闭" : "⚙ 后台";
});

loadMoreBtn.addEventListener("click", () => {
  currentPage += 1;
  renderFeed();
  /* Scroll to new content area */
  loadMoreBtn.scrollIntoView({ behavior: "smooth", block: "center" });
});

form.addEventListener("submit", handleSubmit);

seedBtn.addEventListener("click", () => {
  posts = generateDemoPosts();
  persistPosts();
  likes = {};
  persistLikes();
  currentPage = 1;
  activeFilter = "全部";
  buildFilterBar();
  renderFeed();
});

resetBtn.addEventListener("click", () => {
  settings = { ...defaults };
  applySettingsToUI();
  persistSettings();
  currentPage = 1;
  renderFeed();
});

/* ── Bootstrap ── */
settings = loadSettings();
likes    = loadLikes();
posts    = loadPosts();
if (posts.length < DEMO_POST_COUNT) {
  const extra = generateDemoPosts(DEMO_POST_COUNT - posts.length);
  posts = posts.concat(extra);
  persistPosts();
}
applySettingsToUI();
buildFilterBar();
renderFeed();
