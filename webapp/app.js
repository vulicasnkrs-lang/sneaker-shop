const tg = window.Telegram.WebApp;
tg.expand();

let cart = [];

fetch("products.json")
  .then(r => r.json())
  .then(products => {
    const root = document.getElementById("products");
    products.forEach(p => {
      const div = document.createElement("div");
      div.className = "product";
      div.innerHTML = `
        <h3>${p.title}</h3>
        <p>${p.price} BYN</p>
        <button>В корзину</button>
      `;
      div.querySelector("button").onclick = () => cart.push(p);
      root.appendChild(div);
    });
  });

document.getElementById("checkout").onclick = () => {
  fetch("/api/order", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      user: tg.initDataUnsafe.user,
      items: cart
    })
  }).then(() => {
    tg.showAlert("Заказ отправлен!");
    cart = [];
  });
};
