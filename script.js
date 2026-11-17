
const opponentInput = document.getElementById("opponent");
const modeInput = document.getElementById("mode");
const mapInput = document.getElementById("map");
const resultInput = document.getElementById("result");
const saveButton = document.getElementById("saveMatch");

const totalMatches = document.getElementById("totalMatches");
const winRate = document.getElementById("winRate");
const overviewTotal = document.getElementById("overviewTotal");
const overviewWinRate = document.getElementById("overviewWinRate");
const overviewWins = document.getElementById("overviewWins");
const overviewLosses = document.getElementById("overviewLosses");
const recentWinRate = document.getElementById("recentWinRate");
const currentStreak = document.getElementById("currentStreak");
const recentResults = document.getElementById("recentResults");
const bestWinStreak = document.getElementById("bestWinStreak");
const worstLoseStreak = document.getElementById("worstLoseStreak");
const bestMode = document.getElementById("bestMode");
const opponentStats = document.getElementById("opponentStats");
const historySearch = document.getElementById("historySearch");
const historyResultFilter = document.getElementById("historyResultFilter");
const historyDateSort = document.getElementById("historyDateSort");
const matchList = document.getElementById("matchList");
const undoButton = document.getElementById("undoDelete");
const modeStats = document.getElementById("modeStats");
const mapStats = document.getElementById("mapStats");
const analysisMap = document.getElementById("analysisMap");
const brawlerStats = document.getElementById("brawlerStats");
const brawlerRanking = document.getElementById("brawlerRanking");
const sortBrawlers = document.getElementById("sortBrawlers");
const modes = [
  "Brawl Ball",
  "Gem Grab",
  "Heist",
  "Bounty",
  "Hot Zone",
  "Knockout"
];

const brawlers = [];
const brawlerImages = {};

async function loadBrawlers() {
  const response = await fetch(
    "https://api.brawlapi.com/v1/brawlers"
  );

  if (!response.ok) {
    throw new Error("キャラデータの取得に失敗しました");
  }

  const data = await response.json();

  const allBrawlers = data.list
    .filter(brawler => brawler.released)
    .sort((a, b) => a.name.localeCompare(b.name));

  allBrawlers.forEach(brawler => {
    brawlers.push(brawler.name);
    brawlerImages[brawler.name] =
      brawler.imageUrl2 || brawler.imageUrl;
  });

  ["pick1", "pick2", "pick3"].forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML =
      '<option value="">キャラを選択</option>';

    brawlers.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  });

  console.log("登録キャラ数:", brawlers.length);
}

loadBrawlers().catch(error => {
  console.error(error);
});

// 保存済みデータを読み込む
let matches = JSON.parse(
  localStorage.getItem("crMatches") || "[]"
);
let deletedMatch = null;
let deletedIndex = -1;

// 統計を更新
function updateStats() {

  const total = matches.length;

  
const wins = matches.filter(
    match => match.result === "WIN"
  ).length;

  totalMatches.textContent = total;

  winRate.textContent = total === 0
    ? "--%"
    : Math.round((wins / total) * 100) + "%";
  const losses = total - wins;

overviewTotal.textContent = total;
overviewWins.textContent = wins;
overviewLosses.textContent = losses;

overviewWinRate.textContent = total === 0
  ? "--%"
  : Math.round((wins / total) * 100) + "%";

  // モード別勝率
  modeStats.innerHTML = "";

  modes.forEach(mode => {

    const modeMatches = matches.filter(
      match => match.mode === mode
    );

    const modeWins = modeMatches.filter(
      match => match.result === "WIN"
    ).length;

    const rate = modeMatches.length === 0
      ? "--%"
      : Math.round(
          (modeWins / modeMatches.length) * 100
        ) + "%";

    const card = document.createElement("div");
    card.className = "stat-card";

    const title = document.createElement("p");
    title.textContent = mode;

    const value = document.createElement("h2");
    value.textContent = rate;

    const count = document.createElement("p");
    count.textContent =
      `${modeWins}勝 ${modeMatches.length - modeWins}敗`;

    card.append(title, value, count);
    modeStats.appendChild(card);
  });
  
  // マップ別勝率
  mapStats.innerHTML = "";

  const mapNames = [...new Set(
    matches.map(match => match.map)
  )].sort();

  mapNames.forEach(map => {

    const mapMatches = matches.filter(
      match => match.map === map
    );

    const mapWins = mapMatches.filter(
      match => match.result === "WIN"
    ).length;

    const rate = Math.round(
      (mapWins / mapMatches.length) * 100
    );
    const card = document.createElement("div");
    card.className = "stat-card";

    const title = document.createElement("p");
    title.textContent = map;

    const value = document.createElement("h2");
    value.textContent = rate + "%";

    const count = document.createElement("p");
    count.textContent =
      `${mapWins}勝 ${mapMatches.length - mapWins}敗`;

    card.append(title, value, count);
        mapStats.appendChild(card);
  });

// 直近5試合
const recentMatches = matches.slice(-5).reverse();

const recentWins = recentMatches.filter(
  match => match.result === "WIN"
).length;

recentWinRate.textContent = recentMatches.length === 0
  ? "--%"
  : Math.round((recentWins / recentMatches.length) * 100) + "%";

// 連勝・連敗
let streak = 0;

if (matches.length > 0) {
  const latestResult = matches[matches.length - 1].result;

  for (let i = matches.length - 1; i >= 0; i--) {
    if (matches[i].result === latestResult) {
      streak++;
    } else {
      break;
    }
  }

  currentStreak.textContent =
    (latestResult === "WIN" ? "WIN " : "LOSE ") + streak;
} else {
  currentStreak.textContent = "--";
}

// 直近5試合の勝敗表示
recentResults.innerHTML = recentMatches.length === 0
  ? "データがありません"
  : recentMatches.map(match =>
      `<span>${match.result === "WIN" ? "WIN" : "LOSE"}</span>`
    ).join(" ");
// 最高連勝・最長連敗
let maxWinStreak = 0;
let maxLoseStreak = 0;
let winCount = 0;
let loseCount = 0;

matches.forEach(match => {
  if (match.result === "WIN") {
    winCount++;
    loseCount = 0;
  } else {
    loseCount++;
    winCount = 0;
  }

  maxWinStreak = Math.max(maxWinStreak, winCount);
  maxLoseStreak = Math.max(maxLoseStreak, loseCount);
});

bestWinStreak.textContent = maxWinStreak;
worstLoseStreak.textContent = maxLoseStreak;

// 最も勝率が高いモード
const modePerformance = {};

matches.forEach(match => {
  if (!modePerformance[match.mode]) {
    modePerformance[match.mode] = {
      wins: 0,
      total: 0
    };
  }

  modePerformance[match.mode].total++;

  if (match.result === "WIN") {
    modePerformance[match.mode].wins++;
  }
});

const bestModeEntry = Object.entries(modePerformance)
  .sort((a, b) => {
    const rateA = a[1].wins / a[1].total;
    const rateB = b[1].wins / b[1].total;
    return rateB - rateA;
  })[0];

bestMode.textContent = bestModeEntry
  ? bestModeEntry[0] + " " +
    Math.round(bestModeEntry[1].wins / bestModeEntry[1].total * 100) + "%"
  : "--";
// 対戦相手別の成績
const opponentPerformance = {};

matches.forEach(match => {
  const name = match.opponent || "Unknown";

  if (!opponentPerformance[name]) {
    opponentPerformance[name] = {
      wins: 0,
      losses: 0,
      total: 0
    };
  }

  opponentPerformance[name].total++;

  if (match.result === "WIN") {
    opponentPerformance[name].wins++;
  } else {
    opponentPerformance[name].losses++;
  }
});

const opponentEntries = Object.entries(opponentPerformance);

opponentStats.innerHTML = opponentEntries.length === 0
  ? "データがありません"
  : opponentEntries.map(([name, data]) => {
      const rate = Math.round(
        data.wins / data.total * 100
      );

      return `
        <div class="opponent-card">
          <h3>${name}</h3>
          <p>試合数：${data.total}</p>
          <p>勝利：${data.wins} / 敗北：${data.losses}</p>
          <strong>${rate}%</strong>
        </div>
      `;
    }).join("");
} // updateStats() はここで終了

// 分析用マップ一覧を更新
function updateAnalysisMaps() {

  const currentValue = analysisMap.value;

  const mapNames = [...new Set(
    matches.map(match => match.map)
  )].sort();

  analysisMap.innerHTML =
    '<option value="">マップを選択</option>';

  mapNames.forEach(map => {
    const option = document.createElement("option");
    option.value = map;
    option.textContent = map;
    analysisMap.appendChild(option);
  });

  analysisMap.value = currentValue;
}

// キャラ別の統計を更新
function updateBrawlerStats() {
  const selectedMap = analysisMap.value;

  brawlerStats.innerHTML = "";

  if (!selectedMap) {
    brawlerStats.textContent = "マップを選択してください";
    return;
  }

  const mapMatches = matches.filter(
    match => match.map === selectedMap
  );
const stats = brawlers.map(brawler => {
  const usedMatches = mapMatches.filter(
    match => match.picks &&
    match.picks.includes(brawler)
  );

  const wins = usedMatches.filter(
    match => match.result === "WIN"
  ).length;

  const losses = usedMatches.length - wins;

  const pickRate = mapMatches.length === 0
    ? 0
    : (usedMatches.length / mapMatches.length) * 100;

  const winRate = usedMatches.length === 0
    ? 0
    : (wins / usedMatches.length) * 100;

  return {
    brawler,
    usedMatches: usedMatches.length,
    wins,
    losses,
    pickRate,
    winRate
  };
});

const sortType = sortBrawlers.value;

stats.sort((a, b) => {
  return b[sortType === "count" ? "usedMatches" : sortType] -
         a[sortType === "count" ? "usedMatches" : sortType];
});
  // 使用率ランキングを表示
brawlerRanking.innerHTML = "<h3>使用率ランキング TOP 5</h3>";

const ranking = [...stats]
  .sort((a, b) => b.pickRate - a.pickRate)
  .slice(0, 5);

let currentRank = 0;
let previousRate = null;

ranking.forEach((stat, index) => {
  if (stat.pickRate !== previousRate) {
    currentRank = index + 1;
    previousRate = stat.pickRate;
  }
  const item = document.createElement("div");
  item.className = "ranking-item";

  item.innerHTML = `
    <p>${currentRank}位 ${stat.brawler}：${Math.round(stat.pickRate)}%</p>
    <div class="ranking-bar">
      <div class="ranking-fill"
        style="width: ${stat.pickRate}%"></div>
    </div>
  `;

  brawlerRanking.appendChild(item);
});
  stats.forEach(stat => {
  const card = document.createElement("div");
  card.className = "stat-card";

  card.innerHTML = `
    <h3>${stat.brawler}</h3>
    <p>使用回数：${stat.usedMatches}回</p>
    <p>使用率：${Math.round(stat.pickRate)}%</p>
    <p>勝率：${stat.usedMatches === 0 ? "--" : Math.round(stat.winRate) + "%"}</p>
    <p>戦績：${stat.wins}勝 ${stat.losses}敗</p>
  `;

  brawlerStats.appendChild(card);
});
}
// 試合履歴を表示
function updateMatchHistory() {
  const searchText = historySearch.value.trim().toLowerCase();
  const resultFilter = historyResultFilter.value;

  const filteredMatches = [...matches].reverse().filter(match => {
    const opponent = (match.opponent || "").toLowerCase();
    const map = (match.map || "").toLowerCase();

    const matchesSearch =
      opponent.includes(searchText) || map.includes(searchText);

    const matchesResult =
      resultFilter === "ALL" || match.result === resultFilter;

    return matchesSearch && matchesResult;
  });
filteredMatches.sort((a, b) => {
  const dateA = new Date(a.date || 0).getTime();
  const dateB = new Date(b.date || 0).getTime();

  return historyDateSort.value === "newest"
    ? dateB - dateA
    : dateA - dateB;
});
  matchList.innerHTML = "";

  if (filteredMatches.length === 0) {
    matchList.textContent = "該当する試合がありません。";
    return;
  }

  filteredMatches.forEach(match => {
    const card = document.createElement("div");
    card.className = "history-card " + (match.result === "WIN" ? "win" : "lose");

    const title = document.createElement("h3");
    title.textContent = match.opponent || "相手不明";

    const detail = document.createElement("p");
    detail.textContent =
      `${match.mode} / ${match.map} / ${match.result}`;

    const picks = document.createElement("p");
    picks.textContent =
      "使用キャラ：" + (match.picks || []).filter(Boolean).join("・");

    const date = document.createElement("small");
    date.textContent = match.date
      ? new Date(match.date).toLocaleString("ja-JP")
      : "";

        const deleteButton = document.createElement("button");
    deleteButton.textContent = "削除";
    deleteButton.className = "delete-match";

    deleteButton.addEventListener("click", () => {
      if (!confirm("この試合を削除しますか？")) return;

     const index = matches.indexOf(match);
if (index === -1) return;

deletedMatch = match;
deletedIndex = index;
      undoButton.disabled = false;

matches.splice(index, 1);
      localStorage.setItem("crMatches", JSON.stringify(matches));

      updateStats();
      updateMatchHistory();
      updateAnalysisMaps();
      updateBrawlerStats();
    });

    card.append(title, detail, picks, date, deleteButton);
    matchList.appendChild(card);
  });
}
// 試合データを保存
saveButton.addEventListener("click", () => {

  const opponent = opponentInput.value.trim();
  const map = mapInput.value.trim();

  if (!opponent || !map) {
    alert("対戦相手とマップを入力してください！");
    return;
  }

  const match = {
  opponent: opponent,
  mode: modeInput.value,
  map: map,
  result: resultInput.value,

  picks: [
    document.getElementById("pick1").value,
    document.getElementById("pick2").value,
    document.getElementById("pick3").value
  ],

  date: new Date().toISOString()
};

  matches.push(match);

  localStorage.setItem(
    "crMatches",
    JSON.stringify(matches)
  );

  updateStats();
updateAnalysisMaps();
  opponentInput.value = "";
  mapInput.value = "";
  document.getElementById("pick1").value = "";
document.getElementById("pick2").value = "";
document.getElementById("pick3").value = "";

  alert("試合データを保存しました！");
});

// 起動時に統計を表示
updateStats();
updateMatchHistory();
console.log("保存データ:", localStorage.getItem("crMatches"));
console.log("読み込み件数:", matches.length);
updateAnalysisMaps();
sortBrawlers.addEventListener("change", () => {
  updateBrawlerStats();
});
// マップ選択時にキャラ分析を更新
analysisMap.addEventListener("change", () => {
  updateBrawlerStats();
});
undoButton.addEventListener("click", () => {
  if (deletedMatch === null) return;

  matches.splice(deletedIndex, 0, deletedMatch);
  localStorage.setItem("crMatches", JSON.stringify(matches));

  deletedMatch = null;
  deletedIndex = -1;
  undoButton.disabled = true;

  updateStats();
  updateMatchHistory();
  updateAnalysisMaps();
  updateBrawlerStats();
});
// 試合履歴の検索・絞り込み
historySearch.addEventListener("input", updateMatchHistory);

historyResultFilter.addEventListener("change", updateMatchHistory);

historyDateSort.addEventListener("change", updateMatchHistory);
const debugBox = document.createElement("pre");
debugBox.textContent =
  "保存データ:\n" +
  localStorage.getItem("crMatches") +
  "\n\n読み込み件数: " + matches.length;

document.body.appendChild(debugBox);
