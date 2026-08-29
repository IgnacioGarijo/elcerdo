import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data", "mister");
const LATEST_DIR = path.join(DATA_DIR, "latest");
const SNAPSHOTS_DIR = path.join(DATA_DIR, "snapshots");
const BASE_URL = "https://mister.mundodeportivo.com";
const DEFAULT_COMMUNITY_ID = "1263883";

const POSITION_NAMES = {
  1: "goalkeeper",
  2: "defender",
  3: "midfielder",
  4: "forward"
};

function parseArgs(argv) {
  const flags = new Set(argv.slice(2));
  const all = flags.has("--all") || flags.size === 0;
  return {
    all,
    market: all || flags.has("--market"),
    feed: all || flags.has("--feed"),
    standings: all || flags.has("--standings"),
    team: all || flags.has("--team"),
    search: all || flags.has("--search"),
    deep: all || flags.has("--deep"),
    headed: flags.has("--headed")
  };
}

function runStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function parseSpanishNumber(value) {
  if (value == null) return null;
  const normalized = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (!normalized || normalized === "-" || normalized === ".") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function ensureAbsoluteUrl(href) {
  if (!href) return null;
  return new URL(href, BASE_URL).toString();
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function appendJsonl(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(data)}\n`, "utf8");
}

async function runNodeScript(scriptPath) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(scriptPath)} termino con codigo ${code}`));
    });
    child.on("error", reject);
  });
}

async function storageStateFromEnv() {
  if (process.env.MISTER_STORAGE_STATE_BASE64) {
    return JSON.parse(Buffer.from(process.env.MISTER_STORAGE_STATE_BASE64, "base64").toString("utf8"));
  }

  if (process.env.MISTER_STORAGE_STATE_PATH) {
    return process.env.MISTER_STORAGE_STATE_PATH;
  }

  return undefined;
}

async function loginWithCredentials(page) {
  if (!process.env.MISTER_EMAIL || !process.env.MISTER_PASSWORD) return false;

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  const emailInput = page.locator('input[type="email"], input[name*="email" i], input[name*="mail" i]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  if (!(await emailInput.count()) || !(await passwordInput.count())) return false;

  await emailInput.fill(process.env.MISTER_EMAIL);
  await passwordInput.fill(process.env.MISTER_PASSWORD);
  await page.locator('button[type="submit"], input[type="submit"], button:has-text("Entrar"), button:has-text("Iniciar")').first().click();
  await page.waitForURL(/mister\.mundodeportivo\.com\/(feed|market|team|standings|search)/, { timeout: 30000 }).catch(() => {});
  return true;
}

async function ensureLoggedIn(page) {
  const communityId = process.env.MISTER_COMMUNITY_ID || DEFAULT_COMMUNITY_ID;
  await page.goto(`${BASE_URL}/action/change?id_community=${communityId}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  let body = await page.locator("body").innerText({ timeout: 15000 }).catch(() => "");
  if (/Tus ligas|Mercado|Equipo|Tabla|Buscar/i.test(body)) return;

  const didLogin = await loginWithCredentials(page);
  if (didLogin) {
    await page.goto(`${BASE_URL}/action/change?id_community=${communityId}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    body = await page.locator("body").innerText({ timeout: 15000 }).catch(() => "");
  }

  if (!/Tus ligas|Mercado|Equipo|Tabla|Buscar/i.test(body)) {
    throw new Error("No se pudo acceder a Mister. Configura MISTER_STORAGE_STATE_BASE64 o credenciales validas en GitHub Secrets.");
  }
}

async function scrollToLoad(page) {
  let previousHeight = 0;
  for (let i = 0; i < 12; i++) {
    const height = await page.evaluate(() => document.body.scrollHeight);
    if (height === previousHeight && i > 1) break;
    previousHeight = height;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function scrapeMarket(page, metadata) {
  await page.goto(`${BASE_URL}/market`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".player-row", { timeout: 25000 });
  await scrollToLoad(page);

  const players = await page.$$eval(".player-row", (rows, positionNames) => {
    const parseNumber = (value) => {
      if (value == null) return null;
      const normalized = String(value).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const ownerFromRow = (row) => {
      let cursor = row.previousElementSibling;
      for (let i = 0; cursor && i < 4; i++, cursor = cursor.previousElementSibling) {
        const text = cursor.innerText?.trim();
        if (text && /finaliza/i.test(text)) return text.replace(/\s+/g, " ");
      }
      return null;
    };

    return rows.map((row) => {
      const player = row.querySelector("a.player");
      const bid = row.querySelector(".btn-bid");
      const avatar = player?.querySelector(".player-avatar");
      const position = player?.querySelector(".player-position")?.dataset.position || null;
      const valueText = player?.querySelector(".underName")?.innerText || "";
      const ownerText = ownerFromRow(row);
      const ownerMatch = ownerText?.match(/^(.*?),\s*finaliza en\s*(.*?)(?:\s+\d[\d.]*)?$/i);

      return {
        playerId: avatar?.dataset.id_player || bid?.dataset.id_player || null,
        name: player?.querySelector(".name")?.innerText.trim().replace(/\s+/g, " ") || null,
        href: player?.getAttribute("href") || null,
        absoluteUrl: player?.href || null,
        teamLogoUrl: player?.querySelector(".icons .team-logo")?.src || null,
        photoUrl: avatar?.querySelector("img")?.src || null,
        positionId: position ? Number(position) : null,
        position: position ? positionNames[position] || null : null,
        points: parseNumber(player?.querySelector(".points")?.innerText),
        marketValue: parseNumber(valueText),
        valueTrend: valueText.includes("↑") ? "up" : valueText.includes("↓") ? "down" : "flat",
        average: parseNumber(player?.querySelector(".avg")?.innerText),
        streak: [...player?.querySelectorAll(".streak span") || []].map((item) => parseNumber(item.innerText)),
        nextRivalLogoUrl: player?.querySelector(".rival .team-logo")?.src || null,
        seller: ownerMatch?.[1] || ownerText,
        expiresInText: ownerMatch?.[2] || null,
        ownerId: bid?.dataset.id_owner || null,
        askingPrice: parseNumber(bid?.innerText),
        bidLabel: bid?.innerText.trim().replace(/\s+/g, " ") || null,
        isAlreadyForSaleByUser: /en venta/i.test(bid?.innerText || "")
      };
    });
  }, POSITION_NAMES);

  return {
    ...metadata,
    page: "market",
    url: page.url(),
    count: players.length,
    players
  };
}

async function scrapeFeed(page, metadata) {
  await page.goto(`${BASE_URL}/feed`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await scrollToLoad(page);

  const feed = await page.evaluate(() => ({
    headlineText: document.body.innerText.slice(0, 30000),
    links: [...document.querySelectorAll('a[href*="players/"], a[href*="users/"]')].map((link) => ({
      text: link.innerText.trim().replace(/\s+/g, " "),
      href: link.href
    })),
    cards: [...document.querySelectorAll("#feed .card, .feed-card, article, .activity, .post")].map((card) => ({
      text: card.innerText.trim().replace(/\s+/g, " "),
      links: [...card.querySelectorAll("a[href]")].map((link) => ({ text: link.innerText.trim(), href: link.href }))
    })).filter((card) => card.text)
  }));

  return { ...metadata, page: "feed", url: page.url(), ...feed };
}

async function scrapeStandings(page, metadata) {
  await page.goto(`${BASE_URL}/standings`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  const standings = await page.evaluate(() => ({
    text: document.body.innerText,
    gameweekLinks: [...document.querySelectorAll('a[href*="standings?gw="]')].map((link) => ({
      text: link.innerText.trim().replace(/\s+/g, " "),
      href: link.href,
      gameweekId: link.href.match(/[?&]gw=(\d+)/)?.[1] || null,
      round: Number(link.innerText.match(/J(\d+)/i)?.[1]) || null
    })).filter((link) => link.gameweekId && link.round),
    users: [...document.querySelectorAll('a[href*="users/"]')].map((link) => ({
      text: link.innerText.trim().replace(/\s+/g, " "),
      href: link.href
    })).filter((user) => user.text)
  }));

  return { ...metadata, page: "standings", url: page.url(), ...standings };
}

async function scrapeTeam(page, metadata) {
  await page.goto(`${BASE_URL}/team`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await scrollToLoad(page);

  const team = await page.evaluate(() => ({
    text: document.body.innerText,
    players: [...document.querySelectorAll('a.player, a[href*="players/"]')].map((player) => ({
      text: player.innerText.trim().replace(/\s+/g, " "),
      href: player.href,
      playerId: player.querySelector(".player-avatar")?.dataset.id_player || player.href?.match(/players\/(\d+)/)?.[1] || null
    })).filter((player) => player.text || player.playerId)
  }));

  return { ...metadata, page: "team", url: page.url(), ...team };
}

async function scrapeSearch(page, metadata) {
  await page.goto(`${BASE_URL}/search`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await scrollToLoad(page);

  const search = await page.evaluate(() => ({
    text: document.body.innerText.slice(0, 8000),
    players: [...document.querySelectorAll('a.player, a[href*="players/"]')].map((player) => ({
      text: player.innerText.trim().replace(/\s+/g, " "),
      href: player.href,
      playerId: player.querySelector(".player-avatar")?.dataset.id_player || player.href?.match(/players\/(\d+)/)?.[1] || null
    })).filter((player) => player.text || player.playerId)
  }));

  return { ...metadata, page: "search", url: page.url(), ...search };
}

async function scrapeDeep(page, metadata, basics = {}) {
  const standings = basics.standings || await scrapeStandings(page, metadata);
  const gameweeks = extractGameweeksFromStandings(standings);
  const managers = extractManagersFromStandings(standings);
  const rounds = [];
  const profilePlayers = new Map();

  for (const gameweek of gameweeks) {
    console.log(`Scrape jornada profunda J${gameweek.round}`);
    const standingsPage = await scrapeStandingsGameweek(page, gameweek, metadata);
    const gameweekPanel = await scrapeGameweekPanel(page, gameweek, metadata);
    const userRounds = [];

    for (const manager of managers) {
      console.log(`Scrape alineacion J${gameweek.round}: ${manager.name}`);
      const userRound = await scrapeUserRound(page, manager, gameweek, metadata);
      userRounds.push(userRound);
      for (const player of userRound.lineup) {
        if (player.playerId && player.href) profilePlayers.set(player.playerId, player.href);
      }
    }

    for (const player of gameweekPanel.bestXi) {
      if (player.playerId && player.href) profilePlayers.set(player.playerId, player.href);
    }

    rounds.push({
      ...gameweek,
      standings: standingsPage.rows,
      status: gameweekPanel.status || standingsPage.status,
      matches: gameweekPanel.matches,
      bestXi: gameweekPanel.bestXi,
      leaguePlayers: gameweekPanel.players,
      userRounds
    });
  }

  const playerProfiles = [];
  const importantPlayers = [...profilePlayers.entries()].slice(0, 60);
  for (const [index, [playerId, href]] of importantPlayers.entries()) {
    console.log(`Scrape perfil jugador ${index + 1}/${importantPlayers.length}: ${playerId}`);
    playerProfiles.push(await scrapePlayerProfile(page, { playerId, href }, gameweeks, metadata).catch((error) => ({
      ...metadata,
      playerId,
      href,
      error: error.message
    })));
  }

  return {
    ...metadata,
    page: "deep",
    url: page.url(),
    gameweeks,
    managers,
    rounds,
    playerProfiles
  };
}

function extractGameweeksFromStandings(standings) {
  if (standings.gameweekLinks?.length) {
    return standings.gameweekLinks
      .map((link) => ({ round: link.round, gameweekId: link.gameweekId, href: link.href }))
      .sort((a, b) => a.round - b.round);
  }
  const seen = new Map();
  for (const user of standings.users || []) {
    const match = user.href?.match(/[?&]gw=(\d+)/);
    const roundMatch = user.text?.match(/^J(\d+)$/i);
    if (match && roundMatch) seen.set(match[1], { round: Number(roundMatch[1]), gameweekId: match[1], href: user.href });
  }
  return [...seen.values()].sort((a, b) => a.round - b.round);
}

function extractManagersFromStandings(standings) {
  const seen = new Map();
  for (const user of standings.users || []) {
    const match = user.href?.match(/users\/(\d+)\//);
    if (!match || !/\d+\s+[A-ZÑ]{1,3}\s+/.test(user.text)) continue;
    const parsed = parseManagerRow(user.text);
    if (parsed?.name) seen.set(match[1], { ...parsed, managerId: match[1], href: user.href });
  }
  return [...seen.values()];
}

function parseManagerRow(text) {
  const compact = text.replace(/\s+/g, " ").trim();
  const rank = Number(compact.match(/^(\d+)/)?.[1]) || null;
  const initials = compact.match(/^\d+\s+([A-ZÑ]{1,3})\s+/)?.[1] || "";
  const points = parseSpanishNumber(compact.match(/(-?\d+)\s*PTS?/i)?.[1]);
  const value = parseSpanishNumber(compact.match(/€\s*([\d.]+)/)?.[1]);
  const played = compact.match(/(\d+)\s*\/\s*11/i)?.[1] || null;
  const name = compact
    .replace(/^\d+\s+/, "")
    .replace(/^[A-ZÑ]{1,3}\s+/, "")
    .replace(/\s+\d+\s*\/\s*11.*$/i, "")
    .replace(/\s+\d+\s+jugadores.*$/i, "")
    .trim();
  return { rank, initials, name, points, value, played };
}

async function scrapeStandingsGameweek(page, gameweek, metadata) {
  await page.goto(`${BASE_URL}/standings?gw=${gameweek.gameweekId}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  const rows = await page.evaluate(() => {
    const all = [...document.querySelectorAll('a[href*="users/"]')]
      .map((link) => ({ text: link.innerText.trim().replace(/\s+/g, " "), href: link.href }))
      .filter((row) => /\d+\s+[A-ZÑ]{1,3}\s+/.test(row.text));
    const roundRows = all.filter((row) => /\d+\s*\/\s*11/i.test(row.text));
    return roundRows.length ? roundRows : all;
  });
  return {
    ...metadata,
    round: gameweek.round,
    gameweekId: gameweek.gameweekId,
    status: rows.some((row) => /\d+\s*\/\s*11/i.test(row.text)) ? "in_progress" : "closed",
    rows: rows.map((row) => {
      const parsed = parseManagerRow(row.text);
      const managerId = row.href.match(/users\/(\d+)\//)?.[1] || null;
      return { ...parsed, managerId, href: row.href };
    }).filter((row) => row.name)
  };
}

async function scrapeGameweekPanel(page, gameweek, metadata) {
  await page.goto(`${BASE_URL}/feed`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.evaluate((id) => {
    if (typeof window.loadSelectedGameweek === "function") window.loadSelectedGameweek(id);
  }, gameweek.gameweekId);
  await page.waitForSelector(".sw-gameweek", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(700);

  const panel = await page.evaluate((positionNames) => {
    const parseNumber = (value) => {
      if (value == null) return null;
      const match = String(value).match(/-?\d+(?:[.,]\d+)?/);
      if (!match) return null;
      return Number(match[0].replace(",", "."));
    };
    const parsePlayer = (node, extra = {}) => ({
      playerId: node.dataset.id_player || node.href?.match(/players\/(\d+)/)?.[1] || null,
      gameweekId: node.dataset.id_gameweek || null,
      managerId: node.dataset.id_manager || null,
      href: node.href || null,
      name: node.querySelector(".name")?.innerText?.trim() || node.innerText.trim().replace(/\s+-?\d+$/, ""),
      points: parseNumber(node.querySelector(".points")?.innerText || node.innerText.match(/(-?\d+)\s*$/)?.[1]),
      positionId: node.dataset.position ? Number(node.dataset.position) : null,
      position: node.dataset.position ? positionNames[node.dataset.position] || null : null,
      isCaptain: /x[1-3](?:[.,]5)?/i.test(node.innerText),
      ...extra
    });
    const root = document.querySelector(".sw-gameweek");
    const bestXi = [...root?.querySelectorAll(".best-xi") || []].map((node) => parsePlayer(node, { section: "bestXi" }));
    const players = [...root?.querySelectorAll(".btn-player-gw[data-id_player]") || []].map((node) => parsePlayer(node, {
      section: node.classList.contains("best-xi") ? "bestXi" : "league"
    }));
    const matches = [...root?.querySelectorAll("[id^='gameweek-match-'], .gameweek-match") || []].map((match) => ({
      id: match.id?.match(/(\d+)/)?.[1] || null,
      text: match.innerText.trim().replace(/\s+/g, " ").slice(0, 1000)
    })).filter((match) => match.text);
    const status = /En juego|Hoy|\d{1,2}:\d{2}/i.test(root?.innerText || "") ? "in_progress" : "closed";
    return { status, bestXi, players, matches, text: root?.innerText?.slice(0, 12000) || "" };
  }, POSITION_NAMES);

  return { ...metadata, round: gameweek.round, gameweekId: gameweek.gameweekId, ...panel };
}

async function scrapeUserRound(page, manager, gameweek, metadata) {
  await page.goto(`${manager.href.split("?")[0]}?gw=${gameweek.gameweekId}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  const userRound = await page.evaluate((positionNames) => {
    const parseNumber = (value) => {
      if (value == null) return null;
      const match = String(value).match(/-?\d+(?:[.,]\d+)?/);
      if (!match) return null;
      return Number(match[0].replace(",", "."));
    };
    const parseLineup = (node, slot) => ({
      playerId: node.dataset.id_player || node.href?.match(/players\/(\d+)/)?.[1] || null,
      gameweekId: node.dataset.id_gameweek || null,
      managerId: node.dataset.id_manager || null,
      href: node.href || null,
      name: node.querySelector(".name")?.innerText?.trim() || node.innerText.trim().replace(/\s+-?\d+$/, "").replace(/^x[1-3](?:[.,]5)?\s*/i, ""),
      points: parseNumber(node.querySelector(".points")?.innerText || node.innerText.match(/(-?\d+)\s*$/)?.[1]),
      positionId: node.dataset.position ? Number(node.dataset.position) : null,
      position: node.dataset.position ? positionNames[node.dataset.position] || null : null,
      isCaptain: /x[1-3](?:[.,]5)?/i.test(node.innerText),
      slot
    });
    const parseSquad = (node) => {
      const player = node.querySelector("a.player, a[href*='players/']") || node;
      const position = player.querySelector(".player-position")?.dataset.position || null;
      const valueText = player.querySelector(".underName")?.innerText || "";
      return {
        playerId: player.querySelector(".player-avatar")?.dataset.id_player || player.href?.match(/players\/(\d+)/)?.[1] || null,
        href: player.href || null,
        text: player.innerText.trim().replace(/\s+/g, " "),
        name: player.querySelector(".name")?.innerText?.trim() || null,
        points: parseNumber(player.querySelector(".points")?.innerText),
        marketValue: parseNumber(valueText),
        valueTrend: valueText.includes("↑") ? "up" : valueText.includes("↓") ? "down" : "flat",
        positionId: position ? Number(position) : null,
        position: position ? positionNames[position] || null : null
      };
    };
    const selected = [...document.querySelectorAll(".gameweek-selector-inline .selected, button.selected")].map((node) => node.innerText.trim()).find((text) => /^J\d+/.test(text));
    const lineup = [...document.querySelectorAll(".team-lineup .line .lineup-player")].map((node) => parseLineup(node, "lineup"));
    const bench = [...document.querySelectorAll(".team-lineup .bench .lineup-player")].map((node) => parseLineup(node, "bench"));
    const squad = [...document.querySelectorAll(".player-list .player-row")].map(parseSquad).filter((player) => player.playerId);
    return { selected, lineup, bench, squad };
  }, POSITION_NAMES);

  return { ...metadata, manager, round: gameweek.round, gameweekId: gameweek.gameweekId, ...userRound };
}

async function scrapePlayerProfile(page, playerRef, gameweeks, metadata) {
  await page.goto(ensureAbsoluteUrl(playerRef.href), { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);

  const profile = await page.evaluate((positionNames) => {
    const parseNumber = (value) => {
      if (value == null) return null;
      const normalized = String(value).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
      if (!normalized || normalized === "-" || normalized === ".") return null;
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const parseCompactMoney = (value) => {
      if (!value) return null;
      const text = String(value).trim().toLowerCase();
      const number = parseNumber(text);
      if (!Number.isFinite(number)) return null;
      if (text.includes("m")) return Math.round(number * 1000000);
      if (text.includes("k")) return Math.round(number * 1000);
      return number;
    };
    const linesBetween = (start, end) => {
      const text = document.body.innerText;
      const startIndex = text.indexOf(start);
      if (startIndex < 0) return [];
      const endIndex = end ? text.indexOf(end, startIndex + start.length) : -1;
      return text
        .slice(startIndex + start.length, endIndex > startIndex ? endIndex : undefined)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    };
    const parseOwnerNotice = (text) => {
      const match = text.match(/(?:^|\s)([A-ZÑ]{1,3}|O)\s+De\s+([^,]+?)(?:,\s*fichado el\s+(.+?)\s+por\s+([\d.]+))?$/i);
      if (!match) return null;
      return {
        initials: match[1],
        managerName: match[2].trim(),
        signedAtText: match[3] || null,
        signedPrice: parseNumber(match[4])
      };
    };
    const parseMovements = () => {
      const lines = linesBetween("Últimos movimientos", "Historial de valores");
      const movements = [];
      for (let i = 0; i < lines.length; i += 3) {
        if (!lines[i] || !lines[i + 1]) continue;
        const header = lines[i].split("·").map((part) => part.trim());
        movements.push({
          dateText: header[0] || null,
          type: header[1] || null,
          detail: lines[i + 1] || null,
          price: parseNumber(lines[i + 2])
        });
      }
      return movements;
    };
    const parseValueHistory = () => {
      const lines = linesBetween("Historial de valores", "Historial de puntos");
      const history = [];
      for (let i = 0; i < lines.length; i += 3) {
        if (!lines[i] || !lines[i + 1]) continue;
        history.push({
          period: lines[i],
          changeText: lines[i + 1],
          change: parseNumber(lines[i + 1]),
          trend: lines[i + 1].includes("↑") ? "up" : lines[i + 1].includes("↓") ? "down" : "flat",
          valueText: lines[i + 2] || null,
          value: parseCompactMoney(lines[i + 2])
        });
      }
      return history;
    };
    const parsePointsHistory = () => {
      const lines = linesBetween("Historial de puntos");
      const history = [];
      for (let i = 0; i < lines.length; i += 3) {
        if (!lines[i] || !lines[i + 2]) continue;
        history.push({
          season: lines[i],
          average: parseNumber(lines[i + 1]),
          points: parseNumber(lines[i + 2])
        });
      }
      return history;
    };
    const statMap = Object.fromEntries([...document.querySelectorAll(".player-stats-wrapper .item")].map((item) => [
      item.querySelector(".label")?.innerText.trim().toLowerCase(),
      item.querySelector(".value")?.innerText.trim()
    ]).filter(([key]) => key));
    const name = [document.querySelector(".player-profile-header .name")?.innerText, document.querySelector(".player-profile-header .surname")?.innerText].filter(Boolean).join(" ").trim();
    const positionId = document.querySelector(".player-profile-header .player-position")?.dataset.position || null;
    const ownerNotice = document.querySelector(".player-notices")?.innerText?.trim().replace(/\s+/g, " ") || "";
    const gameweeks = [...document.querySelectorAll(".player-points .gw")].map((node) => ({
      playerId: node.dataset.id_player || null,
      gameweekId: node.dataset.id_gameweek || null,
      label: node.querySelector(".title")?.innerText.trim() || null,
      points: parseNumber(node.querySelector(".bar > div")?.innerText || node.innerText.match(/^-?\d+/)?.[0]),
      status: node.classList.contains("gw-played") ? "played" : "pending",
      eventIcons: [...node.querySelectorAll(".events use")].map((use) => use.getAttribute("href")?.split("#").at(-1)).filter(Boolean),
      rivalLogoUrl: node.querySelector(".rival .team-logo")?.src || null,
      html: node.outerHTML.slice(0, 1200)
    }));
    return {
      playerId: location.pathname.match(/players\/(\d+)/)?.[1] || null,
      href: location.href,
      name,
      positionId: positionId ? Number(positionId) : null,
      position: positionId ? positionNames[positionId] || null : null,
      totalPoints: parseNumber(statMap.puntos),
      average: parseNumber(statMap.media),
      marketValue: parseNumber(statMap.valor),
      clause: parseNumber(statMap["cláusula"] || statMap.clausula),
      appearances: parseNumber(statMap.partidos),
      goals: parseNumber(statMap.goles),
      cards: parseNumber(statMap.tarjetas),
      ownerNotice,
      owner: parseOwnerNotice(ownerNotice),
      movements: parseMovements(),
      valueHistory: parseValueHistory(),
      pointsHistory: parsePointsHistory(),
      gameweeks
    };
  }, POSITION_NAMES);

  const playedGameweeks = profile.gameweeks
    .filter((item) => item.status === "played" && item.gameweekId && gameweeks.some((gw) => gw.gameweekId === item.gameweekId))
    .slice(0, 8);
  const providerScores = [];
  for (const item of playedGameweeks) {
    const popup = await scrapePlayerGameweekPopup(page, profile.playerId || playerRef.playerId, item.gameweekId);
    providerScores.push({ gameweekId: item.gameweekId, label: item.label, ...popup });
  }

  return { ...metadata, ...profile, providerScores };
}

async function scrapePlayerGameweekPopup(page, playerId, gameweekId) {
  await page.locator("#popup .popup-close").click({ timeout: 1000 }).catch(() => {});
  const cell = page.locator(`.player-points .gw[data-id_player="${playerId}"][data-id_gameweek="${gameweekId}"]`).first();
  if (!(await cell.count())) return { providers: [], popupText: null };
  await cell.click({ timeout: 2500 });
  await page.waitForSelector("#popup .player-gameweek", { timeout: 3500 }).catch(() => {});
  await page.waitForTimeout(150);
  const data = await page.evaluate(() => {
    const popup = document.querySelector("#popup .player-gameweek");
    const parseNumber = (value) => {
      if (value == null) return null;
      const match = String(value).match(/-?\d+(?:[.,]\d+)?/);
      if (!match) return null;
      return Number(match[0].replace(",", "."));
    };
    const providers = [...popup?.querySelectorAll(".providers li") || []].map((item) => ({
      name: item.querySelector(".title")?.childNodes?.[0]?.textContent?.trim() || item.querySelector(".title")?.innerText?.replace(/\(.*\)/, "").trim() || null,
      weight: parseNumber(item.querySelector(".title small")?.innerText),
      points: parseNumber(item.querySelector(".right .points")?.innerText),
      breakdown: item.querySelector(".sum")?.innerText?.trim().replace(/\s+/g, " ") || "",
      eventIcons: [...item.querySelectorAll("use")].map((use) => use.getAttribute("href")?.split("#").at(-1)).filter(Boolean)
    }));
    return {
      finalPoints: parseNumber(popup?.querySelector(".main-provider .points")?.innerText),
      matchText: popup?.querySelector(".player-match")?.innerText?.trim().replace(/\s+/g, " ") || "",
      providers,
      popupText: popup?.innerText?.trim().slice(0, 2000) || null
    };
  });
  await page.locator("#popup .popup-close").click({ timeout: 1000 }).catch(() => {});
  return data;
}

async function main() {
  const args = parseArgs(process.argv);
  const stamp = runStamp();
  const snapshotDir = path.join(SNAPSHOTS_DIR, stamp);
  const metadata = {
    scrapedAt: new Date().toISOString(),
    source: BASE_URL,
    communityId: process.env.MISTER_COMMUNITY_ID || DEFAULT_COMMUNITY_ID
  };

  await fs.mkdir(snapshotDir, { recursive: true });
  await fs.mkdir(LATEST_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: !args.headed });
  const context = await browser.newContext({
    storageState: await storageStateFromEnv(),
    locale: "es-ES",
    timezoneId: "Europe/Madrid"
  });
  const page = await context.newPage();

  try {
    await ensureLoggedIn(page);

    const jobs = [
      ["market", args.market, scrapeMarket],
      ["feed", args.feed, scrapeFeed],
      ["standings", args.standings, scrapeStandings],
      ["team", args.team, scrapeTeam],
      ["search", args.search, scrapeSearch],
      ["deep", args.deep, scrapeDeep]
    ];

    const results = {};
    for (const [name, enabled, scraper] of jobs) {
      if (!enabled) continue;
      const data = sanitizeScrapedValue(await scraper(page, metadata, results));
      results[name] = data;
      await writeJson(path.join(snapshotDir, `${name}.json`), data);
      await writeJson(path.join(LATEST_DIR, `${name}.json`), data);
    }

    if (results.market) {
      await appendJsonl(path.join(DATA_DIR, "market-history.jsonl"), {
        scrapedAt: metadata.scrapedAt,
        communityId: metadata.communityId,
        playerCount: results.market.players.length,
        players: results.market.players.map((player) => ({
          playerId: player.playerId,
          name: player.name,
          seller: player.seller,
          marketValue: player.marketValue,
          askingPrice: player.askingPrice,
          expiresInText: player.expiresInText,
          points: player.points,
          average: player.average,
          valueTrend: player.valueTrend
        }))
      });
    }

    await writeJson(path.join(snapshotDir, "run.json"), {
      ...metadata,
      pages: Object.keys(results),
      counts: Object.fromEntries(Object.entries(results).map(([key, value]) => [
        key,
        value.count ?? value.players?.length ?? value.users?.length ?? value.cards?.length ?? null
      ]))
    });

    await runNodeScript(path.join(ROOT, "scripts", "build-mister-dashboard-data.mjs"));
    console.log(`Scraping Mister completado: ${Object.keys(results).join(", ")}`);
  } finally {
    await browser.close();
  }
}

function sanitizeScrapedValue(value) {
  if (typeof value === "string") {
    return value
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email-redacted]")
      .replace(/ignaciogarijo1@hotmail\.com/gi, "[email-redacted]");
  }
  if (Array.isArray(value)) return value.map(sanitizeScrapedValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeScrapedValue(item)]));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
