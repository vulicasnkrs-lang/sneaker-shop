const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

alert("JS работает!");

// Встроенные товары
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

// Вставляем карточки прямо в body
products.forEach(p => {
  const card = document.createElement("div");
  card.style.padding = "20px";
  card.style.margin = "10px";
  card.style.background = "#fff";
  card.style.borderRadius = "12px";
  card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
  card.innerHTML = `
    <img src="${p.image}" alt="${p.name}" style="width:100%; border-radius:10px;" />
    <h2 style="font-size:16px;">${p.name}</h2>
    <p style="font-weight:bold;">${p.price} BYN</p>
    <small>Размеры: ${p.sizes.join(", ")}</small>
  `;
  document.body.appendChild(card);
});
