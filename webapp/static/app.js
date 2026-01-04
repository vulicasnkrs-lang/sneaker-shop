const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let cart = [];

// ===============================
// 1. ВСТРОЕННЫЕ ТОВАРЫ (БЕЗ FETCH)
// ===============================
let products = [
  {
    id: 1,
    name: "Asics GEL-PICKAX 'Smoke Grey'",
    brand: "Asics",
    season: "Зима",
    price: 189,
    image: "https://i.imgur.com/8g7Yt8K.jpeg",
    sizes: ["40", "41", "42", "43"]
  },
  {
    id: 2,
    name: "Timberland 6 Inch Premium 'Black'",
    brand: "Timberland",
    season: "Зима",
    price: 259,
    image: "https://i.imgur.com/8g7Yt8K.jpeg",
    sizes: ["41", "42", "43", "44"]
  },
  {
    id: 3,
    name: "Nike Air Max 90",
    brand: "Nike",
    season: "Лето",
    price: 320,
    image: "https://i.imgur.com/8g7Yt8K.jpeg",
    sizes: ["40", "41", "42", "43"]
  },
  {
    id: 4,
    name: "Adidas Samba OG",
    brand: "Adidas",
    season: "Лето",
    price: 280,
    image: "https://i.imgur.com/8g7Yt8K.jpeg",
    sizes: ["40", "41", "42", "43"]
  }
];

// ===============================
// 2. РЕНДЕР КАТАЛОГА
// ===============================
function renderCatalog() {
  const catalog = document.getElementById("catalog");
  if (!catalog) return;

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

renderCatalog();

// ===============================
// 3. КОРЗИНА
// ===============================
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  cart.push(product);
  updateCart();
  showToast(`➕ ${product.name} добавлен`);
}

function updateCart() {
  document.getElementById("cart-count").textContent = cart.length;
  const sum = cart.reduce((acc, p) => acc + p.price, 0);
  document.getElementById("cart-sum").textContent = sum;
}

// ===============================
// 4. ОТПРАВКА ЗАКАЗА
// ===============================
function sendOrder() {
  if (cart.length === 0) {
    alert("Корзина пуста");
    return;
  }

  const payload = {
    user: tg.initDataUnsafe?.user || {},
    items: cart.map(p => ({ title: p.name, price: p.price })),
    total: cart.reduce((acc, p) => acc + p.price, 0)
  };

  tg.sendData(JSON.stringify(payload));

  cart = [];
  updateCart();
  showToast("📤 Заказ отправлен!");
}

// ===============================
// 5. ТОСТ-УВЕДОМЛЕНИЯ
// ===============================
function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#222";
  toast.style.color = "#fff";
  toast.style.padding = "10px 20px";
  toast.style.borderRadius = "8px";
  toast.style.zIndex = "9999";
  toast.style.opacity = "0.9";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ===============================
// 6. ФИЛЬТРЫ
// ===============================
document.getElementById("searchInput")?.addEventListener("input", renderCatalog);
document.getElementById("brandFilter")?.addEventListener("change", renderCatalog);
document.getElementById("seasonFilter")?.addEventListener("change", renderCatalog);
document.getElementById("sizeFilter")?.addEventListener("change", renderCatalog);
