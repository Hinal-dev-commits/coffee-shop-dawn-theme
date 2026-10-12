document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.querySelector(".mobile-menu-trigger");
  const closeBtn = document.querySelector(".drawer-close");
  const drawer = document.querySelector(".mobile-drawer");
  const overlay = document.querySelector(".drawer-overlay");

  // Function to open the drawer
  function openDrawer() {
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // Prevents background scrolling
  }

  // Function to close the drawer
  function closeDrawer() {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // Event Listeners
  if (trigger) trigger.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (overlay) overlay.addEventListener("click", closeDrawer); // Close when clicking outside
});
