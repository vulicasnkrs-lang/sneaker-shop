const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

alert("JS работает!");

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
  }
];

function renderCatalog() {
  const catalog = document.querySelector(".catalog");
  console.log("🧪 catalog:", catalog);
  if (!catalog) return;

  catalog.innerHTML = "";
  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <h2>${p.name}</h2>
      <p>${p.price} BYN</p>
      <small>Размеры: ${p.sizes.join(", ")}</small>
    `;
    catalog.appendChild(card);
  });
}

renderCatalog();
