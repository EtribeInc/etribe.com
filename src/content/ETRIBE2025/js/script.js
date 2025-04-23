document.addEventListener("DOMContentLoaded", () => {
  // IntersectionObserver for fade-slide animation
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target); // animate only once
      }
    });
  }, {
    threshold: 0.1
  });

  const animatedElements = document.querySelectorAll('.fade-slide');
  animatedElements.forEach(el => observer.observe(el));

  // Hamburger menu toggle
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".site-nav ul");

  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });

    // Close nav when a link is clicked (mobile)
    const navItems = document.querySelectorAll(".site-nav ul a");
    navItems.forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
      });
    });
  }

  const form = document.querySelector("form[name='contact']");
  const responseMsg = document.getElementById("form-response");

  if (form && responseMsg) {
    form.addEventListener("submit", (e) => {
      e.preventDefault(); // prevent page refresh
      responseMsg.style.display = "block"; // show confirmation
      form.submit(); // continue submitting to Netlify
    });
  }
});