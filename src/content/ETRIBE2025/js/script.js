document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelector('.nav-links');
    const header = document.querySelector('header');
  
    // Ensure header scroll animation works
    window.addEventListener("scroll", () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  
    // Mobile toggle (optional, if you add a toggle button)
    const toggleButton = document.querySelector('.toggle-button');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        navLinks.classList.toggle('active');
      });
    }
  });