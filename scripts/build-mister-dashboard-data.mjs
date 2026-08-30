import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const MISTER_DIR = path.join(ROOT, "data", "mister");
const LATEST_DIR = path.join(MISTER_DIR, "latest");
const CERDO_DIR = path.join(ROOT, "data", "cerdo");
const LALIGA_DIR = path.join(ROOT, "data", "laliga");
const LINEUP_AWARD_START_ROUND = Number(process.env.MISTER_LINEUP_AWARD_START_ROUND || 3);

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
  { id: "directorBad", icon: "🧨", kind: "bad", name: "Peor director deportivo", requirement: "roster_delta" },
  { id: "trader", icon: "📈", kind: "good", name: "Mejor trader", requirement: "daily_value_snapshots" },
  { id: "traderBad", icon: "📉", kind: "bad", name: "Peor trader", requirement: "daily_value_snapshots" },
  { id: "negative", icon: "☠", kind: "bad", name: "No puntuó por estar en negativo", requirement: "negative_balance_status" }
];

const BIWENGER_VIEWS = [
  { id: "positions_race", name: "Carrera de clasificación", status: "available", needs: ["round_points"] },
  { id: "wins_losses", name: "Ganadores y farolillos", status: "replaced", needs: ["awards"], replacement: "Galardones ganador/perdedor" },
  { id: "volatility", name: "Regularidad / volatilidad", status: "available", needs: ["round_points"] },
  { id: "goals", name: "Goles por equipo", status: "available", needs: ["player_round_events"] },
  { id: "goal_dependence", name: "Dependencia de goles", status: "available", needs: ["player_round_events"] },
  { id: "point_dependence", name: "Dependencia de puntos", status: "available", needs: ["player_round_points"] },
  { id: "discipline", name: "Disciplina", status: "available", needs: ["player_round_events"] },
  { id: "position_points", name: "Puntos por posición", status: "available", needs: ["lineup_positions"] },
  { id: "position_dependence", name: "Dependencia por posición", status: "available", needs: ["lineup_positions"] },
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

const POSITION_LABELS = {
  goalkeeper: "Portería",
  defender: "Defensa",
  midfielder: "Centro del campo",
  forward: "Delantera"
};

const POSITION_ORDER = ["goalkeeper", "defender", "midfielder", "forward"];

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

function numberOrNull(value) {
  if (value === "-" || value === "?" || value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function systemKey(name = "") {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("sofa")) return "sofascore";
  if (normalized.includes("mundo")) return "mundoDeportivo";
  if (normalized.includes("marca")) return "marca";
  if (normalized.includes("as")) return "as";
  return normalized.replace(/\W+/g, "") || "unknown";
}

function buildPlayerLookup(deep) {
  const lookup = new Map();
  for (const player of deep?.playerProfiles || []) {
    const rounds = new Map();
    for (const gw of player.gameweeks || []) {
      if (!gw.gameweekId) continue;
      rounds.set(gw.gameweekId, {
        final: gw.points,
        eventIcons: gw.eventIcons || []
      });
    }
    for (const score of player.providerScores || []) {
      if (!score.gameweekId) continue;
      const current = rounds.get(score.gameweekId) || {};
      current.final = score.finalPoints ?? current.final ?? null;
      current.providers = Object.fromEntries((score.providers || []).map((provider) => [
        systemKey(provider.name),
        provider.points
      ]));
      current.providerDetails = score.providers || [];
      current.matchText = score.matchText || "";
      const icons = new Set(current.eventIcons || []);
      for (const provider of score.providers || []) {
        for (const icon of provider.eventIcons || []) icons.add(icon);
      }
      current.eventIcons = [...icons];
      rounds.set(score.gameweekId, current);
    }
    lookup.set(String(player.playerId), { ...player, rounds });
  }
  for (const round of deep?.rounds || []) {
    for (const detail of round.playerDetails || []) {
      if (!detail?.playerId || detail.error) continue;
      const profile = lookup.get(String(detail.playerId)) || {
        playerId: String(detail.playerId),
        name: detail.name,
        position: detail.position,
        marketValue: detail.value,
        rounds: new Map()
      };
      const current = profile.rounds.get(String(detail.gameweekId)) || {};
      current.final = detail.points?.final ?? current.final ?? null;
      current.providers = {
        ...(current.providers || {}),
        final: detail.points?.final,
        as: detail.points?.as,
        marca: detail.points?.marca,
        mundoDeportivo: detail.points?.mundoDeportivo,
        sofascore: detail.points?.sofascore,
        marcaStats: detail.points?.marcaStats
      };
      current.events = detail.events || current.events || {};
      current.stats = detail.stats || current.stats || {};
      current.detail = detail;
      profile.rounds.set(String(detail.gameweekId), current);
      lookup.set(String(detail.playerId), profile);
    }
  }
  return lookup;
}

function scoreForPlayer(player, playerLookup, system = "final") {
  if (!player?.playerId) return numberOrNull(player?.points);
  if (system === "final") return numberOrNull(player.providerPoints?.final) ?? numberOrNull(player.points);
  if (player.providerPoints && Number.isFinite(player.providerPoints[system])) return player.providerPoints[system];
  const profile = playerLookup.get(String(player.playerId));
  const round = profile?.rounds?.get(String(player.gameweekId));
  if (system === "final") return round?.final ?? player.points ?? 0;
  return round?.providers?.[system] ?? null;
}

function roundRowsBySystem(round, playerLookup) {
  const systems = ["final", "as", "marca", "mundoDeportivo", "sofascore", "marcaStats"];
  const rowsBySystem = {};
  for (const system of systems) {
    rowsBySystem[system] = (round.userRounds || []).map((userRound) => {
      const lineup = userRound.lineup || [];
      const scoredPlayers = lineup
        .map((player) => scoreForPlayer(player, playerLookup, system))
        .filter((points) => Number.isFinite(points));
      const points = system === "final"
        ? round.standings?.find((row) => row.managerId === userRound.manager.managerId)?.points ?? sum(scoredPlayers)
        : sum(scoredPlayers);
      return {
        rank: 0,
        managerId: userRound.manager.managerId,
        initials: userRound.manager.initials,
        name: userRound.manager.name,
        points,
        value: round.standings?.find((row) => row.managerId === userRound.manager.managerId)?.value ?? null,
        played: scoredPlayers.length,
        availablePlayers: scoredPlayers.length,
        totalLineupPlayers: lineup.length
      };
    }).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }
  return rowsBySystem;
}

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function buildDeepRounds(deep, fallbackRounds, playerLookup) {
  if (!deep?.rounds?.length) return fallbackRounds.map((round) => ({ ...round, rowsBySystem: { final: round.rows } }));
  return deep.rounds.map((round) => {
    const rowsBySystem = roundRowsBySystem(round, playerLookup);
    const finalRows = round.standings?.length ? round.standings : rowsBySystem.final;
    return {
      round: round.round,
      gameweekId: round.gameweekId,
      status: round.status,
      rows: finalRows,
      rowsBySystem,
      matches: round.matches || [],
      bestXi: round.bestXi || [],
      leaguePlayers: round.leaguePlayers || [],
      userRounds: round.userRounds || []
    };
  }).sort((a, b) => a.round - b.round);
}

function slimRoundForDashboard(round) {
  return {
    round: round.round,
    gameweekId: round.gameweekId,
    status: round.status,
    rows: round.rows || [],
    rowsBySystem: round.rowsBySystem || { final: round.rows || [] },
    matches: round.matches || [],
    bestXi: (round.bestXi || []).slice(0, 11),
    summary: {
      userRounds: round.userRounds?.length || 0,
      playerDetails: round.playerDetails?.length || 0
    }
  };
}

function isClosedRound(round, feedClosedRounds) {
  if (feedClosedRounds.some((item) => item.round === round.round)) return true;
  if (round.status === "closed" && !round.rows?.some((row) => row.played)) return true;
  return false;
}

function eventCount(player, playerLookup, matcher) {
  const directEvents = Object.keys(player?.events || {});
  const directEventCount = directEvents
    .filter((icon) => matcher.test(icon))
    .reduce((total, key) => total + (Number(player.events[key]?.count) || 1), 0);
  if (directEventCount) return directEventCount;
  const profile = playerLookup.get(String(player.playerId));
  const round = profile?.rounds?.get(String(player.gameweekId));
  const eventKeys = Object.keys(round?.events || {});
  const endpointCount = eventKeys
    .filter((icon) => matcher.test(icon))
    .reduce((total, key) => total + (Number(round.events[key]?.count) || 1), 0);
  if (endpointCount) return endpointCount;
  return (round?.eventIcons || []).filter((icon) => matcher.test(icon)).length;
}

function statCount(player, playerLookup, key) {
  const direct = player?.stats?.[key]?.value;
  if (Number.isFinite(direct)) return direct;
  const profile = playerLookup.get(String(player?.playerId));
  const round = profile?.rounds?.get(String(player?.gameweekId));
  const value = round?.stats?.[key]?.value;
  return Number.isFinite(value) ? value : 0;
}

function playerPosition(player, playerLookup) {
  if (player?.position) return player.position;
  return playerLookup.get(String(player?.playerId))?.position || null;
}

function playerFinalPoints(player, playerLookup, fallbackGameweekId = null) {
  if (!player) return null;
  const enriched = fallbackGameweekId ? { ...player, gameweekId: fallbackGameweekId } : player;
  const points = scoreForPlayer(enriched, playerLookup, "final");
  return Number.isFinite(points) ? points : null;
}

function captainMultiplier(player, playerLookup) {
  const value = player.marketValue || playerLookup.get(String(player.playerId))?.marketValue || 0;
  if (value > 10000000) return 1.5;
  if (value > 5000000) return 2;
  return 3;
}

function playerBasePoints(player, playerLookup, fallbackGameweekId = null) {
  const points = playerFinalPoints(player, playerLookup, fallbackGameweekId);
  if (!Number.isFinite(points)) return null;
  const multiplier = Number(player.captainMultiplier) || (player.isCaptain ? captainMultiplier(player, playerLookup) : 1);
  return player.isCaptain && multiplier > 0 ? points / multiplier : points;
}

function captainChoiceResult(scored, playerLookup) {
  const candidates = scored
    .map((player) => {
      const basePoints = playerBasePoints(player, playerLookup);
      if (!Number.isFinite(basePoints)) return null;
      const multiplier = Number(player.captainMultiplier) || captainMultiplier(player, playerLookup);
      return {
        player,
        basePoints,
        multiplier,
        captainPoints: basePoints * multiplier,
        extra: basePoints * (multiplier - 1)
      };
    })
    .filter(Boolean);
  const chosen = candidates.find((item) => item.player.isCaptain);
  if (!chosen || !candidates.length) return { chosen: null, best: null, isCorrect: false };
  const bestCaptainPoints = Math.max(...candidates.map((item) => item.captainPoints));
  const bestBasePoints = Math.max(...candidates.map((item) => item.basePoints));
  const best = candidates.find((item) => item.captainPoints === bestCaptainPoints) || candidates[0];
  const tolerance = 0.001;
  return {
    chosen,
    best,
    isCorrect: Math.abs(chosen.captainPoints - bestCaptainPoints) <= tolerance || Math.abs(chosen.basePoints - bestBasePoints) <= tolerance
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

function cumulativeStandingsBySystem(teams, closedRounds, roundNumber, system) {
  const totals = new Map(teams.map((team) => [team.name, { ...team, points: 0 }]));
  closedRounds
    .filter((round) => round.round <= roundNumber)
    .forEach((round) => {
      const rows = round.rowsBySystem?.[system] || (system === "final" ? round.rows : []);
      rows.forEach((row) => {
        if (!totals.has(row.name)) totals.set(row.name, { name: row.name, initials: row.initials, points: 0 });
        totals.get(row.name).points += row.points;
      });
    });
  return Array.from(totals.values()).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

function buildAwardCounts(teams, closedRounds, teamValues, playerLookup = new Map()) {
  const counts = new Map(teams.map((team) => [team.name, {}]));
  const byRound = [];
  const previousUserRounds = new Map();
  let previousRows = [];
  const add = (teamName, awardId, round, value = null, provisional = false) => {
    if (!counts.has(teamName)) counts.set(teamName, {});
    counts.get(teamName)[awardId] = (counts.get(teamName)[awardId] || 0) + 1;
    byRound.push({ round, awardId, teamName, value, provisional });
  };

  for (const round of closedRounds) {
    const rows = [...round.rows].sort((a, b) => b.points - a.points);
    awardExtremes(rows, "points", "max").forEach((row) => add(row.name, "winner", round.round, `${row.points} pts`));
    awardExtremes(rows, "points", "min").forEach((row) => add(row.name, "loser", round.round, `${row.points} pts`));
    const withValue = rows
      .map((row) => {
        const value = row.value || teamValues.get(row.name) || 0;
        return { ...row, value, efficiency: value ? row.points / value : null };
      })
      .filter((row) => row.value && Number.isFinite(row.efficiency));
    if (withValue.length) {
      awardExtremes(withValue, "efficiency", "max").forEach((row) => add(row.name, "efficient", round.round, `${(row.points / row.value * 1000000).toFixed(2)} pts/M`, false));
      awardExtremes(withValue, "efficiency", "min").forEach((row) => add(row.name, "inefficient", round.round, `${(row.points / row.value * 1000000).toFixed(2)} pts/M`, false));
    }

    const userRounds = round.userRounds || [];
    const eventRows = userRounds.map((userRound) => {
      const lineup = userRound.lineup || [];
      const bench = userRound.bench || [];
      const scored = lineup.map((player) => ({
        ...player,
        position: playerPosition(player, playerLookup),
        finalPoints: playerFinalPoints(player, playerLookup) ?? player.points ?? null,
        goals: statCount(player, playerLookup, "goals") || eventCount(player, playerLookup, /^goal$/i),
        assists: statCount(player, playerLookup, "goalAssist") || eventCount(player, playerLookup, /assist/i),
        yellows: statCount(player, playerLookup, "yellowCard") || eventCount(player, playerLookup, /yellow/i),
        reds: statCount(player, playerLookup, "redCard") + statCount(player, playerLookup, "doubleYellowCard") || eventCount(player, playerLookup, /red/i)
      }));
      const benchScored = bench.map((player) => ({
        ...player,
        position: playerPosition(player, playerLookup),
        finalPoints: playerFinalPoints(player, playerLookup) ?? player.points ?? null
      }));
      const total = scored.reduce((sum, player) => sum + Math.max(0, Number(player.finalPoints) || 0), 0);
      const top = scored.reduce((best, player) => Number(player.finalPoints) > Number(best?.finalPoints ?? -Infinity) ? player : best, null);
      const captainResult = captainChoiceResult(scored, playerLookup);
      const dnp = scored.filter((player) => !Number.isFinite(player.finalPoints)).length;
      const benchMistakes = benchScored.filter((benchPlayer) => {
        if (!Number.isFinite(benchPlayer.finalPoints)) return false;
        const samePosition = scored.filter((starter) => starter.position && starter.position === benchPlayer.position && Number.isFinite(starter.finalPoints));
        if (!samePosition.length) return false;
        return benchPlayer.finalPoints > Math.min(...samePosition.map((starter) => starter.finalPoints));
      });
      const previous = previousUserRounds.get(userRound.manager.name);
      const directorDelta = previous ? lineupChangeDelta(previous.lineup || [], lineup, round.gameweekId, playerLookup) : null;
      return {
        team: userRound.manager.name,
        goals: scored.reduce((sum, player) => sum + player.goals, 0),
        assists: scored.reduce((sum, player) => sum + player.assists, 0),
        yellows: scored.reduce((sum, player) => sum + player.yellows, 0),
        reds: scored.reduce((sum, player) => sum + player.reds, 0),
        dnp,
        benchMistakes: benchMistakes.length,
        dependency: total > 0 && top ? top.finalPoints / total : null,
        coral: total > 0 && top ? top.finalPoints / total : null,
        captain: captainResult.chosen?.player || null,
        bestCaptain: captainResult.best,
        captainCorrect: captainResult.isCorrect,
        directorDelta,
        zero: rows.find((row) => row.name === userRound.manager.name)?.points === 0
      };
    });

    awardExtremes(eventRows.filter((row) => row.goals > 0), "goals", "max")
      .forEach((row) => add(row.team, "goals", round.round, `${row.goals} ${row.goals === 1 ? "gol" : "goles"}`));
    awardExtremes(eventRows.filter((row) => row.assists > 0), "assists", "max")
      .forEach((row) => add(row.team, "assists", round.round, `${row.assists} ${row.assists === 1 ? "asistencia" : "asistencias"}`));
    eventRows.filter((row) => row.reds > 0).forEach((row) => add(row.team, "red", round.round, `${row.reds} roja(s)`));
    awardExtremes(eventRows.filter((row) => row.dnp > 0), "dnp", "max")
      .forEach((row) => add(row.team, "dnp", round.round, `${row.dnp} sin jugar`));
    awardExtremes(eventRows.filter((row) => round.round >= LINEUP_AWARD_START_ROUND && row.benchMistakes > 0), "benchMistakes", "max")
      .forEach((row) => add(row.team, "bench", round.round, `${row.benchMistakes} cambios claros`));

    const dependencyRows = eventRows.filter((row) => Number.isFinite(row.dependency));
    if (dependencyRows.length) {
      awardExtremes(dependencyRows, "dependency", "max")
        .forEach((row) => add(row.team, "dependency", round.round, `${Math.round(row.dependency * 100)}%`));
      awardExtremes(dependencyRows, "coral", "min")
        .forEach((row) => add(row.team, "coral", round.round, `${Math.round(row.coral * 100)}%`));
    }

    eventRows
      .filter((row) => row.captainCorrect && row.captain?.playerId)
      .forEach((row) => add(row.team, "captain", round.round, row.captain.name));

    const directorRows = eventRows.filter((row) => Number.isFinite(row.directorDelta));
    if (directorRows.length) {
      awardExtremes(directorRows, "directorDelta", "max")
        .forEach((row) => add(row.team, "directorGood", round.round, `${row.directorDelta > 0 ? "+" : ""}${row.directorDelta} pts`));
      awardExtremes(directorRows, "directorDelta", "min")
        .forEach((row) => add(row.team, "directorBad", round.round, `${row.directorDelta > 0 ? "+" : ""}${row.directorDelta} pts`));
    }

    const valueDeltas = rows.map((row) => {
      const previous = previousRows.find((previousRow) => previousRow.name === row.name);
      return previous && row.value && previous.value ? { name: row.name, delta: row.value - previous.value } : null;
    }).filter(Boolean);
    if (valueDeltas.length) {
      awardExtremes(valueDeltas, "delta", "max")
        .forEach((row) => add(row.name, "trader", round.round, formatMoneyDelta(row.delta)));
      awardExtremes(valueDeltas, "delta", "min")
        .forEach((row) => add(row.name, "traderBad", round.round, formatMoneyDelta(row.delta)));
    }

    eventRows.filter((row) => row.zero).forEach((row) => add(row.team, "negative", round.round, "0 pts"));

    previousRows = rows;
    for (const userRound of userRounds) previousUserRounds.set(userRound.manager.name, userRound);
  }

  return {
    counts: Object.fromEntries(Array.from(counts.entries())),
    byRound
  };
}

function awardExtremes(rows, key, direction) {
  const values = rows
    .map((row) => Number(row[key]))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return [];
  const target = direction === "min" ? Math.min(...values) : Math.max(...values);
  const tolerance = Math.max(Math.abs(target) * 1e-9, 1e-12);
  return rows.filter((row) => Number.isFinite(Number(row[key])) && Math.abs(Number(row[key]) - target) <= tolerance);
}

function lineupChangeDelta(previousLineup, currentLineup, gameweekId, playerLookup) {
  const previousIds = new Set(previousLineup.map((player) => String(player.playerId)).filter(Boolean));
  const currentIds = new Set(currentLineup.map((player) => String(player.playerId)).filter(Boolean));
  const added = currentLineup.filter((player) => player.playerId && !previousIds.has(String(player.playerId)));
  const removed = previousLineup.filter((player) => player.playerId && !currentIds.has(String(player.playerId)));
  if (!added.length && !removed.length) return 0;
  const addedPoints = sum(added.map((player) => playerFinalPoints(player, playerLookup, gameweekId) ?? 0));
  const removedPoints = sum(removed.map((player) => playerFinalPoints(player, playerLookup, gameweekId) ?? 0));
  return addedPoints - removedPoints;
}

function formatMoneyDelta(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${Math.round(value / 100000) / 10}M`;
}

function buildVolatility(teams, closedRounds) {
  return teams.map((team) => {
    const points = closedRounds.map((round) => round.rows.find((row) => row.name === team.name)?.points ?? 0);
    const average = points.reduce((sum, value) => sum + value, 0) / Math.max(1, points.length);
    const variance = points.reduce((sum, value) => sum + (value - average) ** 2, 0) / Math.max(1, points.length);
    return { ...team, average, volatility: Math.sqrt(variance), points };
  }).sort((a, b) => a.volatility - b.volatility);
}

function buildDetailedCharts(teams, closedRounds, playerLookup) {
  const teamRows = new Map(teams.map((team) => [team.name, {
    ...team,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    dnp: 0,
    points: 0,
    pointsByPosition: { goalkeeper: 0, defender: 0, midfielder: 0, forward: 0 },
    playersByPosition: { goalkeeper: 0, defender: 0, midfielder: 0, forward: 0 },
    topPlayerPoints: 0,
    rounds: []
  }]));
  const playerRows = new Map();
  const roundBreakdown = [];

  for (const round of closedRounds) {
    const roundTeams = [];
    for (const userRound of round.userRounds || []) {
      const teamName = userRound.manager.name;
      const row = teamRows.get(teamName) || {
        name: teamName,
        initials: userRound.manager.initials,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        dnp: 0,
        points: 0,
        pointsByPosition: { goalkeeper: 0, defender: 0, midfielder: 0, forward: 0 },
        playersByPosition: { goalkeeper: 0, defender: 0, midfielder: 0, forward: 0 },
        topPlayerPoints: 0,
        rounds: []
      };
      const lineup = userRound.lineup || [];
      let roundGoals = 0;
      let roundAssists = 0;
      let roundYellows = 0;
      let roundReds = 0;
      let roundDnp = 0;
      let roundTop = 0;
      const roundByPosition = { goalkeeper: 0, defender: 0, midfielder: 0, forward: 0 };

      for (const player of lineup) {
        const points = playerFinalPoints(player, playerLookup) ?? 0;
        const position = playerPosition(player, playerLookup);
        const goals = statCount(player, playerLookup, "goals") || eventCount(player, playerLookup, /^goal$/i);
        const assists = statCount(player, playerLookup, "goalAssist") || eventCount(player, playerLookup, /assist/i);
        const yellowCards = statCount(player, playerLookup, "yellowCard") || eventCount(player, playerLookup, /yellow/i);
        const redCards = statCount(player, playerLookup, "redCard") + statCount(player, playerLookup, "doubleYellowCard") || eventCount(player, playerLookup, /red/i);
        roundGoals += goals;
        roundAssists += assists;
        roundYellows += yellowCards;
        roundReds += redCards;
        if (!Number.isFinite(playerFinalPoints(player, playerLookup))) roundDnp += 1;
        roundTop = Math.max(roundTop, Number(points) || 0);
        if (position) {
          row.pointsByPosition[position] = (row.pointsByPosition[position] || 0) + (Number(points) || 0);
          row.playersByPosition[position] = (row.playersByPosition[position] || 0) + 1;
          roundByPosition[position] = (roundByPosition[position] || 0) + (Number(points) || 0);
        }

        const playerKey = String(player.playerId || player.name);
        const playerRow = playerRows.get(playerKey) || {
          playerId: player.playerId,
          name: player.name,
          team: teamName,
          position,
          points: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          appearances: 0
        };
        playerRow.points += Number(points) || 0;
        playerRow.goals += goals;
        playerRow.assists += assists;
        playerRow.yellowCards += yellowCards;
        playerRow.redCards += redCards;
        playerRow.appearances += 1;
        playerRows.set(playerKey, playerRow);
      }

      const standingsPoints = round.rows.find((item) => item.name === teamName)?.points ?? sum(lineup.map((player) => playerFinalPoints(player, playerLookup) ?? 0));
      row.goals += roundGoals;
      row.assists += roundAssists;
      row.yellowCards += roundYellows;
      row.redCards += roundReds;
      row.dnp += roundDnp;
      row.points += standingsPoints;
      row.topPlayerPoints += roundTop;
      row.rounds.push({
        round: round.round,
        points: standingsPoints,
        goals: roundGoals,
        assists: roundAssists,
        yellowCards: roundYellows,
        redCards: roundReds,
        dnp: roundDnp,
        dependency: standingsPoints > 0 ? roundTop / standingsPoints : null,
        pointsByPosition: roundByPosition
      });
      teamRows.set(teamName, row);
      roundTeams.push({
        name: teamName,
        initials: userRound.manager.initials,
        points: standingsPoints,
        goals: roundGoals,
        assists: roundAssists,
        yellowCards: roundYellows,
        redCards: roundReds,
        dnp: roundDnp,
        dependency: standingsPoints > 0 ? roundTop / standingsPoints : null,
        pointsByPosition: roundByPosition
      });
    }
    roundBreakdown.push({ round: round.round, teams: roundTeams });
  }

  const teamsSummary = [...teamRows.values()].map((row) => ({
    ...row,
    dependency: row.points > 0 ? row.topPlayerPoints / row.points : null,
    disciplineScore: row.yellowCards + row.redCards * 3
  }));

  return {
    teams: teamsSummary,
    byRound: roundBreakdown,
    goalsByTeam: teamsSummary.slice().sort((a, b) => b.goals - a.goals),
    assistsByTeam: teamsSummary.slice().sort((a, b) => b.assists - a.assists),
    disciplineByTeam: teamsSummary.slice().sort((a, b) => b.disciplineScore - a.disciplineScore),
    dependencyByTeam: teamsSummary.slice().sort((a, b) => (b.dependency || 0) - (a.dependency || 0)),
    positionPointsByTeam: teamsSummary.map((row) => ({
      name: row.name,
      initials: row.initials,
      ...row.pointsByPosition
    })),
    topPlayers: [...playerRows.values()].sort((a, b) => b.points - a.points).slice(0, 25),
    topScorers: [...playerRows.values()].sort((a, b) => b.goals - a.goals).slice(0, 25),
    topAssistants: [...playerRows.values()].sort((a, b) => b.assists - a.assists).slice(0, 25)
  };
}

function teamKey(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildBiwengerStats(teams, closedRounds, playerLookup, teamValues, transfersData, transferHistory, marketHistory) {
  const teamNames = new Set(teams.map((team) => team.name));
  const teamsRows = teams.map((team) => ({
    user_name: team.name,
    initials: team.initials,
    team_value: teamValues.get(team.name) || null
  }));
  const positionProgress = [];
  const roundCountsMap = new Map(teams.map((team) => [team.name, {
    user_name: team.name,
    wins: 0,
    losses: 0,
    avg_position: 0,
    rounds: 0
  }]));
  const teamAgg = new Map(teams.map((team) => [team.name, {
    user_name: team.name,
    initials: team.initials,
    points: 0,
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    discipline_index: 0,
    playerPoints: new Map(),
    playerGoals: new Map(),
    positionPoints: Object.fromEntries(POSITION_ORDER.map((position) => [position, 0])),
    positionGoals: Object.fromEntries(POSITION_ORDER.map((position) => [position, 0])),
    positionAssists: Object.fromEntries(POSITION_ORDER.map((position) => [position, 0])),
    positionPlayers: Object.fromEntries(POSITION_ORDER.map((position) => [position, new Set()])),
    playersSeen: new Map()
  }]));

  for (const round of closedRounds) {
    const standings = cumulativeStandings(teams, closedRounds, round.round);
    standings.forEach((row, index) => {
      const lineupPoints = round.rows.find((item) => item.name === row.name)?.points ?? 0;
      positionProgress.push({
        round_order: round.round,
        round_name: `J${round.round}`,
        user_name: row.name,
        initials: row.initials,
        league_position: index + 1,
        total_points_after_round: row.points,
        lineup_points: lineupPoints,
        team_value: round.rows.find((item) => item.name === row.name)?.value || teamValues.get(row.name) || null
      });
      const counts = roundCountsMap.get(row.name);
      if (counts) {
        counts.avg_position += index + 1;
        counts.rounds += 1;
      }
    });

    const sortedRound = [...round.rows].sort((a, b) => b.points - a.points);
    if (sortedRound[0]) roundCountsMap.get(sortedRound[0].name).wins += 1;
    if (sortedRound.at(-1)) roundCountsMap.get(sortedRound.at(-1).name).losses += 1;

    for (const userRound of round.userRounds || []) {
      const teamName = userRound.manager.name;
      const agg = teamAgg.get(teamName);
      if (!agg) continue;
      const roundPoints = round.rows.find((row) => row.name === teamName)?.points ?? 0;
      agg.points += Number(roundPoints) || 0;

      for (const player of userRound.lineup || []) {
        const playerId = String(player.playerId || player.name);
        const playerName = player.name || playerLookup.get(playerId)?.name || playerId;
        const points = playerFinalPoints(player, playerLookup) ?? 0;
        const goals = statCount(player, playerLookup, "goals") || eventCount(player, playerLookup, /^goal$/i);
        const assists = statCount(player, playerLookup, "goalAssist") || eventCount(player, playerLookup, /assist/i);
        const yellowCards = statCount(player, playerLookup, "yellowCard") || eventCount(player, playerLookup, /yellow/i);
        const redCards = statCount(player, playerLookup, "redCard") + statCount(player, playerLookup, "doubleYellowCard") || eventCount(player, playerLookup, /red/i);
        const position = playerPosition(player, playerLookup) || "unknown";

        agg.goals += goals;
        agg.assists += assists;
        agg.yellow_cards += yellowCards;
        agg.red_cards += redCards;
        agg.discipline_index += yellowCards * 2.5 + redCards * 5;
        agg.playerPoints.set(playerName, (agg.playerPoints.get(playerName) || 0) + (Number(points) || 0));
        agg.playerGoals.set(playerName, (agg.playerGoals.get(playerName) || 0) + goals);
        if (POSITION_ORDER.includes(position)) {
          agg.positionPoints[position] += Number(points) || 0;
          agg.positionGoals[position] += goals;
          agg.positionAssists[position] += assists;
          agg.positionPlayers[position].add(playerName);
        }
        const seen = agg.playersSeen.get(playerName) || { player_name: playerName, rounds: 0, points: 0, goals: 0, assists: 0, position };
        seen.rounds += 1;
        seen.points += Number(points) || 0;
        seen.goals += goals;
        seen.assists += assists;
        agg.playersSeen.set(playerName, seen);
      }
    }
  }

  const latestRound = Math.max(0, ...closedRounds.map((round) => round.round));
  const latestStandings = latestRound
    ? cumulativeStandings(teams, closedRounds, latestRound).map((row, index) => ({
      league_position: index + 1,
      user_name: row.name,
      initials: row.initials,
      total_points_after_round: row.points,
      team_value: teamValues.get(row.name) || null
    }))
    : [];
  const roundCounts = [...roundCountsMap.values()].map((row) => ({
    ...row,
    avg_position: row.rounds ? row.avg_position / row.rounds : null
  }));
  const volatility = buildVolatility(teams, closedRounds).map((row) => ({
    user_name: row.name,
    initials: row.initials,
    average_points: row.average,
    volatility: row.volatility,
    points: row.points
  }));

  const teamGoals = [...teamAgg.values()].map((row) => ({
    user_name: row.user_name,
    initials: row.initials,
    goals: row.goals,
    assists: row.assists
  })).sort((a, b) => b.goals - a.goals);
  const goalDependence = [...teamAgg.values()].map((row) => {
    const total = row.goals || 0;
    const top = [...row.playerGoals.entries()].sort((a, b) => b[1] - a[1])[0] || [null, 0];
    return {
      user_name: row.user_name,
      player_name: top[0],
      goals: top[1],
      total_goals: total,
      share: total ? top[1] / total : 0
    };
  }).sort((a, b) => b.share - a.share);
  const pointDependence = [...teamAgg.values()].map((row) => {
    const total = row.points || 0;
    const top = [...row.playerPoints.entries()].sort((a, b) => b[1] - a[1])[0] || [null, 0];
    return {
      user_name: row.user_name,
      player_name: top[0],
      points: top[1],
      total_points: total,
      share: total ? top[1] / total : 0
    };
  }).sort((a, b) => b.share - a.share);
  const discipline = [...teamAgg.values()].map((row) => ({
    user_name: row.user_name,
    yellow_cards: row.yellow_cards,
    red_cards: row.red_cards,
    discipline_index: row.discipline_index
  })).sort((a, b) => b.discipline_index - a.discipline_index);
  const positionSummary = [...teamAgg.values()].flatMap((row) => {
    const positionalTotal = Math.max(1, sum(POSITION_ORDER.map((position) => row.positionPoints[position] || 0)));
    return POSITION_ORDER.map((position) => ({
      user_name: row.user_name,
      position_id: position,
      position_name: POSITION_LABELS[position],
      position_points: row.positionPoints[position] || 0,
      position_goals: row.positionGoals[position] || 0,
      position_assists: row.positionAssists[position] || 0,
      players_used: row.positionPlayers[position]?.size || 0,
      point_share: (row.positionPoints[position] || 0) / positionalTotal
    }));
  });
  const positionBestPlayers = [...teamAgg.values()].flatMap((row) => {
    return [...row.playersSeen.values()].map((player) => ({
      user_name: row.user_name,
      player_name: player.player_name,
      position_id: player.position,
      position_name: POSITION_LABELS[player.position] || "Sin posición",
      points: player.points,
      goals: player.goals,
      assists: player.assists,
      rounds: player.rounds
    }));
  }).sort((a, b) => b.points - a.points);
  const loyalty = [...teamAgg.values()].map((row) => {
    const players = [...row.playersSeen.values()];
    return {
      user_name: row.user_name,
      players_used: players.length,
      average_rounds_per_player: players.length ? sum(players.map((player) => player.rounds)) / players.length : 0,
      lineup_slots: sum(players.map((player) => player.rounds))
    };
  }).sort((a, b) => b.average_rounds_per_player - a.average_rounds_per_player);
  const concentration = [...teamAgg.values()].map((row) => {
    const total = Math.max(1, row.points);
    const shares = [...row.playerPoints.values()].map((points) => Math.max(0, points) / total);
    return {
      user_name: row.user_name,
      concentration_index: shares.reduce((acc, share) => acc + share ** 2, 0),
      top_player_share: Math.max(0, ...shares)
    };
  }).sort((a, b) => b.concentration_index - a.concentration_index);
  const valueEfficiency = latestStandings.map((row) => ({
    user_name: row.user_name,
    total_points_after_round: row.total_points_after_round,
    team_value: row.team_value,
    points_per_million: row.team_value ? row.total_points_after_round / (row.team_value / 1000000) : null
  })).sort((a, b) => (b.points_per_million || 0) - (a.points_per_million || 0));

  const transfers = normalizeTransferRows(transfersData, transferHistory, deepPlayerMovements(playerLookup)).filter((row) => teamNames.has(row.from) || teamNames.has(row.to));
  const marketActivitySummary = teams.map((team) => {
    const purchases = transfers.filter((row) => teamKey(row.to) === teamKey(team.name));
    const sales = transfers.filter((row) => teamKey(row.from) === teamKey(team.name));
    return {
      user_name: team.name,
      purchases: purchases.length,
      sales: sales.length,
      market_volume: sum([...purchases, ...sales].map((row) => row.price || 0)),
      visible_movements: purchases.length + sales.length
    };
  }).sort((a, b) => b.visible_movements - a.visible_movements);
  const completedTrades = buildCompletedTrades(transfers);
  const tradeSummary = teams.map((team) => {
    const rows = completedTrades.filter((row) => teamKey(row.user_name) === teamKey(team.name));
    const totalBuy = sum(rows.map((row) => row.buy_price || 0));
    const profit = sum(rows.map((row) => row.profit || 0));
    return {
      user_name: team.name,
      completed_trades: rows.length,
      profit,
      roi: totalBuy ? profit / totalBuy : null
    };
  }).sort((a, b) => b.profit - a.profit);
  const currentSignings = buildCurrentSignings(closedRounds);
  const signingPoints = currentSignings.map((signing) => ({
    ...signing,
    points_after_signing: estimateSigningPoints(signing, closedRounds, playerLookup),
    first_round_points: estimateFirstRoundSigningPoints(signing, closedRounds, playerLookup)
  })).sort((a, b) => (b.points_after_signing || 0) - (a.points_after_signing || 0));

  return {
    generated_from: "mister-json-endpoints",
    teams: teamsRows,
    latest_standings: latestStandings,
    position_progress: positionProgress,
    round_counts: roundCounts,
    volatility,
    team_goals: teamGoals,
    goal_dependence: goalDependence,
    point_dependence: pointDependence,
    discipline,
    position_summary: positionSummary,
    position_best_players: positionBestPlayers,
    value_efficiency: valueEfficiency,
    loyalty,
    concentration,
    market_activity_summary: marketActivitySummary,
    transfers,
    completed_trades: completedTrades,
    trade_summary: tradeSummary,
    signing_points: signingPoints,
    first_round_signing_points: signingPoints.filter((row) => Number.isFinite(row.first_round_points)).sort((a, b) => b.first_round_points - a.first_round_points),
    coverage: {
      closed_rounds: closedRounds.length,
      transfers_visible: transfers.length,
      market_snapshots: marketHistory.length,
      notes: [
        "Las métricas deportivas salen de alineaciones cerradas y del detalle jugador-jornada.",
        "Las compras/ventas históricas dependen del feed visible y de los snapshots diarios acumulados desde ahora.",
        "Peor alineador se calcula desde el corte configurado; director deportivo se calcula desde la primera jornada con XI anterior comparable."
      ]
    }
  };
}

function deepPlayerMovements(playerLookup) {
  return [...playerLookup.values()].flatMap((player) => player.movements || []);
}

function normalizeTransferRows(latest, history, playerMovements = []) {
  const rows = [];
  for (const transfer of latest?.transfers || []) rows.push(transfer);
  for (const entry of history || []) {
    if (Array.isArray(entry.transfers)) rows.push(...entry.transfers);
    else if (entry.playerName) rows.push(entry);
  }
  rows.push(...playerMovements);
  const seen = new Set();
  return rows
    .map((row) => ({
      scrapedAt: row.scrapedAt || null,
      dateText: row.dateText || null,
      source: row.source || "feed",
      playerId: row.playerId || null,
      playerName: row.playerName || row.name || null,
      from: row.from || null,
      to: row.to || null,
      price: numberOrNull(row.price),
      raw: row.raw || null
    }))
    .filter((row) => row.playerName && row.from && row.to)
    .filter((row) => {
      const key = [row.playerName, row.from, row.to, row.price ?? "", row.dateText ?? ""].map(teamKey).join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function buildCompletedTrades(transfers) {
  const byPlayer = new Map();
  for (const transfer of transfers.filter((row) => Number.isFinite(row.price))) {
    const key = teamKey(transfer.playerName);
    if (!byPlayer.has(key)) byPlayer.set(key, []);
    byPlayer.get(key).push(transfer);
  }
  const trades = [];
  for (const movements of byPlayer.values()) {
    const ordered = movements.slice().sort((a, b) => String(a.scrapedAt || "").localeCompare(String(b.scrapedAt || "")));
    const openBuys = new Map();
    for (const movement of ordered) {
      if (movement.to && movement.to !== "Mister") {
        openBuys.set(teamKey(movement.to), movement);
      }
      if (movement.from && movement.from !== "Mister") {
        const buy = openBuys.get(teamKey(movement.from));
        if (buy && Number.isFinite(buy.price) && Number.isFinite(movement.price)) {
          const profit = movement.price - buy.price;
          trades.push({
            user_name: movement.from,
            player_name: movement.playerName,
            buy_price: buy.price,
            sell_price: movement.price,
            profit,
            roi: buy.price ? profit / buy.price : null,
            buy_seen_at: buy.scrapedAt,
            sell_seen_at: movement.scrapedAt
          });
          openBuys.delete(teamKey(movement.from));
        }
      }
    }
  }
  return trades.sort((a, b) => b.profit - a.profit);
}

function buildCurrentSignings(closedRounds) {
  const latest = closedRounds.at(-1);
  const signings = [];
  for (const userRound of latest?.userRounds || []) {
    for (const player of userRound.currentSquad || userRound.squad || []) {
      if (!player?.playerId) continue;
      signings.push({
        user_name: userRound.manager.name,
        player_id: player.playerId,
        player_name: player.name,
        position_id: player.position,
        position_name: POSITION_LABELS[player.position] || player.position || "Sin posición",
        buy_date: player.acquiredAt || null,
        buy_price: player.acquisitionPrice,
        market_value: player.marketValue
      });
    }
  }
  const seen = new Set();
  return signings.filter((row) => {
    const key = `${teamKey(row.user_name)}|${row.player_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function estimateSigningPoints(signing, closedRounds, playerLookup) {
  let total = 0;
  let found = false;
  for (const round of closedRounds) {
    for (const userRound of round.userRounds || []) {
      if (teamKey(userRound.manager.name) !== teamKey(signing.user_name)) continue;
      const player = (userRound.lineup || []).find((item) => String(item.playerId) === String(signing.player_id));
      if (!player) continue;
      const points = playerFinalPoints(player, playerLookup);
      if (Number.isFinite(points)) {
        total += points;
        found = true;
      }
    }
  }
  return found ? total : null;
}

function estimateFirstRoundSigningPoints(signing, closedRounds, playerLookup) {
  for (const round of closedRounds) {
    for (const userRound of round.userRounds || []) {
      if (teamKey(userRound.manager.name) !== teamKey(signing.user_name)) continue;
      const player = (userRound.lineup || []).find((item) => String(item.playerId) === String(signing.player_id));
      if (!player) continue;
      const points = playerFinalPoints(player, playerLookup);
      if (Number.isFinite(points)) return points;
    }
  }
  return null;
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
  const deep = await readJson("data/mister/latest/deep.json", {});
  const transfers = await readJson("data/mister/latest/transfers.json", { transfers: [] });
  const pigHistory = await readJson("data/cerdo/history.json", { rounds: [] });
  const calendar = await readJson("data/laliga/calendar.json", { rounds: [] });
  const marketHistory = await readJsonl("data/mister/market-history.jsonl");
  const transferHistory = await readJsonl("data/mister/transfer-history.jsonl");

  const parsedStandings = parseStandings(standings.users || []);
  const closedRounds = parseClosedRoundsFromFeedText(feed.headlineText || "");
  const playerLookup = buildPlayerLookup(deep);
  const deepRounds = buildDeepRounds(deep, closedRounds.length ? closedRounds : FALLBACK_CLOSED_ROUNDS, playerLookup);
  const effectiveClosedRounds = deepRounds.length
    ? deepRounds.filter((round) => isClosedRound(round, closedRounds))
    : closedRounds.length ? closedRounds : FALLBACK_CLOSED_ROUNDS;
  const liveRounds = deepRounds.filter((round) => !isClosedRound(round, closedRounds));
  const teams = parsedStandings.general.length
    ? parsedStandings.general.map((row) => ({ name: row.name, initials: row.initials }))
    : deep?.managers?.length
      ? deep.managers.map((row) => ({ name: row.name, initials: row.initials, managerId: row.managerId }))
      : effectiveClosedRounds[0].rows.map((row) => ({ name: row.name, initials: row.initials }));
  const teamValues = new Map(parsedStandings.general.map((row) => [row.name, row.value || 0]));
  const latestClosedRound = Math.max(0, ...effectiveClosedRounds.map((round) => round.round));
  const scoringSystems = [
    { id: "final", name: "Mixto" },
    { id: "as", name: "AS" },
    { id: "marca", name: "Marca" },
    { id: "mundoDeportivo", name: "Mundo Deportivo" },
    { id: "sofascore", name: "Sofascore" },
    { id: "marcaStats", name: "Marca Stats" }
  ];
  const detailedCharts = buildDetailedCharts(teams, effectiveClosedRounds, playerLookup);
  const stats = buildBiwengerStats(teams, effectiveClosedRounds, playerLookup, teamValues, transfers, transferHistory, marketHistory);

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
      lineupAwardStartRound: LINEUP_AWARD_START_ROUND,
      limitations: [
        "Peor alineador no se calcula para jornadas anteriores al corte configurado; director deportivo se calcula desde que hay XI anterior comparable.",
        "Las clasificaciones por sistema de puntuación usan el endpoint interno de jugador-jornada; si un jugador no puntuó, queda como sin dato en ese sistema.",
        "El mercado diario depende de que la Action diaria siga ejecutándose y acumulando snapshots."
      ]
    },
    teams,
    currentStandings: parsedStandings.general,
    closedRounds: effectiveClosedRounds.map(slimRoundForDashboard),
    liveRounds: liveRounds.length ? liveRounds.map(slimRoundForDashboard) : parsedStandings.live.length ? [{ round: latestClosedRound + 1, status: "in_progress", rows: parsedStandings.live, rowsBySystem: { final: parsedStandings.live } }] : [],
    cumulative: Array.from({ length: latestClosedRound + 1 }, (_, round) => ({ round, rows: cumulativeStandings(teams, effectiveClosedRounds, round) })),
    cumulativeBySystem: Object.fromEntries(scoringSystems.map((system) => [
      system.id,
      Array.from({ length: latestClosedRound + 1 }, (_, round) => ({
        round,
        rows: cumulativeStandingsBySystem(teams, effectiveClosedRounds, round, system.id)
      }))
    ])),
    awards: {
      definitions: AWARD_DEFINITIONS,
      ...buildAwardCounts(teams, effectiveClosedRounds, teamValues, playerLookup)
    },
    charts: {
      availableViews: BIWENGER_VIEWS,
      volatility: buildVolatility(teams, effectiveClosedRounds),
      ...detailedCharts,
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
    stats,
    market: buildMarketSummary(market, marketHistory),
    players: {
      searchTop: (search.players || []).map(parsePlayerText).filter((player) => player.name).slice(0, 80),
      mySquad: (team.players || []).map(parsePlayerText).filter((player) => player.name),
      profiles: (deep.playerProfiles || []).map((player) => ({
        playerId: player.playerId,
        name: player.name,
        position: player.position,
        totalPoints: player.totalPoints,
        average: player.average,
        marketValue: player.marketValue,
        goals: player.goals,
        assists: player.assists,
        cards: player.cards,
        yellowCards: player.totals?.yellowCards,
        redCards: player.totals?.redCards,
        ownerNotice: player.ownerNotice,
        owner: player.owner || null,
        movements: player.movements || [],
        valueHistory: player.valueHistory || [],
        pointsHistory: player.pointsHistory || []
      }))
    },
    scoringSystems,
    deep: {
      scrapedAt: deep.scrapedAt || null,
      gameweeks: deep.gameweeks || [],
      managers: deep.managers || [],
      playerProfiles: deep.playerProfiles?.length || 0
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
