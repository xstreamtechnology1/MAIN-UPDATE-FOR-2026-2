const carousel = document.querySelector('.carousel');
const items = document.querySelectorAll('.carousel-item');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

let currentIndex = 0;
const totalItems = items.length;

// Function to update the carousel position
function updateCarousel() {
    const offset = -currentIndex * 100; // Each slide moves by 100% of the container width
    carousel.style.transform = `translateX(${offset}%)`;
}

// Event listeners for navigation buttons
prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + totalItems) % totalItems; // Loop back to last slide if needed
    updateCarousel();
});

nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % totalItems; // Loop to the first slide if at the end
    updateCarousel();
});

// Touch swipe functionality
let startX = 0;
let endX = 0;

carousel.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX; // Record the starting touch position
});

carousel.addEventListener('touchmove', (e) => {
    endX = e.touches[0].clientX; // Continuously update the touch position as the user swipes
});

carousel.addEventListener('touchend', () => {
    const swipeDistance = endX - startX; // Calculate swipe distance

    if (swipeDistance > 50) {
        // Swipe right
        currentIndex = (currentIndex - 1 + totalItems) % totalItems; // Move to the previous slide
        updateCarousel();
    } else if (swipeDistance < -50) {
        // Swipe left
        currentIndex = (currentIndex + 1) % totalItems; // Move to the next slide
        updateCarousel();
    }
});

// Initialize alignment
updateCarousel();
