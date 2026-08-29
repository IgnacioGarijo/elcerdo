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
  { id: "red", icon: "🟥", kind: "bad", name: "Recibió roja", requirement: "player_round_events" },
  { id: "dnp", icon: "🧊", kind: "bad", name: "Más jugadores sin jugar", requirement: "lineup_slots" },
  { id: "dependency", icon: "🧲", kind: "bad", name: "Mayor dependencia", requirement: "player_round_points" },
  { id: "coral", icon: "🧬", kind: "good", name: "Equipo más coral", requirement: "player_round_points" },
  { id: "captain", icon: "👑", kind: "good", name: "Capitán adecuado", requirement: "captain_selection" },
  { id: "bench", icon: "🪑", kind: "bad", name: "Peor alineador", requirement: "bench_points" },
  { id: "directorGood", icon: "🧠", kind: "good", name: "Mejor director deportivo", requirement: "roster_delta" },
  { id: "directorBad", icon: "📉", kind: "bad", name: "Peor director deportivo", requirement: "roster_delta" },
  { id: "trader", icon: "📈", kind: "good", name: "Mejor trader", requirement: "daily_value_snapshots" },
  { id: "traderBad", icon: "💸", kind: "bad", name: "Peor trader", requirement: "daily_value_snapshots" },
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
  return lookup;
}

function scoreForPlayer(player, playerLookup, system = "final") {
  if (!player?.playerId) return player.points ?? 0;
  const profile = playerLookup.get(String(player.playerId));
  const round = profile?.rounds?.get(String(player.gameweekId));
  if (system === "final") return round?.final ?? player.points ?? 0;
  return round?.providers?.[system] ?? null;
}

function roundRowsBySystem(round, playerLookup) {
  const systems = ["final", "as", "marca", "mundoDeportivo", "sofascore"];
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

function isClosedRound(round, feedClosedRounds) {
  if (feedClosedRounds.some((item) => item.round === round.round)) return true;
  if (round.status === "closed" && !round.rows?.some((row) => row.played)) return true;
  return false;
}

function eventCount(player, playerLookup, matcher) {
  const profile = playerLookup.get(String(player.playerId));
  const round = profile?.rounds?.get(String(player.gameweekId));
  return (round?.eventIcons || []).filter((icon) => matcher.test(icon)).length;
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
  if (value >= 5000000) return 2;
  return 3;
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
    add(rows[0].name, "winner", round.round, `${rows[0].points} pts`);
    add(rows.at(-1).name, "loser", round.round, `${rows.at(-1).points} pts`);
    const withValue = rows
      .map((row) => {
        const value = row.value || teamValues.get(row.name) || 0;
        return { ...row, value, efficiency: value ? row.points / value : null };
      })
      .filter((row) => row.value && Number.isFinite(row.efficiency));
    if (withValue.length) {
      withValue.sort((a, b) => b.efficiency - a.efficiency);
      add(withValue[0].name, "efficient", round.round, `${(withValue[0].points / (withValue[0].value || teamValues.get(withValue[0].name)) * 1000000).toFixed(2)} pts/M`, !withValue[0].value);
      add(withValue.at(-1).name, "inefficient", round.round, `${(withValue.at(-1).points / (withValue.at(-1).value || teamValues.get(withValue.at(-1).name)) * 1000000).toFixed(2)} pts/M`, !withValue.at(-1).value);
    }

    const userRounds = round.userRounds || [];
    const eventRows = userRounds.map((userRound) => {
      const lineup = userRound.lineup || [];
      const bench = userRound.bench || [];
      const scored = lineup.map((player) => ({
        ...player,
        position: playerPosition(player, playerLookup),
        finalPoints: playerFinalPoints(player, playerLookup) ?? player.points ?? null,
        goals: eventCount(player, playerLookup, /goal/i),
        reds: eventCount(player, playerLookup, /red/i)
      }));
      const benchScored = bench.map((player) => ({
        ...player,
        position: playerPosition(player, playerLookup),
        finalPoints: playerFinalPoints(player, playerLookup) ?? player.points ?? null
      }));
      const total = scored.reduce((sum, player) => sum + Math.max(0, Number(player.finalPoints) || 0), 0);
      const top = scored.reduce((best, player) => Number(player.finalPoints) > Number(best?.finalPoints ?? -Infinity) ? player : best, null);
      const captain = scored.find((player) => player.isCaptain);
      const bestCaptain = scored.reduce((best, player) => {
        const extra = (Number(player.finalPoints) || 0) * (captainMultiplier(player, playerLookup) - 1);
        return extra > (best?.extra ?? -Infinity) ? { player, extra } : best;
      }, null);
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
        reds: scored.reduce((sum, player) => sum + player.reds, 0),
        dnp,
        benchMistakes: benchMistakes.length,
        dependency: total > 0 && top ? top.finalPoints / total : null,
        coral: total > 0 && top ? top.finalPoints / total : null,
        captain,
        bestCaptain,
        directorDelta,
        zero: rows.find((row) => row.name === userRound.manager.name)?.points === 0
      };
    });

    const goalRows = eventRows.filter((row) => row.goals > 0).sort((a, b) => b.goals - a.goals);
    if (goalRows.length) add(goalRows[0].team, "goals", round.round, `${goalRows[0].goals} goles`);
    eventRows.filter((row) => row.reds > 0).forEach((row) => add(row.team, "red", round.round, `${row.reds} roja(s)`));
    const dnpRows = eventRows.filter((row) => row.dnp > 0).sort((a, b) => b.dnp - a.dnp);
    if (dnpRows.length) add(dnpRows[0].team, "dnp", round.round, `${dnpRows[0].dnp} sin jugar`);
    const benchRows = eventRows.filter((row) => row.benchMistakes > 0).sort((a, b) => b.benchMistakes - a.benchMistakes);
    if (benchRows.length) add(benchRows[0].team, "bench", round.round, `${benchRows[0].benchMistakes} cambios claros`);

    const dependencyRows = eventRows.filter((row) => Number.isFinite(row.dependency));
    if (dependencyRows.length) {
      dependencyRows.sort((a, b) => b.dependency - a.dependency);
      add(dependencyRows[0].team, "dependency", round.round, `${Math.round(dependencyRows[0].dependency * 100)}%`);
      add(dependencyRows.at(-1).team, "coral", round.round, `${Math.round(dependencyRows.at(-1).coral * 100)}%`);
    }

    eventRows
      .filter((row) => row.captain?.playerId && row.bestCaptain?.player?.playerId && String(row.captain.playerId) === String(row.bestCaptain.player.playerId))
      .forEach((row) => add(row.team, "captain", round.round, row.captain.name));

    const directorRows = eventRows.filter((row) => Number.isFinite(row.directorDelta));
    if (directorRows.length) {
      directorRows.sort((a, b) => b.directorDelta - a.directorDelta);
      add(directorRows[0].team, "directorGood", round.round, `${directorRows[0].directorDelta > 0 ? "+" : ""}${directorRows[0].directorDelta} pts`);
      add(directorRows.at(-1).team, "directorBad", round.round, `${directorRows.at(-1).directorDelta > 0 ? "+" : ""}${directorRows.at(-1).directorDelta} pts`);
    }

    const valueDeltas = rows.map((row) => {
      const previous = previousRows.find((previousRow) => previousRow.name === row.name);
      return previous && row.value && previous.value ? { name: row.name, delta: row.value - previous.value } : null;
    }).filter(Boolean);
    if (valueDeltas.length) {
      valueDeltas.sort((a, b) => b.delta - a.delta);
      add(valueDeltas[0].name, "trader", round.round, formatMoneyDelta(valueDeltas[0].delta));
      add(valueDeltas.at(-1).name, "traderBad", round.round, formatMoneyDelta(valueDeltas.at(-1).delta));
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
  const pigHistory = await readJson("data/cerdo/history.json", { rounds: [] });
  const calendar = await readJson("data/laliga/calendar.json", { rounds: [] });
  const marketHistory = await readJsonl("data/mister/market-history.jsonl");

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
    { id: "sofascore", name: "Sofascore" }
  ];

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
        "Las asistencias se han quitado porque Mister no las expone de forma directa en esta vista.",
        "Banquillo histórico y director deportivo empiezan a ser fiables desde que existan snapshots semanales profundos.",
        "Las clasificaciones por sistema de puntuación usan los popups de jugador que Mister expone; si falta un popup, ese jugador queda fuera de ese sistema alternativo."
      ]
    },
    teams,
    currentStandings: parsedStandings.general,
    closedRounds: effectiveClosedRounds,
    liveRounds: liveRounds.length ? liveRounds : parsedStandings.live.length ? [{ round: latestClosedRound + 1, status: "in_progress", rows: parsedStandings.live, rowsBySystem: { final: parsedStandings.live } }] : [],
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
      mySquad: (team.players || []).map(parsePlayerText).filter((player) => player.name),
      profiles: (deep.playerProfiles || []).map((player) => ({
        playerId: player.playerId,
        name: player.name,
        position: player.position,
        totalPoints: player.totalPoints,
        average: player.average,
        marketValue: player.marketValue,
        goals: player.goals,
        cards: player.cards,
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
