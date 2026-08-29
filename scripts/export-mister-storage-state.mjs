import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const BASE_URL = "https://mister.mundodeportivo.com/feed";
const OUTPUT_PATH = path.join(process.cwd(), "data", "private", "mister-storage-state.json");
const COMPACT_OUTPUT_PATH = path.join(process.cwd(), "data", "private", "mister-storage-state.compact.json");
const COOKIES_OUTPUT_PATH = path.join(process.cwd(), "data", "private", "mister-storage-state.cookies.json");

function isMisterDomain(value = "") {
  return /(^|\.)mundodeportivo\.com$/i.test(value.replace(/^\./, "")) ||
    /(^|\.)playmister\.com$/i.test(value.replace(/^\./, ""));
}

function isMisterOrigin(value = "") {
  return /https:\/\/([^.]+\.)?mundodeportivo\.com/i.test(value) ||
    /https:\/\/([^.]+\.)?playmister\.com/i.test(value);
}

function compactStorageState(state, options = {}) {
  const cookies = state.cookies.filter((cookie) => isMisterDomain(cookie.domain));
  const origins = options.cookiesOnly
    ? []
    : state.origins
      .filter((origin) => isMisterOrigin(origin.origin))
      .map((origin) => ({
        origin: origin.origin,
        localStorage: origin.localStorage.filter((item) => {
          const key = item.name.toLowerCase();
          return /auth|token|session|login|user|community|fg|mister|champ/.test(key);
        })
      }))
      .filter((origin) => origin.localStorage.length > 0);

  return { cookies, origins };
}

async function writeEncodedState(label, filePath, state) {
  const json = JSON.stringify(state);
  await fs.writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  const encoded = Buffer.from(json, "utf8").toString("base64");
  console.log(`${label}: ${encoded.length} caracteres en base64`);
  console.log(`${label}_PATH=${filePath}`);
  console.log(`${label}_BASE64=${encoded}`);
  return encoded;
}

async function main() {
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    locale: "es-ES",
    timezoneId: "Europe/Madrid"
  });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  console.log("Inicia sesion en la ventana de Mister si hace falta.");
  console.log("Cuando veas tu liga y el menu de Mercado/Equipo/Tabla, vuelve aqui y pulsa Enter.");

  await new Promise((resolve) => process.stdin.once("data", resolve));

  const state = await context.storageState({ path: OUTPUT_PATH });
  const compactState = compactStorageState(state);
  const cookieState = compactStorageState(state, { cookiesOnly: true });

  console.log(`Sesion guardada en ${OUTPUT_PATH}`);
  console.log("");
  console.log("Prueba primero con la version compacta. Si GitHub aun la rechaza, usa la version solo cookies.");
  console.log("Crea en GitHub el secreto MISTER_STORAGE_STATE_BASE64 con uno de estos valores:");
  console.log("");
  await writeEncodedState("COMPACT", COMPACT_OUTPUT_PATH, compactState);
  console.log("");
  await writeEncodedState("COOKIES_ONLY", COOKIES_OUTPUT_PATH, cookieState);

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
