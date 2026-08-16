window.toggleMenu = function toggleMenu() {
  document.querySelector('.hamburger').classList.toggle('active');
  document.getElementById('mobileMenu').classList.toggle('active');
};

window.closeMenu = function closeMenu() {
  document.querySelector('.hamburger').classList.remove('active');
  document.getElementById('mobileMenu').classList.remove('active');
};
