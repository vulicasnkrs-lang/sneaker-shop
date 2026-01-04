const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let cart = [];
let products = [];

fetch("static/products.json")
  .then(res => res.json())
  .then(data => {
    products = data;
    renderCatalog();
  });

function renderCatalog() {
  const catalog = document.getElementById("catalog");
  const query = document.getElementById("searchInput").value.toLowerCase();
  const brand = document.getElementById("brandFilter").value;
  const season = document.getElementById("seasonFilter").value;
  const size = document.getElementById("sizeFilter").value;

  const filtered = products.filter(p =>
    (!query || p.name.toLowerCase().includes(query)) &&
    (!brand || p.brand === brand) &&
    (!season || p.season === season) &&
    (!size || p.sizes.includes(size))
  );

  catalog.innerHTML = "";
  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <h2>${p.name}</h2>
      <p>${p.price} BYN</p>
      <button onclick="addToCart(${p.id})">Добавить</button>
    `;
    catalog.appendChild(card);
  });
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  cart.push(product);
  updateCart();
}

function updateCart() {
  document.getElementById("cart-count").textContent = cart.length;
  const sum = cart.reduce((acc, p) => acc + p.price, 0);
  document.getElementById("cart-sum").textContent = sum;
}

function sendOrder() {
  if (cart.length === 0) {
    alert("Корзина пуста");
    return;
  }

  const payload = {
    action: "order",
    cart: cart.map(p => ({ name: p.name, price: p.price })),
    total: cart.reduce((acc, p) => acc + p.price, 0)
  };

  tg.sendData(JSON.stringify(payload));
  alert("Заказ отправлен!");
}

document.getElementById("searchInput").addEventListener("input", renderCatalog);
document.getElementById("brandFilter").addEventListener("change", renderCatalog);
document.getElementById("seasonFilter").addEventListener("change", renderCatalog);
document.getElementById("sizeFilter").addEventListener("change", renderCatalog);
