const products = [
  {
    id: 1,
    name: "Nike Air Max 90",
    brand: "Nike",
    season: "Зима",
    size: "42",
    price: 320,
    image: "https://example.com/nike90.jpg"
  },
  {
    id: 2,
    name: "Adidas Samba OG",
    brand: "Adidas",
    season: "Лето",
    size: "41",
    price: 280,
    image: "https://example.com/samba.jpg"
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

document.getElementById("brandFilter").addEventListener("change", renderCatalog);
document.getElementById("seasonFilter").addEventListener("change", renderCatalog);
document.getElementById("sizeFilter").addEventListener("change", renderCatalog);

renderCatalog();
