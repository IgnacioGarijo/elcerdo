import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const MISTER_DIR = path.join(ROOT, "data", "mister");
const LATEST_DIR = path.join(MISTER_DIR, "latest");
const CERDO_DIR = path.join(ROOT, "data", "cerdo");
const LALIGA_DIR = path.join(ROOT, "data", "laliga");

const FALLBACK_CLOSED_ROUNDS = [
  {
    round: 1,
    status: "closed",
    rows: [
      { rank: 1, initials: "DM", name: "Don Manuel Ruíz de Lopera", bonus: 3200000, points: 62 },
      { rank: 2, initials: "HM", name: "Heung Min Dad", bonus: 3050000, points: 53 },
      { rank: 3, initials: "RN", name: "Rodando Nazário", bonus: 3300000, points: 52 },
      { rank: 4, initials: "PL", name: "Peter LIM", bonus: 3400000, points: 48 },
      { rank: 5, initials: "MP", name: "Mikel Poyarzabal", bonus: 3250000, points: 39 },
      { rank: 6, initials: "O", name: "Olivito", bonus: 2650000, points: 21 },
      { rank: 7, initials: "AB", name: "Alex Ballena", bonus: 2900000, points: 18 }
    ]
  },
  {
    round: 2,
    status: "closed",
    rows: [
      { rank: 1, initials: "RN", name: "Rodando Nazário", bonus: 3850000, points: 75 },
      { rank: 2, initials: "HM", name: "Heung Min Dad", bonus: 3950000, points: 71 },
      { rank: 3, initials: "DM", name: "Don Manuel Ruíz de Lopera", bonus: 3300000, points: 52 },
      { rank: 4, initials: "MP", name: "Mikel Poyarzabal", bonus: 3350000, points: 47 },
      { rank: 5, initials: "PL", name: "Peter LIM", bonus: 2900000, points: 32 },
      { rank: 6, initials: "O", name: "Olivito", bonus: 2650000, points: 21 },
      { rank: 7, initials: "AB", name: "Alex Ballena", bonus: 2500000, points: 10 }
    ]
  }
];

const AWARD_DEFINITIONS = [
  { id: "winner", icon: "🏆", kind: "good", name: "Ganador de la jornada", requirement: "round_points" },
  { id: "loser", icon: "🕳", kind: "bad", name: "Perdedor de la jornada", requirement: "round_points" },
  { id: "efficient", icon: "💎", kind: "good", name: "Mayor eficiencia de plantilla", requirement: "team_value_snapshot" },
  { id: "inefficient", icon: "🧯", kind: "bad", name: "Menor eficiencia de plantilla", requirement: "team_value_snapshot" },
  { id: "goals", icon: "⚽", kind: "good", name: "Más goles", requirement: "player_round_events" },
  { id: "assists", icon: "🎯", kind: "good", name: "Más asistencias", requirement: "player_round_events" },
  { id: "red", icon: "🟥", kind: "bad", name: "Recibió roja", requirement: "player_round_events" },
  { id: "dnp", icon: "🧊", kind: "bad", name: "Más jugadores sin jugar", requirement: "lineup_slots" },
  { id: "dependency", icon: "🧲", kind: "bad", name: "Mayor dependencia", requirement: "player_round_points" },
  { id: "coral", icon: "🧬", kind: "good", name: "Equipo más coral", requirement: "player_round_points" },
  { id: "captain", icon: "👑", kind: "good", name: "Capitán adecuado", requirement: "captain_selection" },
  { id: "bench", icon: "🪑", kind: "bad", name: "Peor alineador", requirement: "bench_points" },
  { id: "directorGood", icon: "🧠", kind: "good", name: "Mejor director deportivo", requirement: "roster_delta" },
  { id: "directorBad", icon: "📉", kind: "bad", name: "Peor director deportivo", requirement: "roster_delta" },
  { id: "trader", icon: "📈", kind: "good", name: "Mejor trader", requirement: "daily_value_snapshots" },
  { id: "negative", icon: "☠", kind: "bad", name: "No puntuó por estar en negativo", requirement: "negative_balance_status" }
];

const BIWENGER_VIEWS = [
  { id: "positions_race", name: "Carrera de clasificación", status: "available", needs: ["round_points"] },
  { id: "wins_losses", name: "Ganadores y farolillos", status: "replaced", needs: ["awards"], replacement: "Galardones ganador/perdedor" },
  { id: "volatility", name: "Regularidad / volatilidad", status: "available", needs: ["round_points"] },
  { id: "goals", name: "Goles por equipo", status: "blocked", needs: ["player_round_events"] },
  { id: "goal_dependence", name: "Dependencia de goles", status: "blocked", needs: ["player_round_events"] },
  { id: "point_dependence", name: "Dependencia de puntos", status: "blocked", needs: ["player_round_points"] },
  { id: "discipline", name: "Disciplina", status: "blocked", needs: ["player_round_events"] },
  { id: "position_points", name: "Puntos por posición", status: "blocked", needs: ["lineup_positions"] },
  { id: "position_dependence", name: "Dependencia por posición", status: "blocked", needs: ["lineup_positions"] },
  { id: "profit", name: "Beneficio trading", status: "partial", needs: ["market_history"] },
  { id: "roi", name: "Rentabilidad trading", status: "partial", needs: ["market_history"] },
  { id: "signing_points", name: "Puntos por fichajes", status: "blocked", needs: ["ownership_periods", "player_round_points"] },
  { id: "first_round_signing", name: "Primera jornada tras fichar", status: "blocked", needs: ["ownership_periods", "player_round_points"] },
  { id: "trading_activity", name: "Actividad de mercado", status: "partial", needs: ["market_history"] },
  { id: "market_volume", name: "Volumen de mercado", status: "partial", needs: ["market_history"] },
  { id: "loyalty", name: "Fidelidad de plantilla", status: "blocked", needs: ["roster_snapshots"] },
  { id: "concentration", name: "Concentración de plantilla", status: "partial", needs: ["current_roster"] },
  { id: "value_efficiency", name: "Valor por millón", status: "partial", needs: ["team_value_snapshot"] },
  { id: "tables", name: "Tablas de operaciones y fichajes", status: "partial", needs: ["market_history"] },
  { id: "team_profile", name: "Perfil individual de equipo", status: "partial", needs: ["round_points", "market_history", "current_roster"] }
];

async function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(path.join(ROOT, relativePath), "utf8"));
  } catch {
    return fallback;
  }
}

async function readJsonl(relativePath) {
  try {
    const text = await fs.readFile(path.join(ROOT, relativePath), "utf8");
    return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

function parseUserLine(text) {
  const rank = Number(text.match(/^(\d+)/)?.[1]);
  const points = Number(text.match(/(-?\d+)\s*PTS?/i)?.[1]);
  const valueMatch = text.match(/€\s*([\d.]+)/);
  const value = valueMatch ? Number(valueMatch[1].replaceAll(".", "")) : 0;
  const playedText = text.match(/(\d+\s*\/\s*11)/)?.[1] || "";
  const initials = text.match(/^\d+\s+([A-ZÑ]{1,3})\s+/)?.[1] || "";
  if (!rank || Number.isNaN(points)) return null;
  const name = text
    .replace(/^\d+\s+/, "")
    .replace(/^[A-ZÑ]{1,3}\s+/, "")
    .replace(/\s+\d+\s*\/\s*11.*$/i, "")
    .replace(/\s+\d+\s+jugadores.*$/i, "")
    .trim();
  return { rank, initials, name, points, value, playedText };
}

function parseStandings(users = []) {
  const parsed = users.map((item) => parseUserLine(item.text)).filter(Boolean);
  return {
    general: parsed.filter((row) => !row.playedText).slice(0, 7),
    live: parsed.filter((row) => row.playedText).slice(0, 7)
  };
}

function parseClosedRoundsFromFeedText(text = "") {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
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
      if (!rank || !/^[A-ZÑ]{1,3}$/i.test(initials || "") || !/^\+[\d.]+$/.test(bonus || "") || !/^-?\d+\s+PTS$/i.test(points || "")) continue;
      rows.push({
        rank,
        initials,
        name,
        bonus: Number(bonus.replace(/[+.]/g, "")),
        points: Number(points.match(/-?\d+/)[0])
      });
      j += 4;
    }
    if (rows.length >= 5) rounds.push({ round, status: "closed", rows: rows.sort((a, b) => a.rank - b.rank) });
  }
  return rounds.sort((a, b) => a.round - b.round);
}

function parsePlayerText(item) {
  const text = item.text || "";
  const valueMatch = text.match(/€\s*([\d.]+)/);
  const beforeValue = valueMatch ? text.slice(0, valueMatch.index).trim() : text;
  const points = Number(beforeValue.match(/^-?\d+/)?.[0]);
  const name = beforeValue.replace(/^-?\d+\s+/, "").replace(/\s+💥$/, "").trim();
  const value = valueMatch ? Number(valueMatch[1].replaceAll(".", "")) : null;
  const trend = text.includes("↑") ? "up" : text.includes("↓") ? "down" : "flat";
  const afterValue = valueMatch ? text.slice(valueMatch.index + valueMatch[0].length) : "";
  const numbers = [...afterValue.matchAll(/-?\d+(?:,\d+)?/g)].map((match) => Number(match[0].replace(",", ".")));
  return {
    playerId: item.playerId,
    name: name || null,
    href: item.href,
    points: Number.isFinite(points) ? points : null,
    marketValue: value,
    valueTrend: trend,
    average: numbers[0] ?? null,
    streak: numbers.slice(1)
  };
}

function cumulativeStandings(teams, closedRounds, roundNumber) {
  const totals = new Map(teams.map((team) => [team.name, { ...team, points: 0 }]));
  closedRounds
    .filter((round) => round.round <= roundNumber)
    .forEach((round) => {
      round.rows.forEach((row) => {
        if (!totals.has(row.name)) totals.set(row.name, { name: row.name, initials: row.initials, points: 0 });
        totals.get(row.name).points += row.points;
      });
    });
  return Array.from(totals.values()).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

function buildAwardCounts(teams, closedRounds, teamValues) {
  const counts = new Map(teams.map((team) => [team.name, {}]));
  const byRound = [];
  const add = (teamName, awardId, round, value = null, provisional = false) => {
    if (!counts.has(teamName)) counts.set(teamName, {});
    counts.get(teamName)[awardId] = (counts.get(teamName)[awardId] || 0) + 1;
    byRound.push({ round, awardId, teamName, value, provisional });
  };

  for (const round of closedRounds) {
    const rows = [...round.rows].sort((a, b) => b.points - a.points);
    add(rows[0].name, "winner", round.round, `${rows[0].points} pts`);
    add(rows.at(-1).name, "loser", round.round, `${rows.at(-1).points} pts`);
    const withValue = rows
      .map((row) => ({ ...row, efficiency: row.points / Math.max(1, teamValues.get(row.name) || 1) }))
      .filter((row) => teamValues.get(row.name));
    if (withValue.length) {
      withValue.sort((a, b) => b.efficiency - a.efficiency);
      add(withValue[0].name, "efficient", round.round, "valor actual", true);
      add(withValue.at(-1).name, "inefficient", round.round, "valor actual", true);
    }
  }

  return {
    counts: Object.fromEntries(Array.from(counts.entries())),
    byRound
  };
}

function buildVolatility(teams, closedRounds) {
  return teams.map((team) => {
    const points = closedRounds.map((round) => round.rows.find((row) => row.name === team.name)?.points ?? 0);
    const average = points.reduce((sum, value) => sum + value, 0) / Math.max(1, points.length);
    const variance = points.reduce((sum, value) => sum + (value - average) ** 2, 0) / Math.max(1, points.length);
    return { ...team, average, volatility: Math.sqrt(variance), points };
  }).sort((a, b) => a.volatility - b.volatility);
}

function buildMarketSummary(market, history) {
  const players = market?.players || [];
  const totalValue = players.reduce((sum, player) => sum + (player.marketValue || 0), 0);
  const trendCounts = players.reduce((acc, player) => {
    acc[player.valueTrend || "flat"] = (acc[player.valueTrend || "flat"] || 0) + 1;
    return acc;
  }, {});
  const sellerCounts = players.reduce((acc, player) => {
    acc[player.seller || "Libre"] = (acc[player.seller || "Libre"] || 0) + 1;
    return acc;
  }, {});
  const topSellers = Object.entries(sellerCounts)
    .map(([seller, count]) => ({ seller, count }))
    .sort((a, b) => b.count - a.count);

  return {
    playerCount: players.length,
    averageValue: Math.round(totalValue / Math.max(1, players.length)),
    trendCounts,
    topSellers,
    historySnapshots: history.length,
    latestPlayers: players.slice(0, 20)
  };
}

async function main() {
  const standings = await readJson("data/mister/latest/standings.json", {});
  const feed = await readJson("data/mister/latest/feed.json", {});
  const market = await readJson("data/mister/latest/market.json", {});
  const team = await readJson("data/mister/latest/team.json", {});
  const search = await readJson("data/mister/latest/search.json", {});
  const pigHistory = await readJson("data/cerdo/history.json", { rounds: [] });
  const calendar = await readJson("data/laliga/calendar.json", { rounds: [] });
  const marketHistory = await readJsonl("data/mister/market-history.jsonl");

  const parsedStandings = parseStandings(standings.users || []);
  const closedRounds = parseClosedRoundsFromFeedText(feed.headlineText || "");
  const effectiveClosedRounds = closedRounds.length ? closedRounds : FALLBACK_CLOSED_ROUNDS;
  const teams = parsedStandings.general.length
    ? parsedStandings.general.map((row) => ({ name: row.name, initials: row.initials }))
    : effectiveClosedRounds[0].rows.map((row) => ({ name: row.name, initials: row.initials }));
  const teamValues = new Map(parsedStandings.general.map((row) => [row.name, row.value || 0]));
  const latestClosedRound = Math.max(0, ...effectiveClosedRounds.map((round) => round.round));

  const dashboard = {
    meta: {
      generatedAt: new Date().toISOString(),
      sources: {
        standings: standings.scrapedAt || null,
        feed: feed.scrapedAt || null,
        market: market.scrapedAt || null,
        team: team.scrapedAt || null,
        search: search.scrapedAt || null,
        calendar: calendar.scrapedAt || calendar.updatedAt || null
      },
      latestClosedRound,
      liveRoundPolicy: "Las jornadas en juego se muestran, pero no suman ni desbloquean galardones hasta aparecer como Fin de la jornada en el feed.",
      limitations: [
        "Mister todavía no guarda alineaciones históricas completas de todos los usuarios.",
        "Los galardones de eficiencia usan valor actual hasta tener snapshots de valor al cierre de cada jornada.",
        "Los galardones de goles, asistencias, tarjetas, capitán, banquillo y dependencia se desbloquearán cuando el scraper capture eventos y alineaciones por jornada."
      ]
    },
    teams,
    currentStandings: parsedStandings.general,
    closedRounds: effectiveClosedRounds,
    liveRounds: parsedStandings.live.length ? [{ round: latestClosedRound + 1, status: "in_progress", rows: parsedStandings.live }] : [],
    cumulative: Array.from({ length: latestClosedRound + 1 }, (_, round) => ({ round, rows: cumulativeStandings(teams, effectiveClosedRounds, round) })),
    awards: {
      definitions: AWARD_DEFINITIONS,
      ...buildAwardCounts(teams, effectiveClosedRounds, teamValues)
    },
    charts: {
      availableViews: BIWENGER_VIEWS,
      volatility: buildVolatility(teams, effectiveClosedRounds),
      valueEfficiency: effectiveClosedRounds.flatMap((round) => round.rows.map((row) => ({
        round: round.round,
        name: row.name,
        initials: row.initials,
        points: row.points,
        teamValue: teamValues.get(row.name) || null,
        pointsPerMillion: teamValues.get(row.name) ? row.points / (teamValues.get(row.name) / 1000000) : null,
        provisional: true
      })))
    },
    market: buildMarketSummary(market, marketHistory),
    players: {
      searchTop: (search.players || []).map(parsePlayerText).filter((player) => player.name).slice(0, 80),
      mySquad: (team.players || []).map(parsePlayerText).filter((player) => player.name)
    },
    calendar,
    pig: pigHistory
  };

  await fs.mkdir(LATEST_DIR, { recursive: true });
  await fs.writeFile(path.join(LATEST_DIR, "dashboard.json"), `${JSON.stringify(dashboard, null, 2)}\n`, "utf8");
  await fs.mkdir(CERDO_DIR, { recursive: true });
  await fs.mkdir(LALIGA_DIR, { recursive: true });
  console.log(`Dashboard Mister generado: J${latestClosedRound} cerrada, ${teams.length} equipos, ${market?.players?.length || 0} jugadores en mercado.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
