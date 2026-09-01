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
const PLAYER_DETAIL_CONCURRENCY = Number(process.env.MISTER_PLAYER_DETAIL_CONCURRENCY || 8);
const PLAYER_MOVEMENT_CONCURRENCY = Number(process.env.MISTER_PLAYER_MOVEMENT_CONCURRENCY || 12);
const PLAYER_MOVEMENT_LIMIT = Number(process.env.MISTER_PLAYER_MOVEMENT_LIMIT || 700);

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

function cleanTransferParty(value) {
  return String(value || "").replace(/\s+por pago de cl[áa]usula\s*$/i, "").trim();
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function appendJsonl(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(data)}\n`, "utf8");
}

async function readJsonl(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch {
    return [];
  }
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

  const localStatePath = path.join(ROOT, "data", "private", "mister-storage-state.json");
  try {
    await fs.access(localStatePath);
    return localStatePath;
  } catch {
    return undefined;
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

  const feed = await page.evaluate(() => {
    const parseNumber = (value) => {
      if (value == null) return null;
      const normalized = String(value).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const cleanParty = (value) => String(value || "").replace(/\s+por pago de cl[áa]usula\s*$/i, "").trim();
    const transferCards = [...document.querySelectorAll(".card-transfer")].flatMap((card) =>
      [...card.querySelectorAll("ul.player-list > li")].map((item) => {
        const title = item.querySelector(".title")?.innerText?.trim().replace(/\s+/g, " ") || "";
        const movement = title.match(/^(.+?)\s+cambia de\s+(.+?)\s+a\s+(.+?)(?:\s+por pago de cl[áa]usula)?$/i);
        if (!movement) return null;
        const playerLink = item.querySelector('a.player[href*="players/"]');
        const playerId = playerLink?.href?.match(/\/players\/(\d+)\//)?.[1] || null;
        const otherBids = [...item.querySelectorAll(".other-bids li:not(.other-bids-title)")].map((bid) => {
          const text = bid.innerText.trim().replace(/\s+/g, " ");
          const bidMatch = text.match(/^(\d+)\.\s+(.+?)\s+›\s+([\d.]+)/);
          if (!bidMatch) return null;
          return {
            rank: Number(bidMatch[1]),
            team: bidMatch[2].trim(),
            price: parseNumber(bidMatch[3])
          };
        }).filter(Boolean);

        return {
          playerId,
          playerName: movement[1].trim(),
          from: cleanParty(movement[2]),
          to: cleanParty(movement[3]),
          price: parseNumber(item.querySelector(".price")?.innerText),
          type: /por pago de cl[áa]usula/i.test(title) ? "clause" : "transfer",
          isClause: /por pago de cl[áa]usula/i.test(title),
          otherBids,
          raw: title
        };
      }).filter(Boolean)
    );

    return {
      headlineText: document.body.innerText.slice(0, 30000),
      links: [...document.querySelectorAll('a[href*="players/"], a[href*="users/"]')].map((link) => ({
        text: link.innerText.trim().replace(/\s+/g, " "),
        href: link.href
      })),
      cards: [...document.querySelectorAll("#feed .card, .feed-card, article, .activity, .post")].map((card) => ({
        text: card.innerText.trim().replace(/\s+/g, " "),
        links: [...card.querySelectorAll("a[href]")].map((link) => ({ text: link.innerText.trim(), href: link.href }))
      })).filter((card) => card.text),
      transferCards
    };
  });

  const transfers = mergeStructuredFeedTransfers(parseFeedTransfers(feed.headlineText, metadata.scrapedAt), feed.transferCards || []);
  return { ...metadata, page: "feed", url: page.url(), ...feed, transfers };
}

function transferMergeKey(transfer) {
  return [
    transfer.playerName,
    cleanTransferParty(transfer.from),
    cleanTransferParty(transfer.to),
    transfer.price ?? ""
  ].map((part) => String(part || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")).join("|");
}

function mergeStructuredFeedTransfers(parsedTransfers = [], structuredTransfers = []) {
  const structuredByKey = new Map();
  for (const transfer of structuredTransfers) {
    structuredByKey.set(transferMergeKey(transfer), transfer);
  }

  const merged = parsedTransfers.map((transfer) => {
    const structured = structuredByKey.get(transferMergeKey(transfer));
    if (!structured) return transfer;
    structuredByKey.delete(transferMergeKey(transfer));
    return {
      ...transfer,
      playerId: transfer.playerId || structured.playerId || null,
      type: transfer.type || structured.type,
      isClause: Boolean(transfer.isClause || structured.isClause),
      otherBids: structured.otherBids || []
    };
  });

  for (const transfer of structuredByKey.values()) {
    merged.push({
      scrapedAt: null,
      dateText: null,
      occurredAt: null,
      ...transfer,
      from: cleanTransferParty(transfer.from),
      to: cleanTransferParty(transfer.to),
      otherBids: transfer.otherBids || []
    });
  }

  return merged;
}

function parseFeedTransfers(text = "", scrapedAt = new Date().toISOString()) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const transfers = [];
  const pricePattern = /^[\d.]{4,}$/;
  let lastDateText = null;

  for (let i = 0; i < lines.length; i++) {
    const movement = lines[i].match(/^(.+?)\s+cambia de\s+(.+?)\s+a\s+(.+?)(?:\s+por pago de cl[áa]usula)?$/i);
    if (!movement) continue;
    const isClause = /por pago de cl[áa]usula/i.test(lines[i]);

    const dateText = /^(ahora|\d+\s*(?:s|min|h|d|sem|mes|meses|año|años))$/i.test(lines[i - 1] || "") ? lines[i - 1] : lastDateText;
    if (dateText) lastDateText = dateText;
    let price = null;
    for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
      if (pricePattern.test(lines[j])) {
        price = parseSpanishNumber(lines[j]);
        break;
      }
      if (/^(.+?)\s+cambia de\s+(.+?)\s+a\s+(.+)$/i.test(lines[j])) break;
    }

    transfers.push({
      scrapedAt,
      dateText,
      occurredAt: approximateOccurredAt(dateText, scrapedAt),
      playerName: movement[1].trim(),
      from: cleanTransferParty(movement[2]),
      to: cleanTransferParty(movement[3]),
      price,
      type: isClause ? "clause" : "transfer",
      isClause,
      raw: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 7)).join(" | ")
    });
  }

  return transfers;
}

async function persistRosterSnapshot(deep, metadata = {}) {
  const latestRound = (deep?.rounds || []).at(-1);
  const userRounds = latestRound?.userRounds || [];
  if (!userRounds.length) return;
  await appendJsonl(path.join(DATA_DIR, "roster-history.jsonl"), {
    ...metadata,
    round: latestRound.round || null,
    gameweekId: latestRound.gameweekId || null,
    teams: userRounds.map((userRound) => ({
      managerId: userRound.manager?.managerId || null,
      name: userRound.manager?.name || null,
      players: (userRound.currentSquad || userRound.squad || []).map((player) => ({
        playerId: player.playerId || null,
        name: player.name || null,
        position: player.position || null,
        marketValue: player.marketValue ?? null,
        acquiredAt: player.acquiredAt || null,
        acquisitionPrice: player.acquisitionPrice ?? null,
        clause: player.clause ?? null
      }))
    }))
  });
}

function transferKey(transfer) {
  const type = transfer.isClause ? "clause" : transfer.type || "transfer";
  return [
    transfer.playerName,
    transfer.from,
    transfer.to,
    transfer.price ?? "",
    type,
    JSON.stringify(transfer.otherBids || [])
  ].map((part) => String(part || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")).join("|");
}

async function persistTransfers(transfers = [], metadata = {}) {
  const latestPath = path.join(LATEST_DIR, "transfers.json");
  await writeJson(latestPath, {
    ...metadata,
    count: transfers.length,
    transfers
  });

  if (!transfers.length) return;
  const historyPath = path.join(DATA_DIR, "transfer-history.jsonl");
  const existing = await readJsonl(historyPath);
  const seen = new Set(existing.flatMap((entry) => (entry.transfers || [entry]).map(transferKey)));
  const fresh = transfers.filter((transfer) => {
    const key = transferKey(transfer);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (fresh.length) {
    await appendJsonl(historyPath, {
      ...metadata,
      transferCount: fresh.length,
      transfers: fresh
    });
  }
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
  await page.goto(`${BASE_URL}/feed`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  const apiState = await createApiState(page);
  const gameweekPanel = await apiPost(page, "/ajax/sw/gameweek", { post: "gameweek", comments: 0 }, apiState);
  const gameweeks = extractGameweeksFromApi(gameweekPanel.data) || extractGameweeksFromStandings(standings);
  const managers = extractManagersFromStandings(standings);
  const allPlayers = await fetchAllPlayers(page, apiState);
  const playerMovementHistory = await fetchPlayerMovementHistories(page, allPlayers, metadata);
  const rounds = [];

  for (const gameweek of gameweeks) {
    console.log(`Scrape jornada profunda J${gameweek.round} por endpoints`);
    const gameweekData = await apiPost(page, "/ajax/sw/gameweek", {
      post: "gameweek",
      id: gameweek.gameweekId,
      comments: 0
    }, apiState);
    const standingsPage = await scrapeStandingsGameweek(page, gameweek, metadata);
    const userRounds = [];
    const detailPairs = new Map();

    for (const manager of managers) {
      console.log(`Scrape alineacion J${gameweek.round}: ${manager.name}`);
      const userRound = await fetchUserRound(page, manager, gameweek, apiState, metadata);
      userRounds.push(userRound);
      for (const player of [...userRound.lineup, ...userRound.bench]) {
        if (!player.playerId || player.points === "-" || player.points === "?" || player.played === 0) continue;
        detailPairs.set(`${player.playerId}:${gameweek.gameweekId}`, {
          playerId: player.playerId,
          gameweekId: gameweek.gameweekId
        });
      }
    }

    const playerDetails = await fetchPlayerGameweekDetails(page, [...detailPairs.values()], apiState);
    const detailLookup = new Map(playerDetails.map((detail) => [`${detail.playerId}:${detail.gameweekId}`, detail]));
    for (const userRound of userRounds) {
      userRound.lineup = userRound.lineup.map((player) => enrichRoundPlayer(player, detailLookup, gameweek.gameweekId));
      userRound.bench = userRound.bench.map((player) => enrichRoundPlayer(player, detailLookup, gameweek.gameweekId));
    }

    rounds.push({
      ...gameweek,
      standings: standingsPage.rows,
      status: normalizeGameweekStatus(gameweekData.data?.gameweekStatus || gameweek.status || standingsPage.status),
      matches: normalizeMatches(gameweekData.data?.games || []),
      bestXi: normalizeBestXi(gameweekData.data?.best_lineup || []),
      leaguePlayers: normalizeLeaguePlayers(gameweekData.data?.players || []),
      userRounds,
      playerDetails
    });
  }

  return {
    ...metadata,
    page: "deep",
    url: page.url(),
    method: "mister-json-endpoints",
    apiEndpoints: ["/ajax/sw/players", "/ajax/sw/gameweek", "/ajax/sw/users", "/ajax/player-gameweek"],
    gameweeks,
    managers,
    allPlayers,
    playerMovementHistory,
    rounds,
    playerProfiles: buildPlayerProfilesFromDeep(allPlayers, rounds, playerMovementHistory)
  };
}

async function fetchPlayerMovementHistories(page, players, metadata) {
  const refs = players.filter((player) => player.playerId && player.href).slice(0, PLAYER_MOVEMENT_LIMIT);
  const histories = [];
  for (let index = 0; index < refs.length; index += PLAYER_MOVEMENT_CONCURRENCY) {
    const batch = refs.slice(index, index + PLAYER_MOVEMENT_CONCURRENCY);
    const items = await Promise.all(batch.map(async (player) => {
      try {
        const response = await page.context().request.get(player.href, { timeout: 20000 });
        if (!response.ok()) return { playerId: player.playerId, name: player.name, href: player.href, movements: [], error: `HTTP ${response.status()}` };
        const html = await response.text();
        return {
          scrapedAt: metadata.scrapedAt,
          playerId: player.playerId,
          name: player.name,
          href: player.href,
          movements: parsePlayerMovementHtml(html, player, metadata.scrapedAt)
        };
      } catch (error) {
        return { playerId: player.playerId, name: player.name, href: player.href, movements: [], error: error.message };
      }
    }));
    histories.push(...items);
    console.log(`Scrape movimientos jugador ${Math.min(index + batch.length, refs.length)}/${refs.length}`);
  }
  return histories;
}

function parsePlayerMovementHtml(html, player, scrapedAt) {
  const movements = [];
  const movementPattern = /<li>[\s\S]*?<div class="label">\s*([^<]+?)\s*<\/div>[\s\S]*?<div class="value">\s*De\s*<strong>([^<]+)<\/strong>\s*a\s*<strong>([^<]+)<\/strong>\s*<\/div>[\s\S]*?<div class="right">([^<]+)<\/div>[\s\S]*?<\/li>/gi;
  for (const match of html.matchAll(movementPattern)) {
    const [datePart, typePart] = decodeHtml(match[1]).split("·").map((part) => part.trim());
    movements.push({
      scrapedAt,
      source: "player-profile",
      dateText: datePart || null,
      type: typePart || null,
      playerId: player.playerId,
      playerName: player.name,
      from: decodeHtml(match[2]).trim(),
      to: decodeHtml(match[3]).trim(),
      price: parseSpanishNumber(decodeHtml(match[4])),
      href: player.href
    });
  }
  return movements;
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function createApiState(page) {
  await page.waitForFunction(() => window._FG_cfg?.auth, null, { timeout: 10000 }).catch(() => {});
  const auth = await page.evaluate(() => window._FG_cfg?.auth || null);
  if (!auth) throw new Error("No se pudo leer X-Auth de Mister. Revisa la sesion guardada.");
  return { auth };
}

async function apiPost(page, endpoint, params, apiState) {
  return page.evaluate(async ({ endpoint, params, auth }) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "X-Auth": auth,
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: new URLSearchParams(params).toString()
    });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return {
      ok: response.ok,
      status: response.status,
      data: json?.data ?? null,
      error: json?.msg || json?.message || (!response.ok ? text.slice(0, 300) : null)
    };
  }, { endpoint, params, auth: apiState.auth });
}

async function fetchAllPlayers(page, apiState) {
  const players = [];
  const seen = new Set();
  for (let offset = 0; offset < 2000; offset += 50) {
    const response = await apiPost(page, "/ajax/sw/players", {
      post: "players",
      position: 0,
      value_from: 0,
      value_to: 0,
      clause_from: 0,
      clause_to: 0,
      team: 0,
      injured: 0,
      favs: 0,
      owner: 0,
      benched: 0,
      stealable: 0,
      offset,
      order: 0,
      name: "",
      comments: 0
    }, apiState);
    const batch = response.data?.players || [];
    for (const player of batch) {
      if (seen.has(String(player.id))) continue;
      seen.add(String(player.id));
      players.push(normalizeSearchPlayer(player));
    }
    if (batch.length < 50) break;
  }
  return players;
}

async function fetchUserRound(page, manager, gameweek, apiState, metadata) {
  const response = await apiPost(page, "/ajax/sw/users", {
    post: "users",
    id: manager.managerId,
    qs: `gw=${gameweek.gameweekId}`,
    comments: 0
  }, apiState);
  const data = response.data || {};
  const lineup = flattenLineup(data.lineup).map((player) => normalizeRoundPlayer(player, "lineup", gameweek, manager));
  const bench = (Array.isArray(data.bench) ? data.bench : []).map((player) => normalizeRoundPlayer(player, "bench", gameweek, manager));
  return {
    ...metadata,
    manager,
    round: gameweek.round,
    gameweekId: gameweek.gameweekId,
    selected: `J${gameweek.round}`,
    userInfo: data.userInfo || null,
    season: data.season || null,
    userGameWeeks: data.userGameWeeks || {},
    value: data.value || null,
    currentSquad: (data.team_now || []).map(normalizeSearchPlayer),
    lineup,
    bench,
    squad: (data.team_now || []).map(normalizeSearchPlayer)
  };
}

async function fetchPlayerGameweekDetails(page, pairs, apiState) {
  const results = [];
  for (let index = 0; index < pairs.length; index += PLAYER_DETAIL_CONCURRENCY) {
    const batch = pairs.slice(index, index + PLAYER_DETAIL_CONCURRENCY);
    const details = await Promise.all(batch.map(async (pair) => {
      const response = await apiPost(page, "/ajax/player-gameweek", {
        id_gameweek: pair.gameweekId,
        id_player: pair.playerId
      }, apiState);
      if (!response.ok || !response.data) {
        return { ...pair, status: response.status, error: response.error || "Sin puntuacion" };
      }
      return normalizePlayerGameweekDetail(pair, response.data);
    }));
    results.push(...details);
  }
  return results;
}

function extractGameweeksFromApi(data) {
  const gameweeks = data?.gameweeks;
  if (!gameweeks || typeof gameweeks !== "object") return null;
  const parsed = Object.values(gameweeks)
    .map((item) => ({
      round: Number(item.number),
      gameweekId: String(item.id),
      season: item.season,
      status: normalizeGameweekStatus(item.internalStatus || item.status),
      type: item.type || null,
      firstMatchDate: item.firstMatchDate || null,
      lastMatchDate: item.lastMatchDate || null,
      href: `${BASE_URL}/standings?gw=${item.id}`
    }))
    .filter((item) => Number.isFinite(item.round) && item.gameweekId)
    .sort((a, b) => a.round - b.round);
  return parsed.length ? parsed : null;
}

function normalizeGameweekStatus(status) {
  if (status && typeof status === "object") {
    status = status.internalStatus || status.status || status.name || status.slug || status.label;
  }
  const value = String(status || "").toLowerCase();
  if (["closed", "finished", "played"].includes(value)) return "closed";
  if (["ongoing", "playing", "live", "in_progress"].includes(value)) return "in_progress";
  if (["unstarted", "pending", "scheduled"].includes(value)) return "scheduled";
  return value || "unknown";
}

function flattenLineup(lineup) {
  if (!lineup?.positions) return [];
  return Object.values(lineup.positions).flatMap((position) => Object.values(position || {}));
}

function normalizeSearchPlayer(player = {}) {
  const playerId = player.playerId || player.id || player.id_player || null;
  return {
    playerId: playerId ? String(playerId) : null,
    id: playerId ? Number(playerId) : null,
    name: player.name || null,
    short: player.short || null,
    href: playerId ? `${BASE_URL}/players/${playerId}/${slugify(player.name || player.short || String(playerId))}` : null,
    positionId: player.position ? Number(player.position) : null,
    position: player.position ? POSITION_NAMES[player.position] || null : null,
    teamId: player.id_team ?? null,
    points: numberOrNull(player.points),
    average: numberOrNull(player.avg),
    streak: Array.isArray(player.streak) ? player.streak.map(numberOrNull) : [],
    streakSum: numberOrNull(player.streak_sum),
    marketValue: numberOrNull(player.value),
    previousValue: numberOrNull(player.prev_value),
    ownerId: player.id_uc ? String(player.id_uc) : null,
    ownerName: player.uc_name || null,
    acquiredAt: player.created || null,
    acquisitionPrice: numberOrNull(player.price),
    marketSalePrice: numberOrNull(player.market?.input),
    marketActive: Boolean(player.market),
    clause: typeof player.clause === "object" ? player.clause : numberOrNull(player.clause),
    status: player.status || null,
    isMine: Boolean(player.is_mine),
    photoUrl: player.photoUrl || null,
    teamLogoUrl: player.teamLogoUrl || null
  };
}

function normalizeRoundPlayer(player = {}, slot, gameweek, manager) {
  const normalized = normalizeSearchPlayer(player);
  return {
    ...normalized,
    gameweekId: String(gameweek.gameweekId),
    round: gameweek.round,
    managerId: String(manager.managerId),
    slot,
    lineupSlot: player.slot ?? null,
    points: numberOrNull(player.points),
    livePoints: numberOrNull(player.livePoints),
    played: player.played ?? null,
    matchId: player.match_id ? String(player.match_id) : null,
    matchStatus: player.match_status || null,
    captain: Boolean(player.captain),
    isCaptain: Boolean(player.captain),
    captainMultiplier: numberOrNull(player.captain_multiplier),
    bestXi: Boolean(player.best_xi),
    gradedAt: {
      as: player.as_graded_date || null,
      marca: player.marca_graded_date || null,
      sofascore: player.sofascore_graded_date || null,
      mundoDeportivo: player.mundodeportivo_graded_date || null,
      mixto: player.mixtos_graded_date || null,
      marcaStats: player.marca_stats_graded_date || null
    }
  };
}

function enrichRoundPlayer(player, detailLookup, gameweekId) {
  const detail = detailLookup.get(`${player.playerId}:${gameweekId}`);
  if (!detail || detail.error) return { ...player, detail: detail || null };
  return {
    ...player,
    points: detail.points?.final ?? player.points,
    providerPoints: detail.points || {},
    ratings: detail.ratings || {},
    events: detail.events || {},
    stats: detail.stats || {},
    detail
  };
}

function normalizePlayerGameweekDetail(pair, data = {}) {
  const stats = parseMaybeJson(data.marca_stats_rating_detailed) || {};
  return {
    playerId: String(pair.playerId),
    gameweekId: String(pair.gameweekId),
    status: 200,
    id: data.id ? String(data.id) : null,
    name: data.name || null,
    positionId: data.position ? Number(data.position) : null,
    position: data.position ? POSITION_NAMES[data.position] || null : null,
    teamId: data.id_team ?? null,
    matchId: data.id_match ? String(data.id_match) : null,
    gameweekLabel: data.gameweek || null,
    value: numberOrNull(data.value),
    points: {
      final: numberOrNull(data.points),
      mixto: numberOrNull(data.points_mix),
      mixto2: numberOrNull(data.points_mix2),
      as: numberOrNull(data.points_as),
      marca: numberOrNull(data.points_marca),
      mundoDeportivo: numberOrNull(data.points_md),
      sofascore: numberOrNull(data.points_mr),
      marcaStats: numberOrNull(data.points_marca_stats)
    },
    ratings: {
      as: numberOrNull(data.rating_as),
      marca: numberOrNull(data.rating_marca),
      mundoDeportivo: numberOrNull(data.rating_md),
      sofascore: numberOrNull(data.rating_ss),
      marcaStats: numberOrNull(data.rating_marca_stats)
    },
    events: normalizeEvents(data.events),
    stats: normalizeStats(stats),
    rawStats: stats,
    match: {
      status: data.status || null,
      homeId: data.id_home ?? null,
      awayId: data.id_away ?? null,
      home: data.home || null,
      away: data.away || null,
      goalsHome: numberOrNull(data.goals_home),
      goalsAway: numberOrNull(data.goals_away)
    },
    gradedAt: {
      as: data.as_graded_date || null,
      marca: data.marca_graded_date || null,
      mundoDeportivo: data.md_graded_date || null,
      mixto: data.updated || null
    }
  };
}

function normalizeStats(stats = {}) {
  return Object.fromEntries(Object.entries(stats).map(([key, value]) => [
    key,
    value && typeof value === "object"
      ? { value: numberOrNull(value.value), rating: numberOrNull(value.rating) }
      : { value: numberOrNull(value), rating: null }
  ]));
}

function normalizeEvents(events = {}) {
  if (!events || typeof events !== "object") return {};
  return Object.fromEntries(Object.entries(events).map(([key, value]) => [
    key,
    {
      count: numberOrNull(value?.count) || 0,
      points: numberOrNull(value?.points) || 0
    }
  ]));
}

function normalizeMatches(games = []) {
  return games.map((game) => ({
    matchId: game.id ? String(game.id) : game.id_match ? String(game.id_match) : null,
    homeId: game.id_home ?? null,
    awayId: game.id_away ?? null,
    home: game.home || game.home_name || null,
    away: game.away || game.away_name || null,
    goalsHome: numberOrNull(game.goals_home),
    goalsAway: numberOrNull(game.goals_away),
    status: game.status || null,
    date: game.date || game.match_date || null,
    stats: parseMaybeJson(game.stats) || game.stats || null
  }));
}

function normalizeBestXi(players = []) {
  return Array.isArray(players) ? players.map((player) => normalizeRoundPlayer(player, "bestXi", {
    round: null,
    gameweekId: player.id_gameweek || player.gameweekId || null
  }, { managerId: player.id_uc || null })) : [];
}

function normalizeLeaguePlayers(players = []) {
  return Array.isArray(players) ? players.map(normalizeSearchPlayer) : [];
}

function buildPlayerProfilesFromDeep(allPlayers, rounds, playerMovementHistory = []) {
  const movementsByPlayer = new Map(playerMovementHistory.map((item) => [String(item.playerId), item.movements || []]));
  const byId = new Map((allPlayers || []).map((player) => [String(player.playerId), {
    ...player,
    movements: movementsByPlayer.get(String(player.playerId)) || [],
    gameweeks: [],
    providerScores: [],
    totals: { goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
  }]));
  for (const round of rounds || []) {
    for (const detail of round.playerDetails || []) {
      if (!detail?.playerId || detail.error) continue;
      const profile = byId.get(String(detail.playerId)) || { playerId: String(detail.playerId), name: detail.name, gameweeks: [], providerScores: [], totals: { goals: 0, assists: 0, yellowCards: 0, redCards: 0 } };
      profile.name ||= detail.name;
      profile.position ||= detail.position;
      profile.positionId ||= detail.positionId;
      profile.marketValue ||= detail.value;
      profile.gameweeks.push({
        gameweekId: detail.gameweekId,
        label: detail.gameweekLabel,
        points: detail.points?.final,
        status: "played",
        eventIcons: Object.keys(detail.events || {})
      });
      profile.providerScores.push({
        gameweekId: detail.gameweekId,
        label: detail.gameweekLabel,
        finalPoints: detail.points?.final,
        providers: [
          { name: "AS", points: detail.points?.as },
          { name: "Marca", points: detail.points?.marca },
          { name: "Mundo Deportivo", points: detail.points?.mundoDeportivo },
          { name: "Sofascore", points: detail.points?.sofascore },
          { name: "Marca Stats", points: detail.points?.marcaStats }
        ].filter((provider) => Number.isFinite(provider.points))
      });
      profile.totals.goals += statValue(detail, "goals");
      profile.totals.assists += statValue(detail, "goalAssist");
      profile.totals.yellowCards += statValue(detail, "yellowCard");
      profile.totals.redCards += statValue(detail, "redCard") + statValue(detail, "doubleYellowCard");
      profile.goals = profile.totals.goals;
      profile.assists = profile.totals.assists;
      profile.cards = profile.totals.yellowCards + profile.totals.redCards;
      byId.set(String(detail.playerId), profile);
    }
  }
  return [...byId.values()].filter((player) => player.gameweeks?.length).sort((a, b) => (b.points || 0) - (a.points || 0));
}

function statValue(detail, key) {
  return numberOrNull(detail?.stats?.[key]?.value) || 0;
}

function numberOrNull(value) {
  if (value === "-" || value === "?" || value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function approximateOccurredAt(dateText, scrapedAt = new Date().toISOString()) {
  const base = new Date(scrapedAt);
  if (Number.isNaN(base.getTime()) || !dateText) return null;
  if (/^ahora$/i.test(dateText)) return base.toISOString();
  const match = String(dateText).match(/^(\d+)\s*(s|min|h|d|sem|mes|meses|año|años)$/i);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    s: 1000,
    min: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    sem: 7 * 24 * 60 * 60 * 1000,
    mes: 30 * 24 * 60 * 60 * 1000,
    meses: 30 * 24 * 60 * 60 * 1000,
    "año": 365 * 24 * 60 * 60 * 1000,
    "años": 365 * 24 * 60 * 60 * 1000
  };
  return new Date(base.getTime() - value * (multipliers[unit] || 0)).toISOString();
}

function parseMaybeJson(value) {
  if (!value || typeof value !== "string") return value || null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

    if (results.feed) {
      await persistTransfers(results.feed.transfers || [], metadata);
    }

    if (results.deep) {
      await persistRosterSnapshot(results.deep, metadata);
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
