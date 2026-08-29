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
    headlineText: document.body.innerText.slice(0, 5000),
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
      ["search", args.search, scrapeSearch]
    ];

    const results = {};
    for (const [name, enabled, scraper] of jobs) {
      if (!enabled) continue;
      const data = await scraper(page, metadata);
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
