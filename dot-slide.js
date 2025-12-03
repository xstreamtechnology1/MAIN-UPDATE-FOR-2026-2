const carouselButtonsContainer = document.querySelector(".carousel-buttons");

// Create navigation buttons dynamically
slides.forEach((_, index) => {
    const button = document.createElement("button");
    button.dataset.index = index; // Attach the slide index to the button
    button.addEventListener("click", () => {
        showSlide(index); // Navigate to the clicked slide
    });
    carouselButtonsContainer.appendChild(button);
});

// Update active slide and button
function showSlide(index) {
    slides[currentSlide].classList.remove("active");
    carouselButtonsContainer.children[currentSlide].classList.remove("active");
    currentSlide = index;
    slides[currentSlide].classList.add("active");
    carouselButtonsContainer.children[currentSlide].classList.add("active");
}

// Show next slide automatically
function showNextSlide() {
    const nextSlide = (currentSlide + 1) % slides.length;
    showSlide(nextSlide);
}

// Set the first button as active initially
carouselButtonsContainer.children[currentSlide].classList.add("active");

// Start the slideshow
setInterval(showNextSlide, 5000);
