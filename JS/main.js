const header = document.querySelector("#siteHeader");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector("#navMenu");
const revealEls = document.querySelectorAll(".reveal");
const particleWrap = document.querySelector(".particles");

if (window.lucide) {
  window.lucide.createIcons();
}

const setHeaderState = () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

navToggle?.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealEls.forEach((el, index) => {
  el.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
  revealObserver.observe(el);
});

document.querySelectorAll(".faq-item").forEach((button) => {
  button.addEventListener("click", () => {
    const answer = button.nextElementSibling;
    const isOpen = button.classList.contains("active");

    document.querySelectorAll(".faq-item.active").forEach((openButton) => {
      openButton.classList.remove("active");
      openButton.nextElementSibling.style.maxHeight = null;
    });

    if (!isOpen) {
      button.classList.add("active");
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    }
  });
});

if (particleWrap) {
  Array.from({ length: 28 }).forEach((_, index) => {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = `${8 + Math.random() * 84}%`;
    particle.style.top = `${18 + Math.random() * 70}%`;
    particle.style.animationDelay = `${index * 0.34}s`;
    particle.style.animationDuration = `${8 + Math.random() * 7}s`;
    particleWrap.appendChild(particle);
  });
}

document.querySelector("form")?.addEventListener("submit", (event) => {
  event.preventDefault();
});
