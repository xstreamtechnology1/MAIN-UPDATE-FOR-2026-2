const container = document.querySelector('.tenet-container');
const slides = document.querySelectorAll('.tenet-slide');
const prevButton = document.querySelector('.tenet-prev');
const nextButton = document.querySelector('.tenet-next');

let currentIndex = 0;

function updateCarousel() {
  container.style.transform = `translateX(-${currentIndex * 100}%)`;
}

function showPrevSlide() {
  currentIndex = (currentIndex === 0) ? slides.length - 1 : currentIndex - 1;
  updateCarousel();
}

function showNextSlide() {
  currentIndex = (currentIndex + 1) % slides.length;
  updateCarousel();
}

prevButton.addEventListener('click', showPrevSlide);
nextButton.addEventListener('click', showNextSlide);

// Swipe support for touch devices
let startX = 0;
container.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

container.addEventListener('touchend', (e) => {
  const endX = e.changedTouches[0].clientX;
  if (endX < startX - 50) {
    showNextSlide();
  } else if (endX > startX + 50) {
    showPrevSlide();
  }
});
