document.addEventListener('DOMContentLoaded', () => {
  // Automatically add reveal class to important elements if not present
  const autoRevealTargets = document.querySelectorAll(`
    main .shopify-section,
    .product-card,
    .collection-card,
    .banner__content
  `);
  
  autoRevealTargets.forEach(el => {
    if (!el.classList.contains('reveal-on-scroll')) {
      el.classList.add('reveal-on-scroll');
    }
  });

  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  
  const revealOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.05
  };
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);
  
  revealElements.forEach(el => revealObserver.observe(el));
});
