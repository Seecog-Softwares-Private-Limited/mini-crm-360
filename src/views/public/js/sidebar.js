function toggleMenu(id) {
  const target = document.getElementById(id);
  if (!target) return;

  // Close all other submenus
  document.querySelectorAll(".submenu").forEach((sm) => {
    if (sm.id !== id) sm.classList.remove("show");
  });

  // Toggle clicked submenu
  target.classList.toggle("show");
}

// On page load: open only submenu that contains active link
document.addEventListener("DOMContentLoaded", () => {
  const activeLink = document.querySelector(".submenu .nav-link.active");
  if (!activeLink) return;

  const activeSubmenu = activeLink.closest(".submenu");
  if (!activeSubmenu) return;

  document.querySelectorAll(".submenu").forEach((sm) => {
    sm.classList.toggle("show", sm === activeSubmenu);
  });
});

function logout() {
  localStorage.removeItem("accessToken");
  window.location.href = "/login";
}
