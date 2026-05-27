document.addEventListener('DOMContentLoaded', () => {
    // Reveal animation on scroll
    const reveals = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        const triggerBottom = window.innerHeight * 0.85;

        reveals.forEach(reveal => {
            const revealTop = reveal.getBoundingClientRect().top;

            if (revealTop < triggerBottom) {
                reveal.classList.add('active');
            }
        });
    };

    // Initial check
    revealOnScroll();

    // Scroll listener
    window.addEventListener('scroll', revealOnScroll);

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar scroll effect
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(15, 23, 42, 0.95)';
            nav.style.padding = '0.5rem 0';
            nav.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.5)';
        } else {
            nav.style.background = 'rgba(15, 23, 42, 0.8)';
            nav.style.padding = '0';
            nav.style.boxShadow = 'none';
        }
    });
});
