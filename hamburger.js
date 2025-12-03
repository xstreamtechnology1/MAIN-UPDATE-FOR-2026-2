document.addEventListener("DOMContentLoaded", function() {
    const hamburger = document.getElementById("hamburger-icon");
    const navLinks = document.querySelector("nav > ul");

    // Check if elements exist before adding event listener
    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }
});
