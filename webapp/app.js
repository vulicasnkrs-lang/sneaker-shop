const tg = Telegram.WebApp;
tg.expand();

let products = [];
let cart = [];

fetch('products.json')
  .then(r => r.json())
  .then(data => {
    products = data;
    render();
  });

function render() {
  const c = document.getElementById('catalog');
  c.innerHTML = '';

  products.forEach(p => {
    c.innerHTML += `
      <div class="card" onclick="add(${p.id})">
        <img src="${p.image}">
        <div>${p.title}</div>
        <div class="price">${p.price} BYN</div>
      </div>
    `;
  });
}

function add(id) {
  cart.push(products.find(p => p.id === id));
  tg.MainButton.setText(`Оформить заказ (${cart.length})`);
  tg.MainButton.show();
}

tg.MainButton.onClick(() => {
  tg.sendData(JSON.stringify({
    user: tg.initDataUnsafe.user,
    items: cart
  }));
});
