const els = {
  countdown: document.getElementById("countdown"),
  countdownCard: document.querySelector(".countdown-card"),
  roundLabel: document.getElementById("round-label"),
  randomContainer: document.getElementById("random-images"),
  img1: document.getElementById("img1"),
  img2: document.getElementById("img2"),
  mainImage: document.getElementById("main-image"),
  evilLaugh: document.getElementById("evil-laugh"),
  coinContainer: document.getElementById("coin-container"),
  syncStatus: document.getElementById("sync-status"),
  victimChart: document.getElementById("victim-chart"),
  pigAccuracy: document.getElementById("pig-accuracy"),
  pigRoundSelect: document.getElementById("pig-round-select"),
  pigRoundDetail: document.getElementById("pig-round-detail"),
  raceChart: document.getElementById("race-chart"),
  raceRange: document.getElementById("race-range"),
  raceRoundLabel: document.getElementById("race-round-label"),
  racePlay: document.getElementById("race-play"),
  generalScoringSelect: document.getElementById("general-scoring-select"),
  closedRoundNote: document.getElementById("closed-round-note"),
  awardGrid: document.getElementById("award-grid"),
  awardDetail: document.getElementById("award-detail"),
  roundSelect: document.getElementById("round-select"),
  roundScoringSelect: document.getElementById("round-scoring-select"),
  roundStatus: document.getElementById("round-status"),
  roundStandings: document.getElementById("round-standings"),
  roundAwards: document.getElementById("round-awards"),
  statsContent: document.getElementById("stats-content")
};

const images = [
  "img/img1.jpg",
  "img/img2.jpg",
  "img/img3.jpg",
  "img/img4.jpg",
  "img/img5.jpg",
  "img/img6.jpg",
  "img/img7.jpeg"
];

const BUILD_VERSION = {
  label: "web team-id-v1",
  updatedAt: "2026-08-31T18:17:24+02:00"
};

const cardTeams = new Map([
  ["img/img1.jpg", "Peter LIM"],
  ["img/img2.jpg", "Rodando Nazário"],
  ["img/img3.jpg", "Alex Ballena"],
  ["img/img4.jpg", "Mikel Poyarzabal"],
  ["img/img5.jpg", "Heung Min Dad"],
  ["img/img6.jpg", "Don Manuel Ruíz de Lopera"],
  ["img/img7.jpg", "Olivito"],
  ["img/img7.jpeg", "Olivito"]
]);

const jornadaSchedule = [
  { round: 1, start: { year: 2026, month: 8, day: 15, hour: 19, minute: 30 }, status: "confirmed" },
  { round: 2, start: { year: 2026, month: 8, day: 20, hour: 21, minute: 0 }, status: "confirmed" },
  { round: 3, start: { year: 2026, month: 8, day: 28, hour: 19, minute: 0 }, status: "confirmed" },
  { round: 4, start: { year: 2026, month: 9, day: 6, hour: 19, minute: 0 }, status: "default-time" },
  { round: 5, start: { year: 2026, month: 9, day: 13, hour: 19, minute: 0 }, status: "default-time" },
  { round: 6, start: { year: 2026, month: 9, day: 16, hour: 19, minute: 0 }, status: "default-time" },
  { round: 7, start: { year: 2026, month: 9, day: 20, hour: 19, minute: 0 }, status: "default-time" },
  { round: 8, start: { year: 2026, month: 10, day: 11, hour: 19, minute: 0 }, status: "default-time" },
  { round: 9, start: { year: 2026, month: 10, day: 18, hour: 19, minute: 0 }, status: "default-time" },
  { round: 10, start: { year: 2026, month: 10, day: 25, hour: 19, minute: 0 }, status: "default-time" },
  { round: 11, start: { year: 2026, month: 11, day: 1, hour: 19, minute: 0 }, status: "default-time" },
  { round: 12, start: { year: 2026, month: 11, day: 8, hour: 19, minute: 0 }, status: "default-time" },
  { round: 13, start: { year: 2026, month: 11, day: 22, hour: 19, minute: 0 }, status: "default-time" },
  { round: 14, start: { year: 2026, month: 11, day: 29, hour: 19, minute: 0 }, status: "default-time" },
  { round: 15, start: { year: 2026, month: 12, day: 6, hour: 19, minute: 0 }, status: "default-time" },
  { round: 16, start: { year: 2026, month: 12, day: 13, hour: 19, minute: 0 }, status: "default-time" },
  { round: 17, start: { year: 2026, month: 12, day: 20, hour: 19, minute: 0 }, status: "default-time" },
  { round: 18, start: { year: 2027, month: 1, day: 3, hour: 19, minute: 0 }, status: "default-time" },
  { round: 19, start: { year: 2027, month: 1, day: 10, hour: 19, minute: 0 }, status: "default-time" },
  { round: 20, start: { year: 2027, month: 1, day: 17, hour: 19, minute: 0 }, status: "default-time" },
  { round: 21, start: { year: 2027, month: 1, day: 24, hour: 19, minute: 0 }, status: "default-time" },
  { round: 22, start: { year: 2027, month: 1, day: 31, hour: 19, minute: 0 }, status: "default-time" },
  { round: 23, start: { year: 2027, month: 2, day: 7, hour: 19, minute: 0 }, status: "default-time" },
  { round: 24, start: { year: 2027, month: 2, day: 14, hour: 19, minute: 0 }, status: "default-time" },
  { round: 25, start: { year: 2027, month: 2, day: 21, hour: 19, minute: 0 }, status: "default-time" },
  { round: 26, start: { year: 2027, month: 2, day: 28, hour: 19, minute: 0 }, status: "default-time" },
  { round: 27, start: { year: 2027, month: 3, day: 7, hour: 19, minute: 0 }, status: "default-time" },
  { round: 28, start: { year: 2027, month: 3, day: 14, hour: 19, minute: 0 }, status: "default-time" },
  { round: 29, start: { year: 2027, month: 3, day: 21, hour: 19, minute: 0 }, status: "default-time" },
  { round: 30, start: { year: 2027, month: 4, day: 4, hour: 19, minute: 0 }, status: "default-time" },
  { round: 31, start: { year: 2027, month: 4, day: 11, hour: 19, minute: 0 }, status: "default-time" },
  { round: 32, start: { year: 2027, month: 4, day: 18, hour: 19, minute: 0 }, status: "default-time" },
  { round: 33, start: { year: 2027, month: 4, day: 21, hour: 19, minute: 0 }, status: "default-time" },
  { round: 34, start: { year: 2027, month: 5, day: 2, hour: 19, minute: 0 }, status: "default-time" },
  { round: 35, start: { year: 2027, month: 5, day: 9, hour: 19, minute: 0 }, status: "default-time" },
  { round: 36, start: { year: 2027, month: 5, day: 16, hour: 19, minute: 0 }, status: "default-time" },
  { round: 37, start: { year: 2027, month: 5, day: 23, hour: 19, minute: 0 }, status: "default-time" },
  { round: 38, start: { year: 2027, month: 5, day: 30, hour: 19, minute: 0 }, status: "default-time" }
];

const awardDefs = [
  { id: "winner", icon: "🏆", kind: "good", name: "Ganador de la jornada", desc: "Más puntos en una jornada cerrada." },
  { id: "loser", icon: "🕳", kind: "bad", name: "Perdedor de la jornada", desc: "Menos puntos en una jornada cerrada." },
  { id: "efficient", icon: "💎", kind: "good", name: "Mayor eficiencia de plantilla", desc: "Más puntos por millón de valor de equipo." },
  { id: "inefficient", icon: "🧯", kind: "bad", name: "Menor eficiencia de plantilla", desc: "Menos puntos por millón de valor de equipo." },
  { id: "goals", icon: "⚽", kind: "good", name: "Más goles", desc: "Más goles sumados por los jugadores alineados." },
  { id: "assists", icon: "🎯", kind: "good", name: "Más asistencias", desc: "Más asistencias sumadas por los jugadores alineados." },
  { id: "red", icon: "🟥", kind: "bad", name: "Recibió roja", desc: "Jugadores alineados expulsados." },
  { id: "dnp", icon: "🧊", kind: "bad", name: "Más jugadores sin jugar", desc: "Más jugadores alineados que no jugaron." },
  { id: "dependency", icon: "🧲", kind: "bad", name: "Mayor dependencia", desc: "Mayor porcentaje de puntos concentrado en un solo jugador." },
  { id: "coral", icon: "🧬", kind: "good", name: "Equipo más coral", desc: "Menor dependencia de un solo jugador entre equipos con puntos positivos." },
  { id: "captain", icon: "👑", kind: "good", name: "Capitán adecuado", desc: "Eligió al mejor capitán posible." },
  { id: "bench", icon: "🪑", kind: "bad", name: "Peor alineador", desc: "Más puntos útiles dejados en el banquillo frente a titulares de la misma posición." },
  { id: "directorGood", icon: "🧠", kind: "good", name: "Mejor director deportivo", desc: "Más puntos ganados por cambios de plantilla respecto a la jornada anterior." },
  { id: "directorBad", icon: "🧨", kind: "bad", name: "Peor director deportivo", desc: "Más puntos perdidos por cambios de plantilla respecto a la jornada anterior." },
  { id: "trader", icon: "📈", kind: "good", name: "Mejor trader", desc: "Mayor aumento de valor de equipo entre jornadas." },
  { id: "traderBad", icon: "📉", kind: "bad", name: "Peor trader", desc: "Mayor bajada de valor de equipo entre jornadas." },
  { id: "negative", icon: "☠", kind: "bad", name: "No puntuó por estar en negativo", desc: "Calavera para el equipo que no puntúe una jornada por saldo negativo." }
];

const fallbackClosedRounds = [
  {
    round: 1,
    status: "closed",
    rows: [
      { name: "Don Manuel Ruíz de Lopera", initials: "DM", points: 62, bonus: 3200000 },
      { name: "Heung Min Dad", initials: "HM", points: 53, bonus: 3050000 },
      { name: "Rodando Nazário", initials: "RN", points: 52, bonus: 3300000 },
      { name: "Peter LIM", initials: "PL", points: 48, bonus: 3400000 },
      { name: "Mikel Poyarzabal", initials: "MP", points: 39, bonus: 3250000 },
      { name: "Olivito", initials: "O", points: 21, bonus: 2650000 },
      { name: "Alex Ballena", initials: "AB", points: 18, bonus: 2900000 }
    ]
  },
  {
    round: 2,
    status: "closed",
    rows: [
      { name: "Rodando Nazário", initials: "RN", points: 75, bonus: 3850000 },
      { name: "Heung Min Dad", initials: "HM", points: 71, bonus: 3950000 },
      { name: "Don Manuel Ruíz de Lopera", initials: "DM", points: 52, bonus: 3300000 },
      { name: "Mikel Poyarzabal", initials: "MP", points: 47, bonus: 3350000 },
      { name: "Peter LIM", initials: "PL", points: 32, bonus: 2900000 },
      { name: "Olivito", initials: "O", points: 21, bonus: 2650000 },
      { name: "Alex Ballena", initials: "AB", points: 10, bonus: 2500000 }
    ]
  }
];

const state = {
  standingsRaw: null,
  feedRaw: null,
  marketRaw: null,
  dashboard: null,
  pigHistory: { rounds: [] },
  teams: [],
  teamIdentity: { byName: new Map(), byId: new Map() },
  teamValues: new Map(),
  closedRounds: fallbackClosedRounds,
  liveRounds: [],
  selectedSubtab: "summary",
  selectedStatsTab: "general",
  selectedScoringSystem: "final",
  selectedRoundScoringSystem: "final",
  raceTimer: null,
  raceAnimationFrame: null,
  raceRowsReady: false
};

init();

async function init() {
  registerServiceWorker();
  setupTabs();
  setupStatsTabs();
  setupAwardTooltips();
  setupEasterEgg();
  await loadData();
  normalizeData();
  renderAll();
  setInterval(updateCountdown, 1000);
  updateCountdown();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

async function loadData() {
  const [dashboard, standings, feed, market, pigHistory] = await Promise.all([
    safeJson("data/mister/latest/dashboard.json"),
    safeJson("data/mister/latest/standings.json"),
    safeJson("data/mister/latest/feed.json"),
    safeJson("data/mister/latest/market.json"),
    safeJson("data/cerdo/history.json")
  ]);

  state.dashboard = dashboard;
  state.standingsRaw = standings;
  state.feedRaw = feed;
  state.marketRaw = market;
  state.pigHistory = dashboard?.pig || pigHistory || { rounds: [] };

  const scrapedAt = dashboard?.meta?.generatedAt || standings?.scrapedAt || feed?.scrapedAt || state.pigHistory.updatedAt;
  els.syncStatus.innerHTML = `<span>Web ${formatShortDate(BUILD_VERSION.updatedAt)}</span><span>${scrapedAt ? `Datos ${formatShortDate(scrapedAt)}` : "Datos iniciales"}</span>`;
}

async function safeJson(url) {
  try {
    const response = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

function normalizeData() {
  if (state.dashboard) {
    state.teams = state.dashboard.teams || [];
    buildTeamIdentity();
    state.closedRounds = state.dashboard.closedRounds || fallbackClosedRounds;
    state.liveRounds = state.dashboard.liveRounds || [];
    state.marketRaw = state.marketRaw || { players: state.dashboard.market?.latestPlayers || [] };
    for (const row of state.dashboard.currentStandings || []) {
      state.teamValues.set(canonicalTeamName(row.name), row.value || 0);
    }
    return;
  }

  const parsedStandings = parseStandings(state.standingsRaw?.users || []);
  state.teams = parsedStandings.general.length
    ? parsedStandings.general.map(row => ({ name: row.name, initials: row.initials }))
    : fallbackClosedRounds[0].rows.map(row => ({ name: row.name, initials: row.initials }));
  buildTeamIdentity();

  parsedStandings.general.forEach(row => state.teamValues.set(canonicalTeamName(row.name), row.value || 0));

  const feedRounds = parseClosedRoundsFromFeedText(state.feedRaw?.headlineText || "");
  state.closedRounds = feedRounds.length ? feedRounds : fallbackClosedRounds;

  state.liveRounds = parsedStandings.live.length
    ? [{ round: 3, status: "in_progress", rows: parsedStandings.live }]
    : [];
}

function parseStandings(users) {
  const parsed = users.map(item => parseUserLine(item.text)).filter(Boolean);
  return {
    general: parsed.filter(row => !row.playedText).slice(0, 7),
    live: parsed.filter(row => row.playedText).slice(0, 7)
  };
}

function parseUserLine(text) {
  const rank = Number(text.match(/^(\d+)/)?.[1]);
  const points = Number(text.match(/(-?\d+)\s*PTS?/i)?.[1]);
  const valueMatch = text.match(/€\s*([\d.]+)/);
  const value = valueMatch ? Number(valueMatch[1].replaceAll(".", "")) : 0;
  const playedText = text.match(/(\d+\s*\/\s*11)/)?.[1] || "";
  const initialsMatch = text.match(/^\d+\s+([A-ZÑ]{1,3})\s+/);
  const initials = initialsMatch ? initialsMatch[1] : "";

  if (!rank || Number.isNaN(points)) return null;

  let namePart = text
    .replace(/^\d+\s+/, "")
    .replace(/^[A-ZÑ]{1,3}\s+/, "")
    .replace(/\s+\d+\s*\/\s*11.*$/i, "")
    .replace(/\s+\d+\s+jugadores.*$/i, "")
    .trim();

  return { rank, initials, name: namePart, points, value, playedText };
}

function parseClosedRoundsFromFeedText(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const rounds = [];

  for (let i = 0; i < lines.length; i++) {
    const title = lines[i].match(/^Fin de la jornada\s+(\d+)$/i);
    if (!title) continue;

    const round = Number(title[1]);
    const rows = [];
    for (let j = i + 1; j < lines.length && rows.length < 20; j++) {
      if (/^Fin de la jornada\s+\d+$/i.test(lines[j]) || /^Nuevas /.test(lines[j]) || lines[j] === "Comentar") {
        if (rows.length) break;
        continue;
      }

      const rank = Number(lines[j]);
      const initials = lines[j + 1];
      const name = lines[j + 2];
      const bonus = lines[j + 3];
      const points = lines[j + 4];
      if (!rank || !/^[A-ZÑ]{1,3}$/i.test(initials || "") || !/^\+[\d.]+$/.test(bonus || "") || !/^-?\d+\s+PTS$/i.test(points || "")) {
        continue;
      }

      rows.push({
        rank,
        initials,
        name,
        bonus: Number(bonus.replace(/[+.]/g, "")),
        points: Number(points.match(/-?\d+/)[0])
      });
      j += 4;
    }

    if (rows.length >= 5) {
      rounds.push({ round, status: "closed", rows: rows.sort((a, b) => a.rank - b.rank) });
    }
  }

  return rounds.sort((a, b) => a.round - b.round);
}

function renderAll() {
  renderPigHistory();
  setupRace();
  renderRace(Number(els.raceRange.value));
  renderAwards();
  setupRoundSelect();
  renderRound();
  renderStatsTab();
}

function buildTeamIdentity() {
  const byName = new Map();
  const byId = new Map();
  const registryTeams = state.dashboard?.teamRegistry?.teams || state.teams || [];
  for (const team of registryTeams) {
    const canonical = {
      managerId: team.managerId ? String(team.managerId) : null,
      name: team.currentName || team.name,
      initials: team.initials,
      color: team.color,
      aliases: [...new Set([team.currentName, team.name, ...(team.aliases || [])].filter(Boolean))]
    };
    if (!canonical.name) continue;
    if (canonical.managerId) byId.set(canonical.managerId, canonical);
    for (const alias of canonical.aliases) byName.set(normalizeTeamName(alias), canonical);
  }
  state.teamIdentity = { byName, byId };
}

function setupTabs() {
  document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;
      document.querySelectorAll(".tab-button").forEach(item => item.classList.toggle("active", item === button));
      document.querySelectorAll("[data-tab-panel]").forEach(panel => {
        panel.classList.toggle("active", panel.dataset.tabPanel === tab);
      });
      if (tab === "stats") renderStatsTab();
    });
  });
}

function setupStatsTabs() {
  document.querySelectorAll("[data-stats-tab]").forEach(button => {
    button.addEventListener("click", () => {
      state.selectedStatsTab = button.dataset.statsTab;
      document.querySelectorAll("[data-stats-tab]").forEach(item => item.classList.toggle("active", item === button));
      renderStatsTab();
    });
  });
}

function setupAwardTooltips() {
  const tooltip = document.createElement("div");
  tooltip.className = "award-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.appendChild(tooltip);

  const hide = () => {
    tooltip.hidden = true;
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".award-icon[data-award]");
    if (!button) {
      hide();
      return;
    }

    const def = awardDefs.find(item => item.id === button.dataset.award);
    if (!def) return;
    event.preventDefault();
    event.stopPropagation();
    tooltip.innerHTML = `<strong>${escapeHtml(def.name)}</strong><span>${escapeHtml(def.desc)}</span>`;

    const rect = button.getBoundingClientRect();
    tooltip.hidden = false;
    const width = Math.min(300, window.innerWidth - 24);
    tooltip.style.width = `${width}px`;
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 12);
    const topCandidate = rect.top - tooltip.offsetHeight - 10;
    const top = topCandidate > 12 ? topCandidate : rect.bottom + 10;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  });

  window.addEventListener("scroll", hide, { passive: true });
  window.addEventListener("resize", hide);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide();
  });
}


function renderPigHistory() {
  const counts = new Map(state.teams.map(team => [team.name, 0]));
  for (const round of state.pigHistory.rounds || []) {
    for (const victim of round.victims || []) counts.set(victim, (counts.get(victim) || 0) + 1);
  }

  const rows = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const max = Math.max(1, ...rows.map(([, count]) => count));
  els.victimChart.innerHTML = rows.map(([name, count]) => `
    <div class="victim-row">
      <span class="victim-name">${escapeHtml(name)}</span>
      <span class="bar-track"><span class="bar-fill" style="--bar:${(count / max) * 100}%"></span></span>
      <span class="bar-value">${count}</span>
    </div>
  `).join("");

  renderPigAccuracy();

  els.pigRoundSelect.innerHTML = (state.pigHistory.rounds || [])
    .map(round => `<option value="${round.round}">J${round.round}</option>`)
    .join("");
  els.pigRoundSelect.value = String((state.pigHistory.rounds || []).at(-1)?.round || 1);
  els.pigRoundSelect.addEventListener("change", renderPigRoundDetail);
  renderPigRoundDetail();
}

function renderPigAccuracy() {
  const results = buildPigAccuracy();
  if (!results.rounds.length) {
    els.pigAccuracy.innerHTML = `<p class="mini-copy">Todavía no hay jornadas cerradas con tarjetas suficientes para medir al cerdo.</p>`;
    return;
  }

  const pct = Math.round((results.correct / Math.max(1, results.total)) * 100);
  els.pigAccuracy.innerHTML = `
    <div class="metric-grid">
      <div class="metric"><strong>${pct}%</strong><span>puntería total</span></div>
      <div class="metric"><strong>${results.correct}/${results.total}</strong><span>tarjetas acertadas</span></div>
    </div>
    <div class="pig-accuracy-list">
      ${results.rounds.map(round => `
        <div class="pig-accuracy-round">
          <div>
            <strong>J${round.round}</strong>
            <span>Diana: ${round.targets.map(escapeHtml).join(" / ")}</span>
          </div>
          <div class="pig-predictions">
            ${round.predictions.map(prediction => `
              <span class="prediction-chip ${prediction.hit ? "hit" : "miss"}" title="${escapeAttr(prediction.team)}">
                ${prediction.hit ? "✓" : "×"} ${escapeHtml(teamInitials(prediction.team))}
              </span>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function buildPigAccuracy() {
  const closedByRound = new Map(state.closedRounds.map(round => [round.round, round]));
  const rounds = [];
  let total = 0;
  let correct = 0;

  for (const pigRound of state.pigHistory.rounds || []) {
    const closed = closedByRound.get(pigRound.round);
    if (!closed?.rows?.length || pigRound.status !== "closed") continue;

    const ordered = closed.rows.slice().sort((a, b) => a.rank - b.rank);
    const targets = ordered.slice(-2).map(row => row.name);
    const predictions = (pigRound.cards || []).slice(0, 2)
      .map(card => {
        const team = cardTeams.get(card) || "Sin asignar";
        const hit = targets.some(target => sameTeam(target, team));
        total += 1;
        if (hit) correct += 1;
        return { card, team, hit };
      });

    if (predictions.length) rounds.push({ round: pigRound.round, targets, predictions });
  }

  return { rounds, total, correct };
}

function renderPigRoundDetail() {
  const round = (state.pigHistory.rounds || []).find(item => String(item.round) === els.pigRoundSelect.value);
  if (!round) {
    els.pigRoundDetail.innerHTML = `<p class="mini-copy">Todavía no hay histórico del cerdo.</p>`;
    return;
  }
  const cards = cardsForRound(round.round);
  const accuracy = buildPigAccuracy().rounds.find(item => item.round === round.round);
  els.pigRoundDetail.innerHTML = `
    <p class="mini-copy">J${round.round} · ${round.status === "closed" ? "cerrada" : "en curso"} · Víctimas: ${(round.victims || []).join(", ") || "pendiente"}</p>
    <div class="round-card-images">
      ${cards.map((card, index) => {
        const prediction = accuracy?.predictions?.[index];
        const team = prediction?.team || cardTeams.get(card) || "Sin asignar";
        const verdict = prediction ? (prediction.hit ? "Diana" : "Falló") : "Pendiente";
        return `
          <figure class="pig-card-result ${prediction?.hit ? "hit" : prediction ? "miss" : ""}">
            <img src="${card}" alt="Tarjeta de ${escapeAttr(team)} en la jornada ${round.round}">
            <figcaption>${escapeHtml(team)} · ${verdict}</figcaption>
          </figure>
        `;
      }).join("")}
    </div>
  `;
}

function setupRace() {
  const latestClosed = latestClosedRound();
  setupScoringSelects();
  els.raceRange.max = String(latestClosed);
  els.raceRange.value = String(latestClosed);
  els.raceRange.addEventListener("input", () => {
    stopRaceAnimation();
    renderRace(Number(els.raceRange.value));
  });
  els.racePlay.addEventListener("click", playRace);
  els.closedRoundNote.textContent = `La general solo suma jornadas cerradas. Última computada: J${latestClosed}.`;
}

function setupScoringSelects() {
  const systems = scoringSystems();
  const options = systems.map(system => `<option value="${escapeAttr(system.id)}">${escapeHtml(system.name)}</option>`).join("");
  if (els.generalScoringSelect) {
    els.generalScoringSelect.innerHTML = options;
    els.generalScoringSelect.value = state.selectedScoringSystem;
    els.generalScoringSelect.addEventListener("change", () => {
      state.selectedScoringSystem = els.generalScoringSelect.value;
      state.raceRowsReady = false;
      stopRaceAnimation();
      renderRace(Number(els.raceRange.value));
    });
  }
  if (els.roundScoringSelect) {
    els.roundScoringSelect.innerHTML = options;
    els.roundScoringSelect.value = state.selectedRoundScoringSystem;
    els.roundScoringSelect.addEventListener("change", () => {
      state.selectedRoundScoringSystem = els.roundScoringSelect.value;
      renderRound();
    });
  }
}

function scoringSystems() {
  return state.dashboard?.scoringSystems || [
    { id: "final", name: "Mixto" },
    { id: "as", name: "AS" },
    { id: "marca", name: "Marca" },
    { id: "mundoDeportivo", name: "Mundo Deportivo" },
    { id: "sofascore", name: "Sofascore" }
  ];
}

function renderRace(roundNumber) {
  const standings = cumulativeStandings(roundNumber, state.selectedScoringSystem);
  renderRaceRows(standings, roundNumber);
}

function renderRaceRows(standings, roundNumber) {
  const max = Math.max(1, ...standings.map(row => row.points));
  els.raceRoundLabel.textContent = `J${roundNumber}`;

  if (!state.raceRowsReady) {
    els.raceChart.innerHTML = state.teams.map(team => `
      <div class="race-row race-runner" data-team="${escapeAttr(team.name)}">
        <span class="race-name">${escapeHtml(team.name)}</span>
        <span class="bar-track"><span class="bar-fill"></span></span>
        <span class="bar-value">0</span>
      </div>
    `).join("");
    els.raceChart.style.setProperty("--race-rows", String(state.teams.length));
    state.raceRowsReady = true;
  }

  standings.forEach((row, index) => {
    const runner = [...els.raceChart.querySelectorAll(".race-runner")]
      .find(item => item.dataset.team === row.name);
    if (!runner) return;
    runner.style.setProperty("--race-y", `${index * 46}px`);
    runner.style.zIndex = String(100 - index);
    runner.querySelector(".bar-fill").style.setProperty("--bar", `${(row.points / max) * 100}%`);
    runner.querySelector(".bar-value").textContent = `${Math.round(row.points)}`;
  });
}

function playRace() {
  stopRaceAnimation();
  els.racePlay.textContent = "■";
  const latest = latestClosedRound();
  const msPerRound = 1400;
  const startedAt = performance.now();

  const tick = now => {
    const progress = Math.min(latest, (now - startedAt) / msPerRound);
    const low = Math.floor(progress);
    const high = Math.min(latest, low + 1);
    const t = progress - low;
    els.raceRange.value = String(Math.round(progress));
    renderRaceRows(interpolatedStandings(low, high, t), progress.toFixed(1).replace(".", ","));
    if (progress < latest) {
      state.raceAnimationFrame = requestAnimationFrame(tick);
      return;
    }
    renderRace(latest);
    els.racePlay.textContent = "▶";
  };

  renderRace(0);
  state.raceAnimationFrame = requestAnimationFrame(tick);
}

function cumulativeStandings(roundNumber, system = state.selectedScoringSystem) {
  const prebuilt = state.dashboard?.cumulativeBySystem?.[system]?.find(item => item.round === roundNumber)?.rows;
  if (prebuilt?.length) return prebuilt;
  const prebuiltFinal = system === "final" ? state.dashboard?.cumulative?.find(item => item.round === roundNumber)?.rows : null;
  if (prebuiltFinal?.length) return prebuiltFinal;

  const totals = new Map(state.teams.map(team => [team.name, { ...team, points: 0 }]));
  state.closedRounds
    .filter(round => round.round <= roundNumber)
    .forEach(round => {
      const rows = round.rowsBySystem?.[system] || (system === "final" ? round.rows : []);
      rows.forEach(row => {
        if (!totals.has(row.name)) totals.set(row.name, { name: row.name, initials: row.initials, points: 0 });
        totals.get(row.name).points += row.points;
      });
    });

  return Array.from(totals.values()).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

function interpolatedStandings(fromRound, toRound, t) {
  const from = new Map(cumulativeStandings(fromRound, state.selectedScoringSystem).map(row => [row.name, row.points]));
  const to = new Map(cumulativeStandings(toRound, state.selectedScoringSystem).map(row => [row.name, row.points]));
  return state.teams.map(team => {
    const start = from.get(team.name) || 0;
    const end = to.get(team.name) || start;
    return { ...team, points: start + (end - start) * t };
  }).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

function stopRaceAnimation() {
  clearInterval(state.raceTimer);
  if (state.raceAnimationFrame) cancelAnimationFrame(state.raceAnimationFrame);
  state.raceAnimationFrame = null;
  els.racePlay.textContent = "▶";
}

function renderAwards() {
  const counts = buildAwardCounts();
  els.awardGrid.innerHTML = state.teams.map(team => {
    const teamCounts = counts.get(team.name) || {};
    return `
      <div class="award-team">
        <div class="team-chip">
          <strong>${escapeHtml(team.name)}</strong>
          <span>${escapeHtml(team.initials || initialsFor(team.name))}</span>
        </div>
        <div class="award-icons">
          ${awardDefs.map(def => awardButton(def, team, teamCounts[def.id] || 0)).join("")}
        </div>
      </div>
    `;
  }).join("");

}

function awardButton(def, team, count) {
  const classes = ["award-icon", def.kind === "bad" ? "bad" : "", count ? "" : "locked"].filter(Boolean).join(" ");
  return `
    <button class="${classes}" type="button" data-award="${def.id}" data-team="${escapeAttr(team.name)}" data-count="${count}" title="${escapeAttr(def.name)}">
      ${def.icon}
      ${count > 1 ? `<span class="award-count">x${count}</span>` : ""}
    </button>
  `;
}

function buildAwardCounts() {
  if (state.dashboard?.awards?.counts) {
    return new Map(Object.entries(state.dashboard.awards.counts));
  }

  const counts = new Map(state.teams.map(team => [team.name, {}]));
  const add = (teamName, awardId) => {
    if (!counts.has(teamName)) counts.set(teamName, {});
    const teamCounts = counts.get(teamName);
    teamCounts[awardId] = (teamCounts[awardId] || 0) + 1;
  };

  for (const round of state.closedRounds) {
    const rows = [...round.rows].sort((a, b) => b.points - a.points);
    add(rows[0].name, "winner");
    add(rows.at(-1).name, "loser");

    const withValue = rows
      .map(row => ({ ...row, efficiency: row.points / Math.max(1, state.teamValues.get(row.name) || 1) }))
      .filter(row => state.teamValues.get(row.name));
    if (withValue.length) {
      withValue.sort((a, b) => b.efficiency - a.efficiency);
      add(withValue[0].name, "efficient");
      add(withValue.at(-1).name, "inefficient");
    }
  }

  return counts;
}

function setupRoundSelect() {
  const rounds = [...state.closedRounds, ...state.liveRounds].sort((a, b) => a.round - b.round);
  els.roundSelect.innerHTML = rounds.map(round => `<option value="${round.round}">J${round.round}</option>`).join("");
  els.roundSelect.value = String(rounds.at(-1)?.round || latestClosedRound());
  els.roundSelect.addEventListener("change", renderRound);
}

function renderRound() {
  const roundNumber = Number(els.roundSelect.value);
  const round = [...state.closedRounds, ...state.liveRounds].find(item => item.round === roundNumber);
  if (!round) return;

  const isClosed = round.status === "closed";
  const system = state.selectedRoundScoringSystem;
  const systemName = scoringSystems().find(item => item.id === system)?.name || system;
  const rows = round.rowsBySystem?.[system]?.length ? round.rowsBySystem[system] : round.rows;
  els.roundStatus.textContent = isClosed
    ? `J${round.round} cerrada · sistema ${systemName}.`
    : `J${round.round} en juego · sistema ${systemName}. Se muestra, pero no suma en la general ni desbloquea galardones hasta cerrar.`;

  els.roundStandings.innerHTML = [...rows]
    .sort((a, b) => b.points - a.points)
    .map((row, index) => `
      <div class="standing-row">
        <span class="standing-rank">${index + 1}</span>
        <span class="standing-name">${escapeHtml(row.name)}${row.playedText ? `<br><span class="mini-copy">${row.playedText} jugadores</span>` : row.availablePlayers ? `<br><span class="mini-copy">${row.availablePlayers}/${row.totalLineupPlayers || 11} jugadores con dato</span>` : ""}</span>
        <span class="standing-points">${Math.round(row.points)} pts</span>
      </div>
    `).join("");

  renderRoundAwards(round);
}

function renderRoundAwards(round) {
  if (round.status !== "closed") {
    els.roundAwards.innerHTML = `<div class="info-tile">Galardones bloqueados hasta que Mister cierre la jornada.</div>`;
    return;
  }

  const dashboardAwards = (state.dashboard?.awards?.byRound || [])
    .filter(item => item.round === round.round)
    .map(item => ({
      def: awardDefs.find(def => def.id === item.awardId),
      team: item.teamName,
      value: item.provisional ? `${item.value} · provisional` : item.value
    }))
    .filter(item => item.def);
  if (dashboardAwards.length) {
    els.roundAwards.innerHTML = dashboardAwards.map(item => `
      <div class="round-award-card">
        <button class="award-icon ${item.def.kind === "bad" ? "bad" : ""}" type="button" data-award="${escapeAttr(item.def.id)}" title="${escapeAttr(item.def.name)}">${item.def.icon}</button>
        <div>
          <strong>${escapeHtml(item.def.name)}</strong>
          <p class="mini-copy">${escapeHtml(item.team)} · ${escapeHtml(item.value || "")}</p>
        </div>
      </div>
    `).join("");
    return;
  }

  const rows = [...round.rows].sort((a, b) => b.points - a.points);
  const winner = rows[0];
  const loser = rows.at(-1);
  const details = [
    { def: awardDefs.find(def => def.id === "winner"), team: winner.name, value: `${winner.points} pts` },
    { def: awardDefs.find(def => def.id === "loser"), team: loser.name, value: `${loser.points} pts` }
  ];

  const withValue = rows
    .map(row => ({ ...row, efficiency: row.points / Math.max(1, state.teamValues.get(row.name) || 1) }))
    .filter(row => state.teamValues.get(row.name));
  if (withValue.length) {
    withValue.sort((a, b) => b.efficiency - a.efficiency);
    details.push({ def: awardDefs.find(def => def.id === "efficient"), team: withValue[0].name, value: "provisional" });
    details.push({ def: awardDefs.find(def => def.id === "inefficient"), team: withValue.at(-1).name, value: "provisional" });
  }

  els.roundAwards.innerHTML = details.map(item => `
    <div class="round-award-card">
      <button class="award-icon ${item.def.kind === "bad" ? "bad" : ""}" type="button" data-award="${escapeAttr(item.def.id)}" title="${escapeAttr(item.def.name)}">${item.def.icon}</button>
      <div>
        <strong>${escapeHtml(item.def.name)}</strong>
        <p class="mini-copy">${escapeHtml(item.team)} · ${escapeHtml(item.value)}</p>
      </div>
    </div>
  `).join("");
}

const chartPalette = ["#66fff1", "#ff55df", "#a5ff6a", "#e8d26a", "#7aa8ff", "#ffffff", "#b67cff"];
const fixedTeamPalette = {
  "don manuel ruiz de lopera": "#66fff1",
  "rodando nazario": "#ff55df",
  "heung min dad": "#a5ff6a",
  "mikel poyarzabal": "#7aa8ff",
  "peter lim": "#e8d26a",
  "olivito": "#f8fbff",
  "alex ballena": "#b67cff"
};

function renderStatsTab() {
  if (!els.statsContent) return;
  const stats = state.dashboard?.stats;
  if (!stats) {
    els.statsContent.innerHTML = `<p class="info-tile">Todavía no hay datos estadísticos generados.</p>`;
    return;
  }

  const tab = state.selectedStatsTab || "general";
  els.statsContent.innerHTML = statsTemplate(tab, stats);
  if (tab === "equipo") setupStatsTeamSelector(stats);
  requestAnimationFrame(() => renderStatsCharts(tab, stats));
}

function statsTemplate(tab, stats) {
  const templates = {
    general: `
      <div class="stats-grid">
        ${chartCard("stats-positions", "Carrera de clasificación", "Evolución acumulada jornada a jornada.")}
        ${chartCard("stats-wins", "Ganadores y farolillos", "Conteo de jornadas ganadas y perdidas.")}
        ${chartCard("stats-volatility", "Regularidad", "Menor volatilidad significa equipo más estable.")}
        ${chartCard("stats-value", "Valor por millón", "Puntos acumulados por cada millón de plantilla.")}
      </div>
    `,
    jugadores: `
      <div class="stats-grid">
        ${chartCard("stats-goals", "Goles y asistencias", "Producción ofensiva por equipo.")}
        ${chartCard("stats-goal-dependence", "Dependencia de gol", "Qué porcentaje de goles depende del máximo goleador.")}
        ${chartCard("stats-point-dependence", "Dependencia de puntos", "Peso del jugador más importante en la puntuación.")}
        ${chartCard("stats-discipline", "Índice de Palos", "Amarillas, rojas y castigo acumulado.")}
        ${chartCard("stats-position-share", "Dependencia por posición", "Reparto porcentual de los puntos por línea.")}
      </div>
    `,
    mercado: `
      <div class="stats-grid">
        ${chartCard("stats-roi", "ROI trading", "Rentabilidad media; beneficio absoluto en el tooltip.")}
        ${chartCard("stats-signing-points", "Puntos por fichajes", "Puntos aportados por jugadores actualmente fichados.")}
        ${chartCard("stats-first-signing", "Primera jornada tras fichar", "Impacto inicial de los fichajes detectados.")}
        ${chartCard("stats-activity", "Actividad de mercado", "Compras, ventas y movimientos visibles.")}
        ${chartCard("stats-volume", "Volumen de mercado", "Dinero movido en operaciones detectadas.")}
      </div>
      ${statsTable("Operaciones cerradas", stats.completed_trades, ["user_name", "player_name", "buy_price", "sell_price", "profit"])}
    `,
    plantilla: `
      <div class="stats-grid">
        ${chartCard("stats-loyalty", "Fidelidad de plantilla", "Promedio de jornadas repetidas por jugador.")}
        ${chartCard("stats-concentration", "Concentración", "Cuánto depende cada equipo de pocos jugadores.")}
        ${chartCard("stats-squad-value", "Eficiencia de plantilla", "Relación entre puntos y valor actual.")}
      </div>
      ${statsTable("Mejores jugadores por posición", stats.position_best_players?.slice(0, 30), ["user_name", "player_name", "position_name", "points", "goals", "assists"])}
    `,
    equipo: `
      <div class="stats-team-toolbar">
        <select id="stats-team-select" class="neon-select" aria-label="Elegir equipo en stats">
          ${(stats.teams || []).map(team => `<option value="${escapeAttr(team.user_name)}">${escapeHtml(team.user_name)}</option>`).join("")}
        </select>
      </div>
      <div id="stats-team-profile" class="stats-team-profile"></div>
    `,
    notas: `
      <div class="stats-notes">
        <div class="info-tile"><strong>Jornadas cerradas:</strong> ${stats.coverage?.closed_rounds || 0}</div>
        <div class="info-tile"><strong>Transferencias visibles:</strong> ${stats.coverage?.transfers_visible || 0}</div>
        <div class="info-tile"><strong>Snapshots de mercado:</strong> ${stats.coverage?.market_snapshots || 0}</div>
        ${(stats.coverage?.notes || []).map(note => `<p class="info-tile">${escapeHtml(note)}</p>`).join("")}
      </div>
    `
  };
  return templates[tab] || templates.general;
}

function chartCard(id, title, note) {
  return `
    <article class="chart-card">
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(note)}</p>
      </div>
      <div id="${id}" class="plot"></div>
    </article>
  `;
}

function renderStatsCharts(tab, stats) {
  if (!window.Plotly) {
    els.statsContent.insertAdjacentHTML("afterbegin", `<p class="info-tile">No se pudo cargar Plotly. Revisa conexión y recarga.</p>`);
    return;
  }
  if (tab === "general") {
    plotPositionProgress("stats-positions", stats.position_progress || []);
    plotGroupedBar("stats-wins", stats.round_counts || [], ["wins", "losses"], ["Ganadas", "Perdidas"]);
    plotBar("stats-volatility", stats.volatility || [], "volatility", { label: "Volatilidad", ascending: true, decimals: 1 });
    plotBar("stats-value", stats.value_efficiency || [], "points_per_million", { label: "Pts/M", decimals: 2 });
  }
  if (tab === "jugadores") {
    plotGroupedBar("stats-goals", stats.team_goals || [], ["goals", "assists"], ["Goles", "Asistencias"]);
    plotBar("stats-goal-dependence", stats.goal_dependence || [], "share", { label: "% del máximo goleador", percent: true, customY: row => `${row.user_name}<br>${row.player_name || "-"}` });
    plotBar("stats-point-dependence", stats.point_dependence || [], "share", { label: "% del jugador clave", percent: true, customY: row => `${row.user_name}<br>${row.player_name || "-"}` });
    plotGroupedBar("stats-discipline", stats.discipline || [], ["yellow_cards", "red_cards"], ["Amarillas", "Rojas"]);
    plotStackedPositions("stats-position-share", stats.position_summary || [], "point_share", "% puntos", true);
  }
  if (tab === "mercado") {
    plotBar("stats-roi", stats.trade_summary || [], "roi", { label: "ROI", percent: true, hoverKeys: ["profit", "completed_trades"] });
    plotBar("stats-signing-points", stats.signing_points || [], "points_after_signing", { label: "Puntos", customY: row => `${row.player_name}<br>${row.user_name}` });
    plotBar("stats-first-signing", stats.first_round_signing_points || [], "first_round_points", { label: "Puntos", customY: row => `${row.player_name}<br>${row.user_name}` });
    plotGroupedBar("stats-activity", stats.market_activity_summary || [], ["purchases", "sales"], ["Compras", "Ventas"]);
    plotBar("stats-volume", stats.market_activity_summary || [], "market_volume", { label: "Volumen", money: true });
  }
  if (tab === "plantilla") {
    plotBar("stats-loyalty", stats.loyalty || [], "average_rounds_per_player", { label: "Jornadas/jugador", decimals: 1 });
    plotBar("stats-concentration", stats.concentration || [], "concentration_index", { label: "Concentración", decimals: 3 });
    plotBar("stats-squad-value", stats.value_efficiency || [], "points_per_million", { label: "Pts/M", decimals: 2 });
  }
}

function basePlotLayout(height = 360) {
  return {
    height,
    margin: { l: 118, r: 18, t: 14, b: 42 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "Inter, system-ui, sans-serif", color: "#f8fbff", size: 11 },
    hoverlabel: { bgcolor: "#050713", bordercolor: "#66fff1", font: { color: "#f8fbff" } },
    xaxis: { fixedrange: true, gridcolor: "rgba(102,255,241,.13)", zerolinecolor: "rgba(255,85,223,.24)" },
    yaxis: { fixedrange: true, gridcolor: "rgba(102,255,241,.08)", zerolinecolor: "rgba(255,85,223,.16)" },
    legend: { orientation: "h", y: -0.22, font: { size: 10 } },
    barmode: "group"
  };
}

const plotConfig = { responsive: true, displayModeBar: false, scrollZoom: false };

function plotBar(id, rows, key, options = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  const dataRows = rows.filter(row => Number.isFinite(Number(row[key]))).slice(0, 12);
  if (!dataRows.length) {
    el.innerHTML = `<p class="empty-chart">Sin datos suficientes todavía.</p>`;
    return;
  }
  const sorted = dataRows.sort((a, b) => options.ascending ? Number(a[key]) - Number(b[key]) : Number(b[key]) - Number(a[key]));
  Plotly.newPlot(id, [{
    type: "bar",
    orientation: "h",
    x: sorted.map(row => Number(row[key])),
    y: sorted.map(row => options.customY ? options.customY(row) : row.user_name || row.name || row.player_name),
    marker: { color: sorted.map(row => colorForRow(row)) },
    text: sorted.map(row => formatPlotValue(row[key], options)),
    customdata: sorted.map(row => (options.hoverKeys || []).map(hoverKey => row[hoverKey])),
    textposition: "auto",
    hovertemplate: hoverTemplate(options)
  }], {
    ...basePlotLayout(Math.max(320, sorted.length * 34 + 90)),
    xaxis: { ...basePlotLayout().xaxis, title: options.label || "" },
    yaxis: { ...basePlotLayout().yaxis, autorange: "reversed" }
  }, plotConfig);
}

function plotGroupedBar(id, rows, keys, names) {
  const el = document.getElementById(id);
  if (!el) return;
  const dataRows = rows.filter(row => keys.some(key => Number(row[key]))).slice(0, 12);
  if (!dataRows.length) {
    el.innerHTML = `<p class="empty-chart">Sin datos suficientes todavía.</p>`;
    return;
  }
  Plotly.newPlot(id, keys.map((key, index) => ({
    type: "bar",
    orientation: "h",
    name: names[index],
    x: dataRows.map(row => Number(row[key]) || 0),
    y: dataRows.map(row => row.user_name || row.name),
    marker: { color: dataRows.map(row => colorForRow(row, index)), opacity: index === 0 ? 0.95 : 0.52 },
    hovertemplate: `${names[index]}: %{x}<extra></extra>`
  })), {
    ...basePlotLayout(Math.max(320, dataRows.length * 36 + 110)),
    yaxis: { ...basePlotLayout().yaxis, autorange: "reversed" }
  }, plotConfig);
}

function plotStackedPositions(id, rows, valueKey, label, percent = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const teams = [...new Set(rows.map(row => row.user_name))];
  if (!teams.length) {
    el.innerHTML = `<p class="empty-chart">Sin datos suficientes todavía.</p>`;
    return;
  }
  const positions = ["Portería", "Defensa", "Centro del campo", "Delantera"];
  Plotly.newPlot(id, positions.map((position, index) => ({
    type: "bar",
    orientation: "h",
    name: position,
    x: teams.map(team => Number(rows.find(row => row.user_name === team && row.position_name === position)?.[valueKey]) || 0),
    y: teams,
    marker: { color: chartPalette[index] },
    customdata: teams.map(team => Number(rows.find(row => row.user_name === team && row.position_name === position)?.position_points) || 0),
    hovertemplate: `${position}: ${percent ? "%{x:.0%}" : "%{x} pts"}<br>Puntos: %{customdata}<extra></extra>`
  })), {
    ...basePlotLayout(Math.max(320, teams.length * 42 + 120)),
    barmode: "stack",
    xaxis: { ...basePlotLayout().xaxis, title: label, tickformat: percent ? ".0%" : "" },
    yaxis: { ...basePlotLayout().yaxis, autorange: "reversed" }
  }, plotConfig);
}

function plotPositionProgress(id, rows) {
  const el = document.getElementById(id);
  if (!el) return;
  const rounds = [...new Set(rows.map(row => row.round_order))].sort((a, b) => a - b);
  const teams = [...new Set(rows.map(row => row.user_name))];
  if (!rounds.length || !teams.length) {
    el.innerHTML = `<p class="empty-chart">Sin jornadas cerradas suficientes.</p>`;
    return;
  }
  Plotly.newPlot(id, teams.map((team, index) => {
    const teamRows = rounds.map(round => rows.find(row => row.user_name === team && row.round_order === round));
    return {
      type: "scatter",
      mode: "lines+markers",
      name: team,
      x: rounds.map(round => `J${round}`),
      y: teamRows.map(row => row?.league_position || null),
      line: { color: teamColor(team), width: 3 },
      marker: { size: 7, color: teamColor(team) }
    };
  }), {
    ...basePlotLayout(380),
    margin: { l: 54, r: 18, t: 14, b: 74 },
    yaxis: { ...basePlotLayout().yaxis, autorange: "reversed", dtick: 1, title: "Posición" },
    xaxis: { ...basePlotLayout().xaxis, title: "Jornada" }
  }, plotConfig);
}

function teamColor(name) {
  const canonical = resolveTeam(name);
  if (canonical?.color) return canonical.color;
  const key = normalizeTeamName(canonical?.name || name);
  if (fixedTeamPalette[key]) return fixedTeamPalette[key];
  const index = state.teams.findIndex(team => sameTeam(team.name, canonical?.name || name));
  return chartPalette[(index < 0 ? 0 : index) % chartPalette.length];
}

function colorForRow(row, fallbackIndex = 0) {
  const teamName = row.user_name || row.name || row.team || "";
  return teamName ? teamColor(teamName) : chartPalette[fallbackIndex % chartPalette.length];
}

function hoverTemplate(options = {}) {
  const extras = {
    profit: "<br>Beneficio: %{customdata[0]:,.0f}€",
    completed_trades: "<br>Operaciones: %{customdata[1]}"
  };
  const extraText = (options.hoverKeys || []).map(key => extras[key] || `<br>${key}: %{customdata}`).join("");
  return `%{y}<br>%{text}${extraText}<extra></extra>`;
}

function setupStatsTeamSelector(stats) {
  const select = document.getElementById("stats-team-select");
  const profile = document.getElementById("stats-team-profile");
  if (!select || !profile) return;
  const render = () => {
    const team = select.value;
    const teamName = canonicalTeamName(team);
    const standings = stats.latest_standings?.find(row => sameTeam(row.user_name, teamName));
    const awards = state.dashboard?.awards?.counts?.[teamName] || state.dashboard?.awards?.counts?.[team] || {};
    const bestPlayers = (stats.position_best_players || []).filter(row => sameTeam(row.user_name, teamName)).slice(0, 8);
    const color = teamColor(teamName);
    profile.innerHTML = `
      <h3 class="stats-team-title" style="--team-color:${escapeAttr(color)}">${escapeHtml(teamName)}</h3>
      <div class="metric-grid">
        <div class="metric"><strong>#${standings?.league_position || "-"}</strong><span>posición</span></div>
        <div class="metric"><strong>${Math.round(standings?.total_points_after_round || 0)}</strong><span>puntos</span></div>
        <div class="metric"><strong>${formatMoney(standings?.team_value || 0)}</strong><span>valor</span></div>
        <div class="metric"><strong>${Object.values(awards).reduce((a, b) => a + b, 0)}</strong><span>galardones</span></div>
      </div>
      <div class="award-icons profile-awards">
        ${awardDefs.map(def => {
          const count = awards[def.id] || 0;
          return `<button class="award-icon ${def.kind === "bad" ? "bad" : ""} ${count ? "" : "locked"}" type="button" data-award="${escapeAttr(def.id)}" title="${escapeAttr(def.name)}">${def.icon}${count ? `<span class="award-count">x${count}</span>` : ""}</button>`;
        }).join("")}
      </div>
      ${statsTable("Jugadores destacados", bestPlayers, ["player_name", "position_name", "points", "goals", "assists"])}
    `;
  };
  select.addEventListener("change", render);
  render();
}

function statsTable(title, rows = [], columns = []) {
  if (!rows?.length) return `<div class="chart-card table-card"><h3>${escapeHtml(title)}</h3><p class="empty-chart">Sin datos suficientes todavía.</p></div>`;
  return `
    <article class="chart-card table-card">
      <h3>${escapeHtml(title)}</h3>
      <div class="table-scroll">
        <table>
          <thead><tr>${columns.map(column => `<th>${escapeHtml(tableHeader(column))}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.slice(0, 40).map(row => `<tr>${columns.map(column => `<td>${escapeHtml(formatTableValue(row[column], column))}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function tableHeader(key) {
  return {
    user_name: "Equipo",
    player_name: "Jugador",
    position_name: "Posición",
    points: "Pts",
    goals: "G",
    assists: "A",
    buy_price: "Compra",
    sell_price: "Venta",
    profit: "Beneficio"
  }[key] || key.replaceAll("_", " ");
}

function formatTableValue(value, key) {
  if (["buy_price", "sell_price", "profit", "team_value", "market_value"].includes(key)) return formatMoney(Number(value) || 0);
  if (typeof value === "number") return Number.isInteger(value) ? value : value.toFixed(2);
  return value ?? "-";
}

function formatPlotValue(value, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  if (options.money) return formatMoney(number);
  if (options.percent) return `${Math.round(number * 100)}%`;
  if (Number.isFinite(options.decimals)) return number.toFixed(options.decimals);
  return Math.round(number).toString();
}

function renderGeneralSubtab() {
  const latest = latestClosedRound();
  const standings = cumulativeStandings(latest, state.selectedScoringSystem);
  const leader = standings[0];
  const last = standings.at(-1);
  const totalPoints = standings.reduce((sum, row) => sum + row.points, 0);
  const awards = buildAwardCounts();
  const unlocked = Array.from(awards.values()).reduce((sum, item) => sum + Object.values(item).reduce((a, b) => a + b, 0), 0);
  const systemName = scoringSystems().find(item => item.id === state.selectedScoringSystem)?.name || state.selectedScoringSystem;

  if (state.selectedSubtab === "summary") {
    const volatility = state.dashboard?.charts?.volatility || [];
    const regular = volatility[0];
    const wild = volatility.at(-1);
    els.generalSubtab.innerHTML = `
      <div class="metric-grid">
        <div class="metric"><strong>${latest}</strong><span>jornadas cerradas</span></div>
        <div class="metric"><strong>${Math.round(totalPoints)}</strong><span>puntos ${escapeHtml(systemName)}</span></div>
        <div class="metric"><strong>${escapeHtml(leader?.initials || "-")}</strong><span>líder provisional</span></div>
        <div class="metric"><strong>${unlocked}</strong><span>galardones activos</span></div>
      </div>
      <div class="info-tile">
        Regularidad: ${escapeHtml(regular?.name || "-")} · más volcánico: ${escapeHtml(wild?.name || "-")}.
      </div>
      ${renderMiniBars(volatility.slice().reverse(), "volatility", "Volatilidad")}
      <p class="info-tile">La J3 aparece viva en la pestaña Jornada, pero no altera esta general hasta que Mister publique el cierre.</p>
      <p class="info-tile">Selector activo: ${escapeHtml(systemName)}. AS, Marca, Mundo Deportivo y Sofascore dependen de los popups de puntuación por jugador.</p>
    `;
    return;
  }

  if (state.selectedSubtab === "players") {
    const topPlayers = state.dashboard?.players?.searchTop || [];
    const profiles = state.dashboard?.players?.profiles || [];
    const charts = state.dashboard?.charts || {};
    const topGoals = charts.topScorers?.filter(player => player.goals > 0).slice(0, 8)
      || profiles.filter(player => Number.isFinite(player.goals)).sort((a, b) => (b.goals || 0) - (a.goals || 0)).slice(0, 8);
    const topAssists = charts.topAssistants?.filter(player => player.assists > 0).slice(0, 8)
      || profiles.filter(player => Number.isFinite(player.assists)).sort((a, b) => (b.assists || 0) - (a.assists || 0)).slice(0, 8);
    const discipline = charts.disciplineByTeam || [];
    els.generalSubtab.innerHTML = `
      <div class="metric-grid">
        ${topPlayers.slice(0, 4).map(player => `
          <div class="metric">
            <strong>${escapeHtml(player.points ?? "-")} pts</strong>
            <span>${escapeHtml(player.name || "-")} · ${formatMoney(player.marketValue)}</span>
          </div>
        `).join("")}
      </div>
      ${renderMiniBars(topPlayers.slice(0, 8), "points", "Top puntos")}
      ${renderMiniBars(topGoals, "goals", "Goles detectados", value => `${value} goles`)}
      ${renderMiniBars(topAssists, "assists", "Asistencias detectadas", value => `${value} asist.`)}
      ${renderMiniBars(discipline, "disciplineScore", "Disciplina", value => `${value} castigo`)}
      <p class="info-tile">Perfiles profundos: ${profiles.length}. Las asistencias salen del detalle estadístico de jugador-jornada, no de la ficha simple.</p>
    `;
    return;
  }

  if (state.selectedSubtab === "market") {
    const market = state.dashboard?.market;
    const players = state.marketRaw?.players || market?.latestPlayers || [];
    const totalValue = players.reduce((sum, player) => sum + (player.marketValue || 0), 0);
    const trendCounts = market?.trendCounts || players.reduce((acc, player) => {
      acc[player.valueTrend || "flat"] = (acc[player.valueTrend || "flat"] || 0) + 1;
      return acc;
    }, {});
    const topSeller = market?.topSellers?.[0] || Object.entries(players.reduce((acc, player) => {
      acc[player.seller || "Libre"] = (acc[player.seller || "Libre"] || 0) + 1;
      return acc;
    }, {})).map(([seller, count]) => ({ seller, count })).sort((a, b) => b.count - a.count)[0];

    els.generalSubtab.innerHTML = `
      <div class="metric-grid">
        <div class="metric"><strong>${players.length}</strong><span>jugadores en mercado</span></div>
        <div class="metric"><strong>${formatMoney(market?.averageValue || Math.round(totalValue / Math.max(1, players.length)))}</strong><span>valor medio</span></div>
        <div class="metric"><strong>${trendCounts.up || 0}</strong><span>subiendo</span></div>
        <div class="metric"><strong>${escapeHtml(topSeller?.seller || "-")}</strong><span>más presente</span></div>
      </div>
      ${renderMiniBars((market?.topSellers || []).slice(0, 6).map(row => ({ name: row.seller, count: row.count })), "count", "Apariciones en mercado")}
      <p class="info-tile">Snapshots guardados: ${market?.historySnapshots || 0}. Con unos días de histórico se activan evolución de valor, cazagangas, ventas dolorosas, volumen y trader semanal.</p>
    `;
    return;
  }

  if (state.selectedSubtab === "management") {
    const squad = state.dashboard?.players?.mySquad || [];
    const profiles = state.dashboard?.players?.profiles || [];
    const signed = profiles.filter(player => player.owner?.signedPrice);
    const value = squad.reduce((sum, player) => sum + (player.marketValue || 0), 0);
    els.generalSubtab.innerHTML = `
      <div class="metric-grid">
        <div class="metric"><strong>${squad.length}</strong><span>jugadores leídos de tu plantilla</span></div>
        <div class="metric"><strong>${formatMoney(value)}</strong><span>valor identificado</span></div>
        <div class="metric"><strong>${squad.filter(player => player.valueTrend === "up").length}</strong><span>subiendo</span></div>
        <div class="metric"><strong>${signed.length}</strong><span>fichajes con precio</span></div>
      </div>
      ${renderMiniBars(squad.filter(player => player.marketValue).slice(0, 8), "marketValue", "Valor plantilla visible", formatMoney)}
      ${renderMiniBars(signed.slice(0, 8).map(player => ({ name: `${player.name} · ${player.owner.managerName}`, signedPrice: player.owner.signedPrice })), "signedPrice", "Fichajes detectados", formatMoney)}
      <p class="info-tile">El scraping profundo ya captura once, banquillo, propietario actual, cláusula, último movimiento e historial de valor de los jugadores abiertos. Director deportivo y banquillo serán cada vez más fiables según se acumulen semanas.</p>
    `;
    return;
  }

  const charts = state.dashboard?.charts || {};
  const views = charts.availableViews || [];
  els.generalSubtab.innerHTML = `
    ${renderMiniBars(charts.goalsByTeam || [], "goals", "Goles por equipo", value => `${value} goles`)}
    ${renderMiniBars(charts.assistsByTeam || [], "assists", "Asistencias por equipo", value => `${value} asist.`)}
    ${renderMiniBars(charts.dependencyByTeam || [], "dependency", "Dependencia de un jugador", value => `${Math.round(value * 100)}%`)}
    ${renderPositionBars(charts.positionPointsByTeam || [])}
    ${views.map(view => `
      <div class="info-tile">
        <strong>${escapeHtml(view.name)} <span class="status-badge ${escapeAttr(view.status)}">${escapeHtml(statusLabel(view.status))}</span></strong><br>
        Necesita: ${escapeHtml((view.needs || []).join(", ") || "datos actuales")}${view.replacement ? `<br>Reemplazo: ${escapeHtml(view.replacement)}` : ""}
      </div>
    `).join("")}
  `;
}

function renderPositionBars(rows) {
  if (!rows?.length) return "";
  const compact = rows.map(row => ({
    name: row.name,
    total: ["goalkeeper", "defender", "midfielder", "forward"].reduce((sum, key) => sum + (Number(row[key]) || 0), 0),
    text: `PT ${Math.round(row.goalkeeper || 0)} · DF ${Math.round(row.defender || 0)} · MC ${Math.round(row.midfielder || 0)} · DL ${Math.round(row.forward || 0)}`
  })).sort((a, b) => b.total - a.total);
  return `
    <div class="mini-list" aria-label="Puntos por posición">
      ${compact.map(row => `
        <div class="info-tile position-tile">
          <strong>${escapeHtml(row.name)}</strong><br>
          ${escapeHtml(row.text)}
        </div>
      `).join("")}
    </div>
  `;
}

function renderMiniBars(rows, valueKey, title, formatter = value => Number(value).toFixed(1)) {
  if (!rows?.length) return "";
  const max = Math.max(1, ...rows.map(row => Number(row[valueKey]) || 0));
  return `
    <div class="mini-list" aria-label="${escapeAttr(title)}">
      <div class="mini-list-title">${escapeHtml(title)}</div>
      ${rows.map(row => {
        const value = Number(row[valueKey]) || 0;
        return `
          <div class="race-row">
            <span class="race-name">${escapeHtml(row.name || row.seller || "-")}</span>
            <span class="bar-track"><span class="bar-fill" style="--bar:${(value / max) * 100}%"></span></span>
            <span class="bar-value">${escapeHtml(formatter(value))}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function statusLabel(status) {
  return {
    available: "activo",
    blocked: "bloqueado",
    partial: "parcial",
    replaced: "sustituido"
  }[status] || status;
}

function latestClosedRound() {
  return Math.max(0, ...state.closedRounds.map(round => round.round));
}

function dateFromSpainTime({ year, month, day, hour, minute }) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(utcGuess);
  const get = type => parts.find(part => part.type === type).value;
  const spainTime = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return new Date(utcGuess.getTime() - (spainTime - utcGuess.getTime()));
}

function buildRoundEvents() {
  const revealBeforeStartMs = 24 * 60 * 60 * 1000;
  const visibleAfterStartMs = (4 * 24 + 6) * 60 * 60 * 1000;
  const dynamicSchedule = state.dashboard?.calendar?.rounds?.length
    ? state.dashboard.calendar.rounds.map(round => ({
      round: round.round,
      start: round.start,
      startDate: round.start ? dateFromSpainTime(round.start) : new Date(round.firstKickoff || round.firstKickoffLocal),
      status: round.confidence || "calendar"
    }))
    : jornadaSchedule.map(item => ({
      ...item,
      startDate: dateFromSpainTime(item.start)
    }));

  return dynamicSchedule.map((item, index) => {
    const startDate = item.startDate || dateFromSpainTime(item.start);
    const revealDate = new Date(startDate.getTime() - revealBeforeStartMs);
    const nextStart = dynamicSchedule[index + 1]
      ? dynamicSchedule[index + 1].startDate || dateFromSpainTime(dynamicSchedule[index + 1].start)
      : null;
    const nextRevealDate = nextStart ? new Date(nextStart.getTime() - revealBeforeStartMs) : null;
    const naturalResetDate = new Date(startDate.getTime() + visibleAfterStartMs);
    const resetDate = nextRevealDate && nextRevealDate < naturalResetDate ? nextRevealDate : naturalResetDate;
    return { ...item, startDate, revealDate, resetDate };
  });
}

function getCurrentRoundState(now) {
  const roundEvents = buildRoundEvents();
  for (const event of roundEvents) {
    if (now >= event.revealDate && now < event.resetDate) return { mode: "cards", event };
    if (now < event.revealDate) return { mode: "countdown", event, targetDate: event.revealDate };
  }
  return { mode: "finished", event: roundEvents.at(-1) };
}

let activeCardRound = null;

function updateCountdown() {
  const currentState = getCurrentRoundState(new Date());
  if (currentState.mode === "cards") {
    els.roundLabel.textContent = `J${currentState.event.round} · sentencia activa`;
    els.countdown.textContent = "Pagarán...";
    if (activeCardRound !== currentState.event.round) {
      const [first, second] = cardsForRound(currentState.event.round, currentState.event);
      els.img1.src = first;
      els.img2.src = second;
      activeCardRound = currentState.event.round;
    }
    els.randomContainer.classList.remove("hidden");
    return;
  }

  if (currentState.mode === "countdown") {
    const diff = currentState.targetDate - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    els.roundLabel.textContent = `J${currentState.event.round} · cuenta atrás`;
    els.countdown.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    els.randomContainer.classList.add("hidden");
    activeCardRound = null;
    return;
  }

  els.roundLabel.textContent = "Temporada";
  els.countdown.textContent = "Terminada";
  els.randomContainer.classList.add("hidden");
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickImages(roundEvent) {
  const dateStr = `jornada-${roundEvent.round}-${roundEvent.revealDate.toISOString().slice(0, 16)}`;
  const r1 = Math.floor((simpleHash(dateStr) % 10000) / 10000 * images.length);
  let r2 = Math.floor((simpleHash(`${dateStr}_b`) % 10000) / 10000 * images.length);
  if (r2 === r1) r2 = (r2 + 1) % images.length;
  return [images[r1], images[r2]];
}

function cardsForRound(roundNumber, roundEvent = null) {
  const savedRound = (state.pigHistory.rounds || [])
    .find(round => Number(round.round) === Number(roundNumber));
  const savedCards = (savedRound?.cards || []).filter(Boolean).slice(0, 2);
  if (savedCards.length === 2) return savedCards.map(normalizeCardPath);
  if (!roundEvent) return savedCards.map(normalizeCardPath);
  return pickImages(roundEvent);
}

function normalizeCardPath(card) {
  return card === "img/img7.jpg" ? "img/img7.jpeg" : card;
}

function setupEasterEgg() {
  let tapCount = 0;
  let tapTimer = null;
  let lastEventAt = 0;
  let originPoint = null;

  const register = (event, dedupeMs = 0) => {
    const now = Date.now();
    const point = eventPoint(event);
    if (!point) return;
    if (dedupeMs && now - lastEventAt < dedupeMs) return;
    lastEventAt = now;

    if (!originPoint || now - originPoint.at > 2400 || distanceBetween(point, originPoint) > 38) {
      originPoint = { ...point, at: now };
      tapCount = 0;
    } else {
      originPoint.at = now;
    }

    tapCount += 1;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => {
      tapCount = 0;
      originPoint = null;
    }, 2400);

    if (tapCount >= 5) {
      triggerEasterEgg();
      tapCount = 0;
      originPoint = null;
    }
  };

  if ("PointerEvent" in window) {
    document.addEventListener("pointerdown", event => {
      if (!event.isPrimary) return;
      register(event);
    });
  } else {
    document.addEventListener("touchstart", event => {
      register(event, 120);
    }, { passive: true });
    document.addEventListener("click", event => {
      register(event, 120);
    });
  }
}

function eventPoint(event) {
  const touch = event.touches?.[0] || event.changedTouches?.[0];
  const x = touch?.clientX ?? event.clientX;
  const y = touch?.clientY ?? event.clientY;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function distanceBetween(point, origin) {
  return Math.hypot(point.x - origin.x, point.y - origin.y);
}

function triggerEasterEgg() {
  els.mainImage.classList.add("shake", "cyber-breach");
  setTimeout(() => els.mainImage.classList.remove("shake"), 600);
  setTimeout(() => els.mainImage.classList.remove("cyber-breach"), 950);

  els.evilLaugh.currentTime = 0;
  els.evilLaugh.play().catch(() => {});

  for (let i = 0; i < 44; i++) setTimeout(createMatrixStream, Math.random() * 1800);
  for (let i = 0; i < 42; i++) setTimeout(createCoin, Math.random() * 2600);
}

function createCoin() {
  const coinFall = document.createElement("div");
  coinFall.className = "coin-fall";
  const coin = document.createElement("img");
  coin.src = "img/moneda.png?v=cyber";
  coin.className = "coin";
  const size = 24 + Math.random() * 50;
  coinFall.style.left = `${Math.random() * 90}%`;
  coinFall.style.setProperty("--coin-size", `${size}px`);
  coinFall.style.setProperty("--drift", `${Math.random() * 180 - 90}px`);
  coinFall.style.animationDuration = `${1.8 + Math.random() * 2.8}s`;
  coinFall.style.animationDelay = `${Math.random() * 0.45}s`;
  coin.style.animationDuration = `${0.7 + Math.random() * 0.8}s`;
  coinFall.appendChild(coin);
  els.coinContainer.appendChild(coinFall);
  coinFall.addEventListener("animationend", () => coinFall.remove());
}

function createMatrixStream() {
  const stream = document.createElement("div");
  stream.className = "matrix-stream";
  stream.textContent = Array.from({ length: 14 + Math.floor(Math.random() * 14) }, () => Math.random() > 0.5 ? "1" : "0").join("\n");
  stream.style.left = `${Math.random() * 100}%`;
  stream.style.setProperty("--drift", `${Math.random() * 90 - 45}px`);
  stream.style.setProperty("--stream-size", `${12 + Math.random() * 14}px`);
  stream.style.color = Math.random() > 0.42 ? "#66fff1" : "#ff55df";
  stream.style.animationDuration = `${1.7 + Math.random() * 2.7}s`;
  stream.style.animationDelay = `${Math.random() * 0.4}s`;
  els.coinContainer.appendChild(stream);
  stream.addEventListener("animationend", () => stream.remove());
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatMoney(value) {
  if (!value) return "0€";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(".", ",")}M€`;
  return `${Math.round(value / 1000)}k€`;
}

function initialsFor(name) {
  return name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function teamInitials(name) {
  const canonical = resolveTeam(name);
  return canonical?.initials || state.teams.find(team => sameTeam(team.name, name))?.initials || initialsFor(name);
}

function sameTeam(a, b) {
  return normalizeTeamName(canonicalTeamName(a)) === normalizeTeamName(canonicalTeamName(b));
}

function resolveTeam(value) {
  if (value && typeof value === "object") {
    const managerId = value.managerId ? String(value.managerId) : null;
    if (managerId && state.teamIdentity.byId.has(managerId)) return state.teamIdentity.byId.get(managerId);
    value = value.name || value.user_name || value.currentName || "";
  }
  return state.teamIdentity.byName.get(normalizeTeamName(value)) || null;
}

function canonicalTeamName(value) {
  return resolveTeam(value)?.name || value || "";
}

function normalizeTeamName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
