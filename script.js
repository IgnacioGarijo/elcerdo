// ------------------------------
// 🔗 REFERENCIAS AL DOM
// ------------------------------
const countdownEl = document.getElementById('countdown');
const randomContainer = document.getElementById('random-images');
const img1 = document.getElementById('img1');
const img2 = document.getElementById('img2');

const mainImage = document.getElementById("main-image");
const evilLaugh = document.getElementById("evil-laugh");
const coinContainer = document.getElementById("coin-container");

// ------------------------------
// 🖼️ IMÁGENES DISPONIBLES
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
// 📅 FECHA OBJETIVO (EDITABLE CADA SEMANA)
// ⚠️ Hora SIEMPRE en horario peninsular español
// ------------------------------
const fechaEspaña = {
  year: 2025,
  month: 12, // 1–12
  day: 19,
  hour: 10,
  minute: 0
};

// ------------------------------
// 🕰️ CONVERSIÓN ROBUSTA A UTC (NO TOCAR)
// Convierte "21:00 España" en el instante real global
// Funciona con horario de verano/invierno
// ------------------------------
function dateFromSpainTime({ year, month, day, hour, minute }) {
  // Suposición inicial en UTC
  const utcGuess = new Date(Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    0
  ));

  // Cómo se vería esa fecha en España
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

  // Diferencia real España ↔ UTC (incluye cambio de hora)
  const offset = spainTime - utcGuess.getTime();

  // Fecha UTC final correcta
  return new Date(utcGuess.getTime() - offset);
}

const targetDate = dateFromSpainTime(fechaEspaña);

// ------------------------------
// 🔢 SELECCIÓN DETERMINISTA DE IMÁGENES
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

function pickImages() {
  // Clave estable basada en la fecha del evento
  const dateStr = targetDate.toISOString().slice(0, 16);

  const r1 = Math.floor(seededRandomFromString(dateStr) * images.length);
  let r2;
  do {
    r2 = Math.floor(seededRandomFromString(dateStr + "_b") * images.length);
  } while (r2 === r1);

  return [images[r1], images[r2]];
}

// ------------------------------
// ⏳ CUENTA ATRÁS
// ------------------------------
const countdownPrefix = "El Cerdo os desea Feliz Navidad. Volvemos en: ";

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    countdownEl.textContent = "¡Ya es hora!";
    const [im1, im2] = pickImages();
    img1.src = im1;
    img2.src = im2;
    randomContainer.classList.remove('hidden');
    clearInterval(timer);
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  countdownEl.textContent =
  `${countdownPrefix}${days}d ${hours}h ${minutes}m ${seconds}s`;
}

const timer = setInterval(updateCountdown, 1000);
updateCountdown();

// ------------------------------
// 🐷 EASTER EGG (5 TAPS)
// ------------------------------
let tapCount = 0;
let tapTimer = null;

document.body.addEventListener("touchstart", () => {
  tapCount++;
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => { tapCount = 0; }, 2000);

  if (tapCount >= 5) {
    triggerEasterEgg();
    tapCount = 0;
  }
});

function triggerEasterEgg() {
  // Agitar imagen
  mainImage.classList.add("shake");
  setTimeout(() => mainImage.classList.remove("shake"), 600);

  // Sonido
  evilLaugh.currentTime = 0;
  evilLaugh.play();

  // Lluvia de monedas
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
