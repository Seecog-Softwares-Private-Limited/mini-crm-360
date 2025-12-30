// Menu toggle functionality - Make it globally available
window.toggleMenu = function(menuId) {
  const submenu = document.getElementById(menuId);
  if (!submenu) {
    console.warn('Submenu not found:', menuId);
    return;
  }
  
  const toggle = document.querySelector(`[onclick="toggleMenu('${menuId}')"]`);
  
  if (submenu.classList.contains('show')) {
    submenu.classList.remove('show');
    if (toggle) toggle.classList.add('collapsed');
  } else {
    submenu.classList.add('show');
    if (toggle) toggle.classList.remove('collapsed');
  }
};

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

async function logout() {
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {
    console.error('Logout failed:', e);
  } finally {
    // optional cleanup
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    window.location.replace('/login');
  }
}
