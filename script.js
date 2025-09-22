// FECHA Y HORA OBJETIVO (cambia esto a la que quieras)
// Formato: 'YYYY-MM-DDTHH:MM:SS'
const targetDate = new Date('2025-09-30T20:00:00'); 

const countdownEl = document.getElementById('countdown');
const randomContainer = document.getElementById('random-images');
const img1 = document.getElementById('img1');
const img2 = document.getElementById('img2');

const images = [
  'img/img1.jpg','img/img2.jpg','img/img3.jpg',
  'img/img4.jpg','img/img5.jpg','img/img6.jpg','img/img7.jpg'
];

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    // Cuenta atrás terminada
    countdownEl.textContent = "¡Ya es hora!";
    showRandomImages();
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

function showRandomImages() {
  // Escoge 2 imágenes diferentes al azar
  let shuffled = images.sort(() => 0.5 - Math.random());
  img1.src = shuffled[0];
  img2.src = shuffled[1];
  randomContainer.classList.remove('hidden');
}

const timer = setInterval(updateCountdown, 1000);
updateCountdown();
