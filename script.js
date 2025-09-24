
const countdownEl = document.getElementById('countdown');
const randomContainer = document.getElementById('random-images');
const img1 = document.getElementById('img1');
const img2 = document.getElementById('img2');

const images = [
  'img/img1.jpg','img/img2.jpg','img/img3.jpg',
  'img/img4.jpg','img/img5.jpg','img/img6.jpg','img/img7.jpg'
];

// 👇 AQUÍ introduces fecha y hora EN HORARIO DE ESPAÑA (península)
const fechaEspaña = {
  year: 2025,
  month: 9,
  day: 25,
  hour: 21,
  minute: 0
};

// --- NUEVO: convertir automáticamente a UTC ---
const { DateTime } = luxon;
const targetDate = DateTime.fromObject(fechaEspaña, { zone: "Europe/Madrid" })
                            .toUTC()
                            .toJSDate();   // convierte a objeto Date nativo

function seedFromDate(date){
  return date.getTime();
}

function seededRandom(seed){
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pickImages() {
  const seed = seedFromDate(targetDate);
  const r1 = Math.floor(seededRandom(seed) * images.length);
  let r2;
  do { r2 = Math.floor(seededRandom(seed + 1) * images.length); }
  while (r2 === r1);
  return [images[r1], images[r2]];
}

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

const mainImage = document.getElementById("main-image");
const evilLaugh = document.getElementById("evil-laugh");
const coinContainer = document.getElementById("coin-container");

let tapCount = 0;
let tapTimer = null;

// Detecta taps rápidos (por ejemplo 5 en 2 segundos)
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

  // 3️⃣ Generar monedas
  for (let i = 0; i < 20; i++) {
    createCoin();
  }
}

function createCoin() {
  const coin = document.createElement("img");
  coin.src = "img/moneda.png";
  coin.className = "coin";

  // Posición aleatoria en el ancho de la pantalla
  coin.style.left = Math.random() * 90 + "%";

  // Tamaño aleatorio (opcional)
  const size = 30 + Math.random() * 40;
  coin.style.width = size + "px";
  coin.style.height = size + "px";

  coinContainer.appendChild(coin);

  // Eliminar cuando termine la animación
  coin.addEventListener("animationend", () => coin.remove());
}
