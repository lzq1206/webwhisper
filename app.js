const defaults = {
  exploration: 55,
  rigor: 70,
  timeline: 45
};

const mockFeed = [
  { major: "经济学", summary: "用 DID 模型复盘平台补贴退坡后城市打车供给变化，弹性区间有明显分层。", exploration: 28, rigor: 86, timestamp: "2026-04-27T01:48:00Z" },
  { major: "天体物理", summary: "新一轮系外行星凌日曲线显示大气层中可能存在钠吸收峰，后续需高分辨验证。", exploration: 72, rigor: 90, timestamp: "2026-04-27T00:22:00Z" },
  { major: "软件工程", summary: "把热路径上的对象分配改成池化后，P99 延迟从 113ms 降到 71ms。", exploration: 45, rigor: 82, timestamp: "2026-04-26T23:10:00Z" },
  { major: "艺术史", summary: "文艺复兴湿壁画中的颜料选择，和贸易航线中矿物供给波动存在耦合。", exploration: 88, rigor: 62, timestamp: "2026-04-26T20:35:00Z" },
  { major: "历史学", summary: "比较三份地方志后发现，灾荒叙事在不同政区中呈现制度性删改模式。", exploration: 64, rigor: 78, timestamp: "2026-04-26T18:02:00Z" },
  { major: "认知科学", summary: "工作记忆实验中加入噪声提示后，受试者策略切换成本显著下降。", exploration: 52, rigor: 84, timestamp: "2026-04-26T16:48:00Z" },
  { major: "计算机图形学", summary: "针对体渲染做了分层采样，视觉损失可控但渲染预算节省约 31%。", exploration: 58, rigor: 80, timestamp: "2026-04-26T14:15:00Z" },
  { major: "社会学", summary: "青年社群中的“知识炫耀”行为更容易在短视频场景被强化与模仿。", exploration: 69, rigor: 60, timestamp: "2026-04-26T11:51:00Z" },
  { major: "材料科学", summary: "二维材料应变调控实验里，电子迁移率在特定角度出现突变。", exploration: 76, rigor: 88, timestamp: "2026-04-26T09:40:00Z" }
];

const panel = document.getElementById("controlPanel");
const toggleBtn = document.getElementById("panelToggle");
const feedList = document.getElementById("feedList");

const controls = {
  exploration: document.getElementById("exploration"),
  rigor: document.getElementById("rigor"),
  timeline: document.getElementById("timeline")
};

const values = {
  exploration: document.getElementById("explorationValue"),
  rigor: document.getElementById("rigorValue"),
  timeline: document.getElementById("timelineValue")
};

const meters = {
  exploration: document.getElementById("explorationMeter"),
  rigor: document.getElementById("rigorMeter"),
  timeline: document.getElementById("timelineMeter")
};

function clamp(num) {
  return Math.max(0, Math.min(100, num));
}

function hoursSince(timestamp) {
  return (Date.now() - new Date(timestamp).getTime()) / 36e5;
}

function scorePost(post, state) {
  const matchExploration = 100 - Math.abs(post.exploration - state.exploration);
  const matchRigor = 100 - Math.abs(post.rigor - state.rigor);
  const quality = matchExploration * 0.46 + matchRigor * 0.54;

  const fresh = clamp(100 - hoursSince(post.timestamp) * 2.6);
  const timelineWeight = state.timeline / 100;
  const qualityWeight = 1 - timelineWeight;

  return fresh * timelineWeight + quality * qualityWeight;
}

function relativeTime(timestamp) {
  const diffMins = Math.max(1, Math.floor((Date.now() - new Date(timestamp).getTime()) / 6e4));
  if (diffMins < 60) return `${diffMins} 分钟前`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function stateFromUI() {
  return {
    exploration: Number(controls.exploration.value),
    rigor: Number(controls.rigor.value),
    timeline: Number(controls.timeline.value)
  };
}

function renderFeed() {
  const state = stateFromUI();
  const ranked = [...mockFeed]
    .map(post => ({ ...post, score: scorePost(post, state) }))
    .sort((a, b) => b.score - a.score);

  feedList.style.opacity = "0";

  window.setTimeout(() => {
    feedList.innerHTML = ranked.map((post, index) => `
      <li class="feed-item" style="animation-delay:${index * 26}ms">
        <div class="feed-head">
          <strong>${post.major}</strong>
          <span>${relativeTime(post.timestamp)}</span>
        </div>
        <p>${post.summary}</p>
        <div class="feed-tags">
          <span>探索:${post.exploration}</span>
          <span>严谨:${post.rigor}</span>
          <span>匹配:${post.score.toFixed(1)}</span>
        </div>
      </li>
    `).join("");
    feedList.style.opacity = "1";
  }, 120);
}

function syncUI() {
  Object.keys(controls).forEach((key) => {
    const value = controls[key].value;
    values[key].textContent = value;
    meters[key].style.width = `${value}%`;
  });
}

function handleInput() {
  syncUI();
  renderFeed();
}

Object.values(controls).forEach((input) => {
  input.addEventListener("input", handleInput);
});

document.getElementById("resetBtn").addEventListener("click", () => {
  Object.keys(defaults).forEach((key) => {
    controls[key].value = defaults[key];
  });
  handleInput();
});

toggleBtn.addEventListener("click", () => {
  const open = panel.classList.toggle("open");
  toggleBtn.setAttribute("aria-expanded", String(open));
  toggleBtn.textContent = open ? "收起算法控制台" : "打开算法控制台";
});

if (window.matchMedia("(min-width: 768px)").matches) {
  panel.classList.add("open");
}

syncUI();
renderFeed();
