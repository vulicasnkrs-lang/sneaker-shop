const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let cart = [];
let products = [];

// Загружаем список товаров
fetch("static/products.json")
  .then(res => res.json())
  .then(data => {
    console.log("Загруженные товары:", data);
    products = data;
    renderCatalog();
  })
  .catch(err => {
    console.error("Ошибка загрузки products.json:", err);
  });

// Рендер каталога
function renderCatalog() {
  const catalog = document.getElementById("catalog");
  if (!catalog) {
    console.error("Элемент #catalog не найден");
    return;
  }

  const query = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const brand = document.getElementById("brandFilter")?.value || "";
  const season = document.getElementById("seasonFilter")?.value || "";
  const size = document.getElementById("sizeFilter")?.value || "";

  const filtered = products.filter(p =>
    (!query || p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query)) &&
    (!brand || p.brand === brand) &&
    (!season || p.season === season) &&
    (!size || p.sizes.includes(size))
  );

  console.log("Отфильтрованные товары:", filtered);

  catalog.innerHTML = "";
  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <h2>${p.name}</h2>
      <p>${p.price} BYN</p>
      <small>Размеры: ${p.sizes.join(", ")}</small>
      <button onclick="addToCart(${p.id})">Добавить</button>
    `;
    catalog.appendChild(card);
  });
}

// Добавление в корзину
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (product) {
    cart.push(product);
    updateCart();
  }
}

// Обновление корзины
function updateCart() {
  document.getElementById("cart-count").textContent = cart.length;
  const sum = cart.reduce((acc, p) => acc + p.price, 0);
  document.getElementById("cart-sum").textContent = sum;
}

// Отправка заказа
function sendOrder() {
  if (cart.length === 0) {
    alert("Корзина пуста");
    return;
  }

  const payload = {
    user: tg.initDataUnsafe?.user || {},
    items: cart.map(p => ({
      title: p.name,
      price: p.price
    })),
    total: cart.reduce((acc, p) => acc + p.price, 0)
  };

  tg.sendData(JSON.stringify(payload));
  document.getElementById("cart-preview").innerHTML = "✅ Заказ отправлен!";
  cart = [];
  updateCart();
}

// Привязка фильтров
document.getElementById("searchInput")?.addEventListener("input", renderCatalog);
document.getElementById("brandFilter")?.addEventListener("change", renderCatalog);
document.getElementById("seasonFilter")?.addEventListener("change", renderCatalog);
document.getElementById("sizeFilter")?.addEventListener("change", renderCatalog);
