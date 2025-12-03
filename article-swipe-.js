// === Article Carousel & Swipe Script === //

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById('articles-list');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');

    if (!list) return;

    // Click Navigation (Desktop)
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            list.scrollBy({
                left: -list.offsetWidth / 2,
                behavior: 'smooth'
            });
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            list.scrollBy({
                left: list.offsetWidth / 2,
                behavior: 'smooth'
            });
        });
    }

    // Mobile Swipe Support
    let startX = 0;

    list.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });

    list.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const distance = startX - endX;

        if (distance > 50) {
            // swipe left
            list.scrollBy({
                left: list.offsetWidth / 1.2,
                behavior: 'smooth'
            });
        }

        if (distance < -50) {
            // swipe right
            list.scrollBy({
                left: -list.offsetWidth / 1.2,
                behavior: 'smooth'
            });
        }
    });
});
