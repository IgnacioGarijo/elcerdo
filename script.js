// ------------------------------
// REFERENCIAS AL DOM
// ------------------------------
const countdownEl = document.getElementById('countdown');
const randomContainer = document.getElementById('random-images');
const img1 = document.getElementById('img1');
const img2 = document.getElementById('img2');

const mainImage = document.getElementById("main-image");
const evilLaugh = document.getElementById("evil-laugh");
const coinContainer = document.getElementById("coin-container");

// ------------------------------
// IMAGENES DISPONIBLES
// ------------------------------
const images = [
  'img/img1.jpg',
  'img/img2.jpg',
  'img/img3.jpg',
  'img/img4.jpg',
  'img/img5.jpg',
  'img/img6.jpg',
  'img/img7.jpg'
];

// ------------------------------
// CALENDARIO LALIGA 2026/27
// La cuenta atras acaba 24h antes del primer partido de cada jornada.
// Si solo hay fecha oficial, se usa 19:00 hora peninsular espanola.
// ------------------------------
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

const revealBeforeStartMs = 24 * 60 * 60 * 1000;
const visibleAfterStartMs = (4 * 24 + 6) * 60 * 60 * 1000;

// ------------------------------
// CONVERSION ROBUSTA A UTC
// Convierte una hora peninsular espanola en el instante real global.
// Funciona con horario de verano/invierno.
// ------------------------------
function dateFromSpainTime({ year, month, day, hour, minute }) {
  const utcGuess = new Date(Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    0
  ));

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

  const get = type => parts.find(p => p.type === type).value;

  const spainTime = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );

  const offset = spainTime - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offset);
}

// ------------------------------
// SELECCION DETERMINISTA DE IMAGENES
// ------------------------------
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandomFromString(str) {
  const seed = simpleHash(str);
  return (seed % 10000) / 10000;
}

function pickImages(roundEvent) {
  const dateStr = `jornada-${roundEvent.round}-${roundEvent.revealDate.toISOString().slice(0, 16)}`;

  const r1 = Math.floor(seededRandomFromString(dateStr) * images.length);
  let r2;
  do {
    r2 = Math.floor(seededRandomFromString(dateStr + "_b") * images.length);
  } while (r2 === r1);

  return [images[r1], images[r2]];
}

// ------------------------------
// CUENTA ATRAS
// ------------------------------
const countdownPrefix = "Volvemos en: ";
let activeCardRound = null;

function buildRoundEvents() {
  return jornadaSchedule.map((item, index) => {
    const startDate = dateFromSpainTime(item.start);
    const revealDate = new Date(startDate.getTime() - revealBeforeStartMs);
    const nextStart = jornadaSchedule[index + 1]
      ? dateFromSpainTime(jornadaSchedule[index + 1].start)
      : null;
    const nextRevealDate = nextStart
      ? new Date(nextStart.getTime() - revealBeforeStartMs)
      : null;
    const naturalResetDate = new Date(startDate.getTime() + visibleAfterStartMs);
    const resetDate = nextRevealDate && nextRevealDate < naturalResetDate
      ? nextRevealDate
      : naturalResetDate;

    return {
      ...item,
      startDate,
      revealDate,
      resetDate
    };
  });
}

function getCurrentRoundState(now) {
  const roundEvents = buildRoundEvents();

  for (const event of roundEvents) {
    if (now >= event.revealDate && now < event.resetDate) {
      return { mode: "cards", event };
    }

    if (now < event.revealDate) {
      return { mode: "countdown", event, targetDate: event.revealDate };
    }
  }

  return { mode: "finished", event: roundEvents[roundEvents.length - 1] };
}

function showCards(roundEvent) {
  countdownEl.textContent = "Pagarán...";

  if (activeCardRound !== roundEvent.round) {
    const [im1, im2] = pickImages(roundEvent);
    img1.src = im1;
    img2.src = im2;
    activeCardRound = roundEvent.round;
  }

  randomContainer.classList.remove('hidden');
}

function showCountdown(targetDate) {
  activeCardRound = null;
  randomContainer.classList.add('hidden');

  const now = new Date();
  const diff = targetDate - now;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  countdownEl.textContent =
  `${countdownPrefix}${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function updateCountdown() {
  const now = new Date();
  const currentState = getCurrentRoundState(now);

  if (currentState.mode === "cards") {
    showCards(currentState.event);
    return;
  }

  if (currentState.mode === "countdown") {
    showCountdown(currentState.targetDate);
    return;
  }

  countdownEl.textContent = "Temporada terminada.";
  randomContainer.classList.add('hidden');
}

const timer = setInterval(updateCountdown, 1000);
updateCountdown();

// ------------------------------
// EASTER EGG (5 TAPS O CLICKS)
// ------------------------------
let tapCount = 0;
let tapTimer = null;
let lastTouchTime = 0;

function registerEasterEggTap() {
  tapCount++;
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => { tapCount = 0; }, 2000);

  if (tapCount >= 5) {
    triggerEasterEgg();
    tapCount = 0;
  }
}

document.body.addEventListener("touchstart", () => {
  lastTouchTime = Date.now();
  registerEasterEggTap();
});

document.body.addEventListener("click", () => {
  if (Date.now() - lastTouchTime < 700) return;
  registerEasterEggTap();
});

function triggerEasterEgg() {
  mainImage.classList.add("shake");
  setTimeout(() => mainImage.classList.remove("shake"), 600);

  evilLaugh.currentTime = 0;
  evilLaugh.play();

  for (let i = 0; i < 30; i++) {
    setTimeout(() => createCoin(), Math.random() * 2000);
  }
}

function createCoin() {
  const coin = document.createElement("img");
  coin.src = "img/moneda.png";
  coin.className = "coin";

  coin.style.left = Math.random() * 90 + "%";

  const size = 30 + Math.random() * 40;
  coin.style.width = size + "px";
  coin.style.height = size + "px";

  const duration = 2 + Math.random() * 3;
  coin.style.animationDuration = duration + "s";

  coinContainer.appendChild(coin);
  coin.addEventListener("animationend", () => coin.remove());
}
