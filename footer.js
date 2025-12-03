// Show or hide the Back to Top button
window.addEventListener('scroll', () => {
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (window.scrollY > 300) {
        backToTopBtn.style.display = 'block';
    } else {
        backToTopBtn.style.display = 'none';
    }
});

// Scroll to the top smoothly when clicked
document.getElementById('back-to-top-btn').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
