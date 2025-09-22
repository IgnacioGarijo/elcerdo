// FECHA Y HORA OBJETIVO (cambia esto a la que quieras)
// Formato: 'YYYY-MM-DDTHH:MM:SS'
const targetDate = new Date('2025-09-23T00:00:00');

const countdownEl = document.getElementById('countdown');
const randomContainer = document.getElementById('random-images');
const img1 = document.getElementById('img1');
const img2 = document.getElementById('img2');

const images = [
  'img/img1.jpg','img/img2.jpg','img/img3.jpg',
  'img/img4.jpg','img/img5.jpg','img/img6.jpg','img/img7.jpg'
];

// --- NUEVO: función para obtener siempre la misma semilla a partir de la fecha ---
function seedFromDate(date){
  // convierte la fecha en un número estable (milisegundos desde 1970)
  return date.getTime();
}

// Pequeño generador pseudoaleatorio a partir de una semilla
function seededRandom(seed){
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pickImages() {
  const seed = seedFromDate(targetDate);
  // primer número
  const r1 = Math.floor(seededRandom(seed) * images.length);
  // segundo número, asegurando que no se repita el primero
  let r2;
  do {
    r2 = Math.floor(seededRandom(seed + 1) * images.length);
  } while (r2 === r1);

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
