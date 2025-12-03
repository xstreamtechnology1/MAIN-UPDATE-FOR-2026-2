
    // Show or hide the "Back to Top" button based on scroll position
    window.addEventListener('scroll', function () {
        const backToTop = document.getElementById('back-to-top');
        if (window.scrollY > 200) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });

    // Smooth scroll to top when the button is clicked
    document.getElementById('back-to-top').addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

