Telegram.WebApp.ready();
Telegram.WebApp.expand();

const tg = Telegram.WebApp;
const user = tg.initDataUnsafe.user;

let products = [];
let cart = [];

fetch('/products.json')
  .then(r => r.json())
  .then(data => {
    products = data;
    renderProducts(products);
  });

function renderProducts(items) {
  const c = document.getElementById('products');
  c.innerHTML = '';

  items.forEach(p => {
    c.innerHTML += `
      <div class="product" onclick="openProduct(${p.id})">
        <img src="${p.image}">
        <h4>${p.title}</h4>
        <div class="price">${p.price} BYN</div>
      </div>
    `;
  });
}

function openProduct(id) {
  const p = products.find(x => x.id === id);
  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');

  content.innerHTML = `
    <img src="${p.image}" style="width:100%;height:180px;object-fit:contain">
    <h2>${p.title}</h2>
    <p><b>${p.price} BYN</b></p>

    <div class="sizes">
      ${p.sizes.map(s => `<button class="size">${s}</button>`).join('')}
    </div>

    <button class="buy-btn" onclick="addToCart(${p.id})">
      Добавить в корзину
    </button>
  `;

  modal.classList.add('show');
}

document.getElementById('modal').onclick = e => {
  if (e.target.id === 'modal') e.target.classList.remove('show');
};

function addToCart(id) {
  cart.push(id);

  tg.MainButton.setText(`Оформить заказ (${cart.length})`);
  tg.MainButton.show();

  tg.MainButton.onClick(sendOrder);
}

function sendOrder() {
  const order = {
    user: {
      id: user.id,
      username: user.username,
      first_name: user.first_name
    },
    items: cart.map(id => products.find(p => p.id === id)),
    date: new Date().toISOString()
  };

  tg.sendData(JSON.stringify(order));
}
