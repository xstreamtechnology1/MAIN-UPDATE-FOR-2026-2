<script>
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.querySelector('.the-belief-container');
        const prevBtn = document.querySelector('.the-belief-prev-btn');
        const nextBtn = document.querySelector('.the-belief-next-btn');

        prevBtn.addEventListener('click', () => {
            container.scrollBy({
                top: -300, // Adjust based on how far you want to scroll
                behavior: 'smooth'
            });
        });

        nextBtn.addEventListener('click', () => {
            container.scrollBy({
                top: 300, // Adjust based on how far you want to scroll
                behavior: 'smooth'
            });
        });
    });
</script>
