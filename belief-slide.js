// JavaScript for handling the navigation buttons
document.addEventListener('DOMContentLoaded', function() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.belief-slide');
    const totalSlides = slides.length;

    const prevButton = document.querySelector('.beliefs-prev');
    const nextButton = document.querySelector('.beliefs-next');
    const container = document.querySelector('.beliefs-container');

    // Show the next slide
    nextButton.addEventListener('click', function() {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateCarousel();
        }
    });

    // Show the previous slide
    prevButton.addEventListener('click', function() {
        if (currentSlide > 0) {
            currentSlide--;
            updateCarousel();
        }
    });

    // Function to update the carousel position
    function updateCarousel() {
        container.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
});

