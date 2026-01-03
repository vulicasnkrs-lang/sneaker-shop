Telegram.WebApp.ready();
Telegram.WebApp.expand();

// active toggle
document.querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.querySelectorAll('.size').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
