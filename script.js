const countdownEl = document.getElementById('countdown');
const randomContainer = document.getElementById('random-images');
const img1 = document.getElementById('img1');
const img2 = document.getElementById('img2');

const images = [
  'img/img1.jpg','img/img2.jpg','img/img3.jpg',
  'img/img4.jpg','img/img5.jpg','img/img6.jpg','img/img7.jpg'
];

// 👇 Ajusta aquí la fecha y hora EN HORARIO DE ESPAÑA (península)
const fechaEspaña = {
  year: 2025,
  month: 10,
  day: 23,   // jueves siguiente
  hour: 21,
  minute: 0
};

// --- Conversión automática a UTC ---
const { DateTime } = luxon;
const targetDate = DateTime.fromObject(fechaEspaña, { zone: "Europe/Madrid" })
                            .toUTC()
                            .toJSDate();

// ------------------------------
// 🔢 NUEVO SISTEMA DE SELECCIÓN
// ------------------------------
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // convierte a 32 bits
  }
  return Math.abs(hash);
}

function seededRandomFromString(str) {
  const seed = simpleHash(str);
  return (seed % 10000) / 10000;
}

function pickImages() {
  // Fecha base como cadena tipo "2025-10-23T21:00"
  const dateStr = targetDate.toISOString().slice(0, 16);

  const r1 = Math.floor(seededRandomFromString(dateStr) * images.length);
  let r2;
  do {
    r2 = Math.floor(seededRandomFromString(dateStr + "_b") * images.length);
  } while (r2 === r1);

  return [images[r1], images[r2]];
}

// ------------------------------
// ⏳ LÓGICA DE LA CUENTA ATRÁS
// ------------------------------
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
    `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

const timer = setInterval(updateCountdown, 1000);
updateCountdown();

// ------------------------------
// 🐷 EASTER EGG DE LA RISA + MONEDAS
// ------------------------------
const mainImage = document.getElementById("main-image");
const evilLaugh = document.getElementById("evil-laugh");
const coinContainer = document.getElementById("coin-container");

let tapCount = 0;
let tapTimer = null;

// Detecta 5 taps rápidos en 2 segundos
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
  // 1️⃣ Agitar imagen
  mainImage.classList.add("shake");
  setTimeout(() => mainImage.classList.remove("shake"), 600);

  // 2️⃣ Reproducir sonido
  evilLaugh.currentTime = 0;
  evilLaugh.play();

  // 3️⃣ Lluvia de monedas
  for (let i = 0; i < 30; i++) {
    setTimeout(() => createCoin(), Math.random() * 2000); 
  }
}

function createCoin() {
  const coin = document.createElement("img");
  coin.src = "img/moneda.png";
  coin.className = "coin";

  // Posición horizontal aleatoria (0–90%)
  coin.style.left = Math.random() * 90 + "%";

  // Tamaño aleatorio
  const size = 30 + Math.random() * 40;
  coin.style.width = size + "px";
  coin.style.height = size + "px";

  // Duración de la caída (2–5s)
  const duration = 2 + Math.random() * 3;
  coin.style.animationDuration = duration + "s";

  coinContainer.appendChild(coin);

  // Eliminar al acabar animación
  coin.addEventListener("animationend", () => coin.remove());
}
