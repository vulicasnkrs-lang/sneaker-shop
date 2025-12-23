if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  tg.ready();

  const user = tg.initDataUnsafe.user;
  if (user) {
    const profileDiv = document.createElement("div");
    profileDiv.className = "profile";
    profileDiv.innerHTML = `
      <img src="${user.photo_url || ''}" alt="avatar" />
      <div>
        <strong>${user.first_name} ${user.last_name || ''}</strong><br/>
        <span>@${user.username || ''}</span>
      </div>
    `;
    document.body.prepend(profileDiv);
  }
}

const products = [
  {
    id: 1,
    name: "Nike Air Max 90",
    brand: "Nike",
    season: "Зима",
    size: "42",
    price: 320,
    image: "https://static.nike.com/a/images/t_prod/w_960,c_limit,q_auto/air-max-90.jpg"
  },
  {
    id: 2,
    name: "Adidas Samba OG",
    brand: "Adidas",
    season: "Лето",
    size: "41",
    price: 280,
    image: "https://assets.adidas.com/images/w_600,f_auto,q_auto/samba-og.jpg"
  },
  {
    id: 3,
    name: "New Balance 550",
    brand: "New Balance",
    season: "Лето",
    size: "43",
    price: 340,
    image: "https://nb.scene7.com/is/image/NB/550.jpg"
  },
  {
    id: 4,
    name: "Jordan 1 Mid",
    brand: "Jordan",
    season: "Зима",
    size: "42",
    price: 390,
    image: "https://static.nike.com/a/images/t_prod/jordan-1-mid.jpg"
  },
  {
    id: 5,
    name: "Yeezy Boost 350",
    brand: "Adidas",
    season: "Лето",
    size: "41",
    price: 450,
    image: "https://assets.adidas.com/images/w_600,f_auto,q_auto/yeezy-350.jpg"
  }
];

let cart = [];

function renderCatalog() {
  const catalog = document.getElementById("catalog");
  catalog.innerHTML = "";

  const brand = document.getElementById("brandFilter").value;
  const season = document.getElementById("seasonFilter").value;
  const size = document.getElementById("sizeFilter").value;

  const filtered = products.filter(p =>
    (!brand || p.brand === brand) &&
    (!season || p.season === season) &&
    (!size || p.size === size)
  );

  filtered.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <h2>${product.name}</h2>
      <p>${product.price} BYN</p>
      <button onclick="addToCart(${product.id})">Добавить</button>
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
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    const summary = cart.map(p => `${p.name} — ${p.price} BYN`).join('\n');
    const total = cart.reduce((acc, p) => acc + p.price, 0);
    const message = `🛒 Заказ:\n${summary}\n\nИтого: ${total} BYN`;

    tg.sendData(message);
    tg.close();
  }
}

document.getElementById("brandFilter").addEventListener("change", renderCatalog);
document.getElementById("seasonFilter").addEventListener("change", renderCatalog);
document.getElementById("sizeFilter").addEventListener("change", renderCatalog);

renderCatalog();
