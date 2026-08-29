import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "data", "laliga", "calendar.json");
const LALIGA_URL = "https://www.laliga.com/laliga-easports/calendario";
const AS_URL = "https://as.com/resultados/futbol/primera/calendario/";

const TEAM_NAMES = [
  "Alavés", "Athletic", "Atlético", "Barcelona", "Betis", "Celta", "Deportivo",
  "Elche", "Espanyol", "Getafe", "Levante", "Málaga", "Osasuna", "Real Sociedad",
  "Racing", "Rayo", "Real Madrid", "Sevilla", "Valencia", "Villarreal"
];

const FALLBACK_ROUNDS = [
  { round: 1, date: "2026-08-15", kickoffTime: "19:30", confidence: "manual-confirmed" },
  { round: 2, date: "2026-08-20", kickoffTime: "21:00", confidence: "manual-confirmed" },
  { round: 3, date: "2026-08-28", kickoffTime: "19:00", confidence: "manual-confirmed" },
  { round: 4, date: "2026-09-04", kickoffTime: "21:00", confidence: "official-news" },
  { round: 5, date: "2026-09-13", kickoffTime: "19:00", confidence: "default-date" },
  { round: 6, date: "2026-09-16", kickoffTime: "19:00", confidence: "default-date" },
  { round: 7, date: "2026-09-20", kickoffTime: "19:00", confidence: "default-date" },
  { round: 8, date: "2026-10-11", kickoffTime: "19:00", confidence: "default-date" },
  { round: 9, date: "2026-10-18", kickoffTime: "19:00", confidence: "default-date" },
  { round: 10, date: "2026-10-25", kickoffTime: "19:00", confidence: "default-date" },
  { round: 11, date: "2026-11-01", kickoffTime: "19:00", confidence: "default-date" },
  { round: 12, date: "2026-11-08", kickoffTime: "19:00", confidence: "default-date" },
  { round: 13, date: "2026-11-22", kickoffTime: "19:00", confidence: "default-date" },
  { round: 14, date: "2026-11-29", kickoffTime: "19:00", confidence: "default-date" },
  { round: 15, date: "2026-12-06", kickoffTime: "19:00", confidence: "default-date" },
  { round: 16, date: "2026-12-13", kickoffTime: "19:00", confidence: "default-date" },
  { round: 17, date: "2026-12-20", kickoffTime: "19:00", confidence: "default-date" },
  { round: 18, date: "2027-01-03", kickoffTime: "19:00", confidence: "default-date" },
  { round: 19, date: "2027-01-10", kickoffTime: "19:00", confidence: "default-date" },
  { round: 20, date: "2027-01-17", kickoffTime: "19:00", confidence: "default-date" },
  { round: 21, date: "2027-01-24", kickoffTime: "19:00", confidence: "default-date" },
  { round: 22, date: "2027-01-31", kickoffTime: "19:00", confidence: "default-date" },
  { round: 23, date: "2027-02-07", kickoffTime: "19:00", confidence: "default-date" },
  { round: 24, date: "2027-02-14", kickoffTime: "19:00", confidence: "default-date" },
  { round: 25, date: "2027-02-21", kickoffTime: "19:00", confidence: "default-date" },
  { round: 26, date: "2027-02-28", kickoffTime: "19:00", confidence: "default-date" },
  { round: 27, date: "2027-03-07", kickoffTime: "19:00", confidence: "default-date" },
  { round: 28, date: "2027-03-14", kickoffTime: "19:00", confidence: "default-date" },
  { round: 29, date: "2027-03-21", kickoffTime: "19:00", confidence: "default-date" },
  { round: 30, date: "2027-04-04", kickoffTime: "19:00", confidence: "default-date" },
  { round: 31, date: "2027-04-11", kickoffTime: "19:00", confidence: "default-date" },
  { round: 32, date: "2027-04-18", kickoffTime: "19:00", confidence: "default-date" },
  { round: 33, date: "2027-04-21", kickoffTime: "19:00", confidence: "default-date" },
  { round: 34, date: "2027-05-02", kickoffTime: "19:00", confidence: "default-date" },
  { round: 35, date: "2027-05-09", kickoffTime: "19:00", confidence: "default-date" },
  { round: 36, date: "2027-05-16", kickoffTime: "19:00", confidence: "default-date" },
  { round: 37, date: "2027-05-23", kickoffTime: "19:00", confidence: "default-date" },
  { round: 38, date: "2027-05-30", kickoffTime: "19:00", confidence: "default-date" }
];

function extractNextData(html) {
  const startToken = '<script id="__NEXT_DATA__" type="application/json">';
  const start = html.indexOf(startToken);
  if (start === -1) return null;
  const end = html.indexOf("</script>", start);
  if (end === -1) return null;
  return JSON.parse(html.slice(start + startToken.length, end));
}

function walk(value, visitor) {
  if (!value || typeof value !== "object") return;
  visitor(value);
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, visitor));
    return;
  }
  Object.values(value).forEach((item) => walk(item, visitor));
}

function asText(value) {
  return value == null ? "" : String(value);
}

function findTeamNames(obj) {
  const text = JSON.stringify(obj);
  return TEAM_NAMES.filter((name) => text.includes(name));
}

function findRound(obj) {
  const text = JSON.stringify(obj);
  const match = text.match(/Jornada\D{0,10}(\d{1,2})|matchday["':\s]+(\d{1,2})|round["':\s]+(\d{1,2})/i);
  const value = Number(match?.[1] || match?.[2] || match?.[3]);
  return value >= 1 && value <= 38 ? value : null;
}

function findDate(obj) {
  const text = JSON.stringify(obj);
  return text.match(/20(?:26|27)-\d{2}-\d{2}/)?.[0] || null;
}

function findTime(obj) {
  const text = JSON.stringify(obj);
  return text.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/)?.[0] || null;
}

function extractMatchesFromNextData(data) {
  const seen = new Set();
  const matches = [];
  walk(data, (obj) => {
    const teams = findTeamNames(obj);
    if (teams.length < 2) return;
    const round = findRound(obj);
    const date = findDate(obj);
    if (!round || !date) return;
    const home = teams[0];
    const away = teams.find((team) => team !== home);
    const time = findTime(obj);
    const key = `${round}-${date}-${home}-${away}-${time || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    matches.push({ round, date, kickoffTime: time, home, away, source: "laliga-next-data" });
  });
  return matches;
}

function mergeWithFallback(matches) {
  const grouped = new Map();
  for (const match of matches) {
    if (!grouped.has(match.round)) grouped.set(match.round, []);
    grouped.get(match.round).push(match);
  }

  return FALLBACK_ROUNDS.map((fallback) => {
    const roundMatches = grouped.get(fallback.round) || [];
    const datedMatches = roundMatches
      .filter((match) => match.date)
      .sort((a, b) => `${a.date} ${a.kickoffTime || "19:00"}`.localeCompare(`${b.date} ${b.kickoffTime || "19:00"}`));
    const first = datedMatches[0];
    const date = first?.date || fallback.date;
    const kickoffTime = first?.kickoffTime || fallback.kickoffTime;
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = kickoffTime.split(":").map(Number);
    return {
      round: fallback.round,
      firstKickoffLocal: `${date}T${kickoffTime}:00`,
      start: { year, month, day, hour, minute },
      date,
      kickoffTime,
      confidence: first?.source === "laliga-next-data" ? "official-page" : first?.source === "as-calendar" ? "as-calendar-date" : fallback.confidence,
      matches: datedMatches
    };
  });
}

async function extractRoundDatesFromAs() {
  const html = await fetch(AS_URL).then((response) => {
    if (!response.ok) throw new Error(`AS HTTP ${response.status}`);
    return response.text();
  });
  const byRound = new Map();
  const re = /data-day="(\d{2})-(\d{2})-(20(?:26|27))"\s+data-title="Jornada\s+(\d{1,2})"/g;
  let match;
  while ((match = re.exec(html))) {
    const [, day, month, year, roundText] = match;
    const round = Number(roundText);
    const date = `${year}-${month}-${day}`;
    if (!byRound.has(round) || date < byRound.get(round)) byRound.set(round, date);
  }
  return Array.from(byRound.entries()).map(([round, date]) => ({
    round,
    date,
    kickoffTime: null,
    home: null,
    away: null,
    source: "as-calendar"
  }));
}

async function main() {
  let matches = [];
  let status = "fallback";
  try {
    const html = await fetch(LALIGA_URL).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    });
    const data = extractNextData(html);
    matches = data ? extractMatchesFromNextData(data) : [];
    status = matches.length ? "official" : "fallback-no-matches";
  } catch (error) {
    status = `fallback-error: ${error.message}`;
  }

  if (!matches.length) {
    try {
      matches = await extractRoundDatesFromAs();
      status = matches.length ? "as-calendar-dates" : status;
    } catch (error) {
      status = `${status}; as-error: ${error.message}`;
    }
  }

  const calendar = {
    updatedAt: new Date().toISOString(),
    scrapedAt: new Date().toISOString(),
    source: LALIGA_URL,
    fallbackSource: AS_URL,
    status,
    timezone: "Europe/Madrid",
    policy: "La cuenta atrás acaba 24h antes del primer partido de cada jornada. Si no hay hora oficial, se usa 19:00.",
    rounds: mergeWithFallback(matches)
  };

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, `${JSON.stringify(calendar, null, 2)}\n`, "utf8");
  console.log(`Calendario actualizado (${status}): ${matches.length} entradas detectadas.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
