const sermonCarousel = document.querySelector('.sermon-carousel');
const sermonSlides = document.querySelectorAll('.sermon-slide');
const sermonPrev = document.querySelector('.sermon-prev');
const sermonNext = document.querySelector('.sermon-next');

let sermonCurrentIndex = 0;
const sermonTotalItems = sermonSlides.length;
const sermonSlideWidth = sermonSlides[0].offsetWidth + parseInt(getComputedStyle(sermonSlides[0]).marginRight);
let sermonStartX = 0; // Updated variable name
let currentTranslate = 0;
let isSwiping = false;

// Function to update the carousel position
function sermonUpdateCarousel() {
    currentTranslate = -sermonCurrentIndex * sermonSlideWidth;
    sermonCarousel.style.transition = 'transform 0.5s ease-in-out';
    sermonCarousel.style.transform = `translateX(${currentTranslate}px)`;
}

// Event listeners for navigation buttons
sermonPrev.addEventListener('click', () => {
    if (sermonCurrentIndex > 0) {
        sermonCurrentIndex--;
        sermonUpdateCarousel();
    }
});

sermonNext.addEventListener('click', () => {
    if (sermonCurrentIndex < sermonTotalItems - 1) {
        sermonCurrentIndex++;
        sermonUpdateCarousel();
    }
});

// Handle touch start
sermonCarousel.addEventListener('touchstart', (event) => {
    sermonStartX = event.touches[0].clientX; // Updated variable name
    isSwiping = true;
    sermonCarousel.style.transition = 'none'; // Disable transition for smooth dragging
});

// Handle touch move
sermonCarousel.addEventListener('touchmove', (event) => {
    if (!isSwiping) return;

    const touchX = event.touches[0].clientX;
    const deltaX = touchX - sermonStartX; // Updated variable name

    // Move the carousel with touch
    sermonCarousel.style.transform = `translateX(${currentTranslate + deltaX}px)`;
});

// Handle touch end
sermonCarousel.addEventListener('touchend', (event) => {
    if (!isSwiping) return;
    isSwiping = false;

    const touchEndX = event.changedTouches[0].clientX;
    const deltaX = touchEndX - sermonStartX; // Updated variable name

    // Determine if swipe threshold is met (e.g., swipe by at least 50px)
    if (Math.abs(deltaX) > 50) {
        if (deltaX < 0 && sermonCurrentIndex < sermonTotalItems - 1) {
            // Swipe left
            sermonCurrentIndex++;
        } else if (deltaX > 0 && sermonCurrentIndex > 0) {
            // Swipe right
            sermonCurrentIndex--;
        }
    }

    // Snap to the nearest slide
    sermonUpdateCarousel();
});

// Initialize alignment
sermonUpdateCarousel();

// Download functionality for sermon audio
const downloadBtns = document.querySelectorAll('.sermon-download-btn');
downloadBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const audioSrc = btn.getAttribute('data-src');
        const title = btn.getAttribute('data-title');
        const fileName = title.replace(/\s+/g, '_') + '.ogg';

        try {
            const response = await fetch(audioSrc);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download audio. Please try again.');
        }
    });
});
