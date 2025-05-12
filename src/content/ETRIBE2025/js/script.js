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
  threshold: 0.05,
  rootMargin: "0px 0px 0px 0px"
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
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const data = new FormData(form);
      data.append("form-name", "contact");

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString()
      })
      .then(() => {
        form.style.display = "none";
        responseMsg.style.display = "block";
      })
      .catch((error) => {
        console.error("Form submission error:", error);
        alert("Something went wrong. Please try again.");
      });
    });
  }

  // Reusable lightbox for image enlargement
  const lightboxImages = document.querySelectorAll(".lightbox-image");

  lightboxImages.forEach(img => {
    img.addEventListener("click", () => {
      const fullSrc = img.dataset.full || img.src;
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: zoom-out;
      `;

      const fullImg = document.createElement("img");
      fullImg.src = fullSrc;
      fullImg.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      `;

      overlay.appendChild(fullImg);
      document.body.appendChild(overlay);

      overlay.addEventListener("click", () => {
        document.body.removeChild(overlay);
      });
    });
  });
});