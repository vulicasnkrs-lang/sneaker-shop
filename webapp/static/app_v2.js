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

  if (!catalog) {
    // если контейнер не найден — выводим красный блок
    document.body.innerHTML += "<div style='padding:20px; background:red; color:white;'>❌ catalog не найден</div>";
    return;
  }

  // тестовый блок, чтобы убедиться, что контейнер найден
  catalog.innerHTML = "<div style='padding:20px; background:lime;'>✅ catalog найден</div>";

  // рендерим товары
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
