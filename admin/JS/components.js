const body = document.body;
const menuToggle = document.querySelector(".menu-toggle");
const navItems = document.querySelectorAll(".side-nav a");

if (window.lucide) {
  window.lucide.createIcons();
}

menuToggle?.addEventListener("click", () => {
  body.classList.toggle("nav-open");
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((navItem) => navItem.classList.remove("active"));
    item.classList.add("active");

    if (window.matchMedia("(max-width: 980px)").matches) {
      body.classList.remove("nav-open");
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    body.classList.remove("nav-open");
  }
});
