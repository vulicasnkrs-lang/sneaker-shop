const products = [
  {
    id: 'AF1-GTX-MED-OLIVE',
    title: "Nike Air Force 1 High Gore-Tex Boot 'Medium Olive'",
    brand: 'NIKE',
    madeIn: 'Вьетнам',
    comfort: 'до -18°',
    deliveryDays: '1–3',
    priceBYN: 195,
    priceRUB: 5690,
    stock: { 41: 1, 42: 1, 43: 1 },
    image: 'https://via.placeholder.com/400x300?text=Nike+AF1+Gore-Tex'
  }
];

const state = { cart: [] };

function renderCatalog() {
  const root = document.getElementById('catalog');
  root.innerHTML = '';

  products.forEach(p => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <img src="${p.image}" alt="${p.title}" />
      <div class="row">
        <div>
          <div>${p.brand} • Производитель: ${p.madeIn}</div>
          <div>Комфорт: ${p.comfort} • Доставка: ${p.deliveryDays} дня</div>
        </div>
        <div class="price">${p.priceBYN} BYN</div>
      </div>
      <div class="sizes" id="sizes-${p.id}"></div>
      <div class="actions">
        <button class="btn primary" data-add="${p.id}">Добавить</button>
      </div>
    `;
    root.appendChild(el);

    const sizesEl = el.querySelector(`#sizes-${p.id}`);
    [41, 42, 43].forEach(s => {
      const available = (p.stock[s] ?? 0) > 0;
      const b = document.createElement('button');
      b.className = `size ${available ? '' : 'disabled'}`;
      b.textContent = `${s}`;
      b.disabled = !available;
      b.addEventListener('click', () => el.dataset.selectedSize = s);
      sizesEl.appendChild(b);
    });

    el.querySelector(`[data-add="${p.id}"]`).addEventListener('click', () => addToCart(p.id, el));
  });

  updateCartPreview();
}

function addToCart(productId, cardEl) {
  const product = products.find(p => p.id === productId);
  const size = cardEl.dataset.selectedSize;
  if (!size) {
    alert('Выберите размер');
    return;
  }
  state.cart.push({ id: product.id, title: product.title, priceBYN: product.priceBYN, size });
  updateCartPreview();
}

function updateCartPreview() {
  const count = state.cart.length;
  const sum = state.cart.reduce((acc, i) => acc + i.priceBYN, 0);
  document.getElementById('cart-count').textContent = count;
  document.getElementById('cart-sum').textContent = sum;
}

document.addEventListener('DOMContentLoaded', renderCatalog);
