Telegram.WebApp.ready();
Telegram.WebApp.expand();

let products = [];
let cart = [];

fetch('/products.json')
  .then(r => r.json())
  .then(data => {
    products = data;
    renderProducts(data);
  });

function renderProducts(items) {
  const c = document.getElementById('products');
  c.innerHTML = '';

  items.forEach(p => {
    const discount = p.old_price
      ? `<div class="badge">-${Math.round(100 - p.price / p.old_price * 100)}%</div>`
      : '';

    c.innerHTML += `
      <div class="product" onclick="openProduct(${p.id})">
        ${discount}
        <img src="${p.image}">
        <h4>${p.title}</h4>
        <div class="price">
          ${p.price} BYN
          ${p.old_price ? `<span class="old">${p.old_price}</span>` : ''}
        </div>
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
    <button class="buy-btn" onclick="addToCart(${p.id})">Добавить в корзину</button>
  `;

  modal.classList.add('show');
}

document.getElementById('modal').onclick = e => {
  if (e.target.id === 'modal') e.target.classList.remove('show');
};

function addToCart(id) {
  cart.push(id);
  Telegram.WebApp.MainButton.setText(`Оплатить (${cart.length})`);
  Telegram.WebApp.MainButton.show();

  Telegram.WebApp.MainButton.onClick(() => {
    Telegram.WebApp.sendData(JSON.stringify(cart));
  });
}
