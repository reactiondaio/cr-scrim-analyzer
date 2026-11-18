import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDIL_8BSKAThvnnJmnzdKGJPLnf9lLyto",
  authDomain: "scrim-analyzer-96e97.firebaseapp.com",
  projectId: "scrim-analyzer-96e97",
  storageBucket: "scrim-analyzer-96e97.firebasestorage.app",
  messagingSenderId: "752400130734",
  appId: "1:752400130734:web:2ce0e513d68ab5b930c33f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
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
const brawlerData = [];

let selectedBrawlers = [];

const rarityOrder = [
  "Common",
  "Starting Brawler",
  "Rare",
  "Super Rare",
  "Epic",
  "Mythic",
  "Legendary",
  "Ultra Legendary"
];

const rarityNames = {
  "Starting Brawler": "初期キャラ",
  "Rare": "レア",
  "Super Rare": "スーパーレア",
  "Epic": "ハイパーレア",
  "Mythic": "ミシック",
  "Legendary": "レジェンド",
  "Ultra Legendary": "ウルトラレジェンド"
};

// 選択状態を更新
function updateBrawlerPickerSelection() {
  const picker = document.getElementById("brawlerPicker");
  const selectedText = document.getElementById("selectedPicksText");
  const undoButton = document.getElementById("undoPick");
  const completeButton = document.getElementById("completePicks");

  ["pick1", "pick2", "pick3"].forEach((id, index) => {
    document.getElementById(id).value =
      selectedBrawlers[index] || "";
  });

  selectedText.textContent = selectedBrawlers.length
    ? selectedBrawlers.map((name, index) =>
        `${index + 1}. ${name}`
      ).join("　")
    : "まだキャラが選択されていません";

  undoButton.disabled = selectedBrawlers.length === 0;
  completeButton.hidden = selectedBrawlers.length !== 3;

  picker.querySelectorAll(".brawler-option").forEach(button => {
    button.classList.toggle(
      "selected",
      selectedBrawlers.includes(button.dataset.brawler)
    );
  });
}

// キャラ一覧を読み込む
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
    .sort((a, b) => {
      const rarityA = typeof a.rarity === "string"
        ? a.rarity
        : a.rarity?.name || "";

      const rarityB = typeof b.rarity === "string"
        ? b.rarity
        : b.rarity?.name || "";

      const rankA = rarityOrder.indexOf(rarityA);
      const rankB = rarityOrder.indexOf(rarityB);

      return (rankA === -1 ? 99 : rankA) -
             (rankB === -1 ? 99 : rankB);
    });

  allBrawlers.forEach(brawler => {
    brawlers.push(brawler.name);
    brawlerImages[brawler.name] =
      brawler.imageUrl2 || brawler.imageUrl;

    brawlerData.push(brawler);
  });

  // 既存の保存機能用セレクトも維持
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

  // レア度ごとにキャラを表示
  const picker = document.getElementById("brawlerPicker");
  picker.innerHTML = "";

  const rarities = [
    ...rarityOrder,
    ...new Set(
      brawlerData.map(b => typeof b.rarity === "string"
        ? b.rarity
        : b.rarity?.name || "Other"
      )
    )
  ];

  [...new Set(rarities)].forEach(rarity => {
    const group = brawlerData.filter(b => {
  const name = typeof b.rarity === "string"
    ? b.rarity
    : b.rarity?.name || "Other";

  return name === rarity;
}).reverse();

    if (group.length === 0) return;

    const heading = document.createElement("h4");
    heading.textContent = rarityNames[rarity] || rarity;
    picker.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "brawler-grid";

    group.forEach(brawler => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "brawler-option";
      button.dataset.brawler = brawler.name;

      const img = document.createElement("img");
      img.src = brawlerImages[brawler.name];
      img.alt = brawler.name;

      const label = document.createElement("span");
      label.textContent = brawler.name;

      button.append(img, label);
      grid.appendChild(button);
    });

    picker.appendChild(grid);
  });

  // キャラ選択
  picker.addEventListener("click", event => {
    const button = event.target.closest(".brawler-option");
    if (!button) return;

    const name = button.dataset.brawler;

    if (selectedBrawlers.includes(name)) {
      selectedBrawlers = selectedBrawlers.filter(
        brawler => brawler !== name
      );
    } else {
      if (selectedBrawlers.length >= 3) {
        alert("キャラは3体まで選択できます");
        return;
      }

      selectedBrawlers.push(name);
    }

    updateBrawlerPickerSelection();
  });

  updateBrawlerPickerSelection();

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

updateMatchHistory();
showStep(1);
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

const mapList = {
  "Brawl Ball": [
    "狭き門",
    "トリプル・ドリブル",
    "静かな広場",
    "スーパービーチ",
    "ピンボールドリーム",
    "中央コート",
    "ビーチボール",
    "サニーサッカー"
  ],
  "Gem Grab": [
    "ごつごつ坑道",
    "クリスタルアーケード",
    "サボテンの罠",
    "エメラルドの要塞",
    "アンダーマイン",
    "ダブルレール"
  ],
  "Heist": [
    "どんぱち谷",
    "安全地帯",
    "ホットポテト",
    "橋の彼方",
    "ピットストップ"
  ],
  "Bounty": [
    "流れ星",
    "隠れ家",
    "ミルフィーユ",
    "乾燥地帯"
  ],
  "Hot Zone": [
    "オープンビジネス",
    "炎のリング",
    "ビートルバトル"
  ],
  "Knockout": [
    "ゴールドアームの渓谷",
    "ベルの岩",
    "オープンフィールド",
    "新たなる地平"
  ]
};

const modeSelect = document.getElementById("mode");
const mapSelect = document.getElementById("map");

function updateMapList() {
  const selectedMode = modeSelect.value;
  const maps = mapList[selectedMode] || [];

  mapSelect.innerHTML =
    '<option value="">マップを選択</option>';

  maps.forEach(mapName => {
    const option = document.createElement("option");
    option.value = mapName;
    option.textContent = mapName;
    mapSelect.appendChild(option);
  });
}

modeSelect.addEventListener("change", updateMapList);

updateMapList();

// 5ステップ画面切り替え
let currentStep = 1;

function showStep(step) {
  currentStep = step;

  document.querySelectorAll(".form-step").forEach((section, index) => {
    section.hidden = index + 1 !== step;
  });

  document.getElementById("stepProgress").textContent =
    `STEP ${step} / 5`;
}

// 次へボタン
document.getElementById("next1").addEventListener("click", () => {
  if (!opponentInput.value.trim()) {
    alert("対戦相手を入力してください！");
    return;
  }
  showStep(2);
});

document.getElementById("next2").addEventListener("click", () => {
  showStep(3);
});

document.getElementById("next3").addEventListener("click", () => {
  if (!mapInput.value) {
    alert("マップを選択してください！");
    return;
  }
  showStep(4);
});

document.getElementById("next4").addEventListener("click", () => {
  showStep(5);
});

// 戻るボタン
document.getElementById("back2").addEventListener("click", () => showStep(1));
document.getElementById("back3").addEventListener("click", () => showStep(2));
document.getElementById("back4").addEventListener("click", () => showStep(3));
document.getElementById("back5").addEventListener("click", () => showStep(4));

// 最初の画面を表示
showStep(1);

// ページ切り替え機能
const navButtons = document.querySelectorAll(".nav-button");
const pages = document.querySelectorAll(".page");

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    const targetPage = button.dataset.page;

    pages.forEach(page => {
      page.hidden = page.id !== targetPage;
      page.classList.toggle("active", page.id === targetPage);
    });

    navButtons.forEach(nav => {
      nav.classList.toggle("active", nav === button);
    });

    window.scrollTo(0, 0);
  });
});
// 保存済み対戦相手
const savedOpponentsSelect = document.getElementById("savedOpponents");
const saveOpponentButton = document.getElementById("saveOpponent");
const deleteOpponentButton = document.getElementById("deleteOpponent");

let savedOpponents = JSON.parse(
  localStorage.getItem("crSavedOpponents") || "[]"
);

// 保存済み相手を表示
function updateSavedOpponents() {
  savedOpponentsSelect.innerHTML =
    '<option value="">保存した相手を選択</option>';

  savedOpponents.forEach(opponent => {
    const option = document.createElement("option");
    option.value = opponent;
    option.textContent = opponent;
    savedOpponentsSelect.appendChild(option);
  });
}

// 相手を保存
saveOpponentButton.addEventListener("click", () => {
  const name = opponentInput.value.trim();

  if (!name) {
    alert("対戦相手を入力してください");
    return;
  }

  if (savedOpponents.includes(name)) {
    alert("この相手はすでに保存されています");
    return;
  }

  savedOpponents.push(name);
  localStorage.setItem(
    "crSavedOpponents",
    JSON.stringify(savedOpponents)
  );

  updateSavedOpponents();
  alert("相手を保存しました！");
});

// 保存した相手を入力欄に反映
savedOpponentsSelect.addEventListener("change", () => {
  if (savedOpponentsSelect.value) {
    opponentInput.value = savedOpponentsSelect.value;
  }
});

// 相手を削除
deleteOpponentButton.addEventListener("click", () => {
  const name = savedOpponentsSelect.value;

  if (!name) {
    alert("削除する相手を選択してください");
    return;
  }

  savedOpponents = savedOpponents.filter(
    opponent => opponent !== name
  );

  localStorage.setItem(
    "crSavedOpponents",
    JSON.stringify(savedOpponents)
  );

  updateSavedOpponents();
  alert("相手を削除しました");
});

// 起動時に読み込み
updateSavedOpponents();
// 勝ち・負けボタン
const resultButtons = document.querySelectorAll(".result-button");
const resultSelect = document.getElementById("result");

resultButtons.forEach(button => {
  button.addEventListener("click", () => {
    resultSelect.value = button.dataset.result;

    resultButtons.forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");
  });
});
// ピックを1つ戻す
document.getElementById("undoPick").addEventListener("click", () => {
  selectedBrawlers.pop();
  updateBrawlerPickerSelection();
});

// 3体選択後に完了
document.getElementById("completePicks").addEventListener("click", () => {
  document.getElementById("next4").click();
});
// Googleログイン機能
const googleLoginButton = document.getElementById("googleLogin");
const loginStatus = document.getElementById("loginStatus");

googleLoginButton.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("ログインエラー:", error);
    alert("ログインに失敗しました。もう一度試してください。");
  }
});

// ログイン状態を確認
onAuthStateChanged(auth, user => {
  if (user) {
    loginStatus.textContent =
      "ログイン中：" + user.displayName;
    googleLoginButton.textContent = "ログイン済み";
    googleLoginButton.disabled = true;
  } else {
    loginStatus.textContent = "ログインしていません";
    googleLoginButton.textContent = "Googleログイン";
    googleLoginButton.disabled = false;
  }
});
