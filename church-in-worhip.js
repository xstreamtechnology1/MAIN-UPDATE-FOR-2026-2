document.addEventListener("DOMContentLoaded", () => {
    const gallerySection = document.getElementById("worship-gallery");
    const images = gallerySection.querySelectorAll(".expandable");
    const modal = gallerySection.querySelector("#photo-modal");
    const modalImage = gallerySection.querySelector("#modal-image");
    const closeBtn = modal.querySelector(".close-btn");
    const prevBtn = modal.querySelector(".prev-btn");
    const nextBtn = modal.querySelector(".next-btn");
    const zoomInBtn = modal.querySelector("#zoom-in");
    const zoomOutBtn = modal.querySelector("#zoom-out");

    let currentIndex = 0;
    let currentScale = 1;

    function showModal(index) {
        currentIndex = index;
        modal.style.display = "flex";
        modalImage.src = images[currentIndex].src;
        resetZoom();
    }

    function closeModal() {
        modal.style.display = "none";
    }

    function navigate(offset) {
        currentIndex = (currentIndex + offset + images.length) % images.length;
        modalImage.src = images[currentIndex].src;
        resetZoom();
    }

    function resetZoom() {
        currentScale = 1;
        modalImage.style.transform = "scale(1)";
    }

    // Open modal on image click
    images.forEach((img, index) => {
        img.addEventListener("click", () => {
            showModal(index);
        });
    });

    // Close modal on close button click
    closeBtn.addEventListener("click", closeModal);

    // Navigation buttons
    prevBtn.addEventListener("click", () => navigate(-1));
    nextBtn.addEventListener("click", () => navigate(1));

    // Close modal on outside click
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Swipe functionality for mobile
    let startX = 0;
    modal.addEventListener("touchstart", (event) => {
        startX = event.touches[0].clientX;
    });

    modal.addEventListener("touchend", (event) => {
        const endX = event.changedTouches[0].clientX;
        if (endX < startX - 50) navigate(1); // Swipe left
        if (endX > startX + 50) navigate(-1); // Swipe right
    });

    // Zoom functionality
    zoomInBtn.addEventListener("click", () => {
        currentScale += 0.1;
        modalImage.style.transform = `scale(${currentScale})`;
    });

    zoomOutBtn.addEventListener("click", () => {
        if (currentScale > 0.2) {
            currentScale -= 0.1;
            modalImage.style.transform = `scale(${currentScale})`;
        }
    });
});
