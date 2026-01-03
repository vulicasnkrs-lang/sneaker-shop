const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- Авторизация ---
const user = tg.initDataUnsafe?.user;
if (user) {
  const profileBlock = document.getElementById("profile");
  profileBlock.className = "profile";
  profileBlock.innerHTML = `
    ${user.photo_url ? `<img src="${user.photo_url}" class="avatar" />` : ""}
    <div>
      <div class="name">${user.first_name} ${user.last_name || ''}</div>
      ${user.username ? `<div class="username">@${user.username}</div>` : ""}
    </div>
  `;
}

// --- Каталог ---
const products = [
  { id:1, name:"Nike Air Max 90", brand:"Nike", season:"Зима", size:"42", price:320, badge:"Хит",
    image:"https://static.nike.com/a/images/t_prod/w_960,c_limit,q_auto/air-max-90.jpg",
    images:["https://static.nike.com/a/images/t_prod/w_960,c_limit,q_auto/air-max-90.jpg"],
    videos:[], sizes:["40","41","42","43"], material:"Кожа + текстиль",
    description:"Классическая модель с амортизацией Air, удобная для зимы.", popularity:10 },
  { id:2, name:"Adidas Samba OG", brand:"Adidas", season:"Лето", size:"41", price:280, badge:"Новинка",
    image:"https://assets.adidas.com/images/w_600,f_auto,q_auto/samba-og.jpg",
    images:["https://assets.adidas.com/images/w_600,f_auto,q_auto/samba-og.jpg"],
    videos:[], sizes:["40","41","42","43"], material:"Кожа",
    description:"Легендарная Samba OG — лёгкая и стильная для лета.", popularity:8 },
  { id:3, name:"New Balance 550", brand:"New Balance", season:"Лето", size:"43", price:340, badge:"",
    image:"https://nb.scene7.com/is/image/NB/550.jpg",
    images:["https://nb.scene7.com/is/image/NB/550.jpg"],
    videos:[], sizes:["41","42","43","44"], material:"Кожа + замша",
    description:"New Balance 550 — ретро‑баскетбольный стиль с комфортом.", popularity:6 },
  { id:4, name:"Jordan 1 Mid", brand:"Jordan", season:"Зима", size:"42", price:390, badge:"Осталось 1 шт",
    image:"https://static.nike.com/a/images/t_prod/jordan-1-mid.jpg",
    images:["https://static.nike.com/a/images/t_prod/jordan-1-mid.jpg"],
    videos:[], sizes:["40","41","42"], material:"Кожа",
    description:"Jordan 1 Mid — культовая модель для зимы.", popularity:12 }
];

// --- Состояние ---
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let sortMode = null;

// --- Корзина ---
function updateCart() {
  document.getElementById("cart-count").textContent = cart.length;
  const sum = cart.reduce((acc, p) => acc + p.price, 0);
  document.getElementById("cart-sum").textContent = sum;
  localStorage.setItem("cart", JSON.stringify(cart));

  const cartItems = document.getElementById("cart-items");
  cartItems.innerHTML = "";
  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `${item.name} ${item.chosenSize ? `(размер ${item.chosenSize})` : ""} — ${item.price} BYN
      <button onclick="removeFromCart(${index})">Удалить</button>`;
    cartItems.appendChild(div);
  });
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  cart.push(product);
  updateCart();
}

function addToCartWithSize(id, size) {
  const product = products.find(p => p.id === id);
  cart.push({ ...product, chosenSize: size });
  updateCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function getCartData() {
  return cart.map(p => ({ name:p.name, price:p.price, brand:p.brand, size:p.chosenSize || p.size }));
}

// --- Избранное ---
function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderCatalog();
}

function isFavorite(id) { return favorites.includes(id); }

// --- Сортировка ---
function sortCatalog(mode) { sortMode = mode; renderCatalog(); }

// --- Каталог ---
function renderCatalog() {
  const catalog = document.getElementById("catalog");
  catalog.innerHTML = "";

  const brand = document.getElementById("brandFilter").value;
  const season = document.getElementById("seasonFilter").value;
  const size = document.getElementById("sizeFilter").value;
  const query = document.getElementById("searchInput")?.value.toLowerCase() || "";

  let filtered = products.filter(p =>
    (!brand || p.brand === brand) &&
    (!season || p.season === season) &&
    (!size || p.size === size) &&
    (!query || p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query))
  );

  if (sortMode === "price") filtered.sort((a,b)=>a.price-b.price);
  else if (sortMode === "new") filtered.sort((a,b)=>b.id-a.id);
  else if (sortMode === "popular") filtered.sort((a,b)=>(b.popularity||0)-(a.popularity||0));

  if (filtered.length===0) {
    catalog.innerHTML="<p style='text-align:center;color:#777;'>Нет товаров по выбранным параметрам</p>";
    return;
  }

  filtered.forEach(product=>{
    const card=document.createElement("div");
    card.className="product-card";
    card.innerHTML=`
      <img src
