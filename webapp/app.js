const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

const state = {
  products: [],
  filtered: [],
  favorites: new Set(JSON.parse(localStorage.getItem('favorites') || '[]')),
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  brandSet: new Set(),
  allSizes: new Set()
};

const els = {
  catalog: document.getElementById('catalog'),

  // Фильтры
  brandFilter: document.getElementById('brandFilter'),
  sizeFilter: document.getElementById('sizeFilter'),
  minPrice: document.getElementById('minPrice'),
  maxPrice: document.getElementById('maxPrice'),

  // Mystery Box
  openMysteryBtn: document.getElementById('openMysteryBtn'),

  // Корзина
  cartBtn: document.getElementById('cartBtn'),
  cartDrawer: document.getElementById('cartDrawer'),
  closeCart: document.getElementById('closeCart'),
  cartList: document.getElementById('cartList'),
  cartTotal: document.getElementById('cartTotal'),
  checkoutBtn: document.getElementById('checkoutBtn'),

  // Модалка товара
  productModal: document.getElementById('productModal'),
  closeProduct: document.getElementById('closeProduct'),
  modalImages: document.getElementById('modalImages'),
  modalTitle: document.getElementById('modalTitle'),
  modalBrandSeason: document.getElementById('modalBrandSeason'),
  modalPrice: document.getElementById('modalPrice'),
  modalDesc: document.getElementById('modalDesc'),
  modalSizes: document.getElementById('modalSizes'),
  modalQty: document.getElementById('modalQty'),
  addToCartBtn: document.getElementById('addToCartBtn'),
  toggleFavBtn: document.getElementById('toggleFavBtn')
};

let currentProduct = null;
let selectedSize = null;

async function init() {
  await loadProducts();
  buildFilters();
  updateCartBadge();
  renderCatalog();
  attachEvents();

  if (tg) {
    tg.expand();
    tg.MainButton.text = 'Оформить заказ';
    tg.MainButton.onClick(checkout);
  }
}

async function loadProducts() {
  let products = [];
  try {
    const res = await fetch('/products.json', { cache: 'no-store' });
    products = await res.json();
  } catch (e) {
    products = [];
  }

  state.products = products;

  // Собираем бренды и размеры
  state.products.forEach(p => {
    state.brandSet.add(p.brand);
    (p.sizes || []).forEach(s => state.allSizes.add(s));
  });

  state.filtered = [...state.products];
}

function buildFilters() {
  // Бренды
  [...state.brandSet].sort().forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    els.brandFilter.appendChild(opt);
  });

  // Размеры
  for (let s = 35; s <= 49; s++) {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = String(s);
    els.sizeFilter.appendChild(opt);
  }
}

function attachEvents() {
  // Фильтры
  els.brandFilter.addEventListener('change', applyFilters);
  els.sizeFilter.addEventListener('change', applyFilters);
  els.minPrice.addEventListener('input', debounce(applyFilters, 300));
  els.maxPrice.addEventListener('input', debounce(applyFilters, 300));

  // Mystery Box
  els.openMysteryBtn.addEventListener('click', openMysteryBox);

  // Корзина
  els.cartBtn.addEventListener('click', openCart);
  els.closeCart.addEventListener('click', closeCart);
  els.checkoutBtn.addEventListener('click', checkout);

  // Модалка товара
  els.closeProduct.addEventListener('click', closeProductModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeProductModal();
    }
  });
}

function openMysteryBox() {
  const arr = state.products;
  if (!arr.length) return;

  const randomIndex = Math.floor(Math.random() * arr.length);
  const p = arr[randomIndex];

  alert(`Сегодняшняя пара: ${p.title} — ${formatPrice(p.price)}`);
}

function applyFilters() {
  const brand = els.brandFilter.value;
  const size = els.sizeFilter.value ? Number(els.sizeFilter.value) : null;
  const minPrice = Number(els.minPrice.value || 0);
  const maxPrice = Number(els.maxPrice.value || Infinity);

  let arr = state.products.filter(p => {
    const byBrand = !brand || p.brand === brand;
    const price = Number(p.price);
    const byPrice = price >= minPrice && price <= maxPrice;
    const bySize = !size || (p.sizes || []).includes(size);
    return byBrand && byPrice && bySize;
  });

  state.filtered = arr;
  renderCatalog();
}

function renderCatalog() {
  els.catalog.innerHTML = '';
  const arr = state.filtered;

  if (!arr.length) {
    const empty = document.createElement('div');
    empty.style.color = '#aeb4c0';
    empty.textContent = 'Ничего не найдено';
    els.catalog.appendChild(empty);
    return;
  }

  arr.forEach(p => els.catalog.appendChild(cardNode(p)));
}

function cardNode(p) {
  const node = document.createElement('div');
  node.className = 'card';
  node.dataset.id = p.id;

  const cover = (p.images && p.images[0]) || '';
  const price = formatPrice(p.price);
  const fav = state.favorites.has(p.id);

  node.innerHTML = `
    <div class="fav-btn">
      <svg class="fav-icon ${fav ? 'active' : ''}" viewBox="0 0 24 24">
        <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/>
      </svg>
    </div>

    <img src="${cover}" alt="${p.title}" loading="lazy">

    <div class="info">
      <h3 class="title">${p.title}</h3>
      <div class="price">${price}</div>
    </div>
  `;

  // Клик по карточке — открыть модалку
  node.addEventListener('click', () => openProductModal(p));

  // Клик по избранному — не открывает модалку
  const favIcon = node.querySelector('.fav-icon');
  favIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(p.id);
    favIcon.classList.toggle('active');
  });

  return node;
}

function openProductModal(p) {
  currentProduct = p;
  selectedSize = null;

  els.modalImages.innerHTML = (p.images || []).map(src => `<img src="${src}" alt="">`).join('');
  els.modalTitle.textContent = p.title;
  els.modalBrandSeason.textContent = p.title; // бренд + модель = title
  els.modalPrice.textContent = formatPrice(p.price);
  els.modalDesc.textContent = p.description || '';
  els.modalQty.value = 1;

  els.modalSizes.innerHTML = '';
  (p.sizes || []).forEach(s => {
    const b = document.createElement('button');
    b.className = 'size';
    b.textContent = s;
    b.addEventListener('click', () => {
      selectedSize = s;
      els.modalSizes.querySelectorAll('.size').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
    els.modalSizes.appendChild(b);
  });

  els.productModal.classList.remove('hidden');

  els.addToCartBtn.onclick = () => {
    const qty = Math.max(1, Number(els.modalQty.value || 1));
    if (!selectedSize) selectedSize = pickFirstSize(p);
    addToCart(p, selectedSize, qty);
    closeProductModal();
    openCart();
  };

  els.toggleFavBtn.onclick = () => {
    toggleFavorite(p.id);
  };
}

function closeProductModal() {
  els.productModal.classList.add('hidden');
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }

  localStorage.setItem('favorites', JSON.stringify([...state.favorites]));

  const icon = document.querySelector(`.card[data-id="${id}"] .fav-icon`);
  if (icon) {
    icon.classList.toggle('active');
    icon.classList.add('animate');
    setTimeout(() => icon.classList.remove('animate'), 400);
  }
}

function pickFirstSize(p) {
  return (p.sizes || [])[0] || null;
}

function addToCart(p, size, qty) {
  const key = `${p.id}:${size}`;
  const idx = state.cart.findIndex(x => x.key === key);

  if (idx >= 0) state.cart[idx].qty += qty;
  else state.cart.push({
    key, id: p.id, title: p.title, brand: p.brand,
    price: p.price, size, qty, images: p.images
  });

  persistCart();
  updateCartBadge();
}

function persistCart() {
  localStorage.setItem('cart', JSON.stringify(state.cart));
}

function openCart() {
  renderCart();
  els.cartDrawer.classList.remove('hidden');
}

function closeCart() {
  els.cartDrawer.classList.add('hidden');
}

function renderCart() {
  els.cartList.innerHTML = '';

  if (!state.cart.length) {
    const empty = document.createElement('div');
    empty.style.color = '#aeb4c0';
    empty.textContent = 'Корзина пуста';
    els.cartList.appendChild(empty);
    els.cartTotal.textContent = formatPrice(0);
    return;
  }

  state.cart.forEach(item => {
    const node = document.createElement('div');
    node.className = 'cart-item';
    node.innerHTML = `
      <img src="${(item.images && item.images[0]) || ''}" alt="">
      <div>
        <div><strong>${item.title}</strong></div>
        <div class="meta">Размер ${item.size}</div>

        <div class="qty-row">
          <button class="qty-btn" data-act="minus">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-act="plus">+</button>
          <button class="remove-btn" data-act="remove">Удалить</button>
        </div>
      </div>

      <div class="price">${formatPrice(item.price)}</div>
    `;

    node.querySelector('[data-act="minus"]').addEventListener('click', () => changeQty(item.key, -1));
    node.querySelector('[data-act="plus"]').addEventListener('click', () => changeQty(item.key, +1));
    node.querySelector('[data-act="remove"]').addEventListener('click', () => removeItem(item.key));

    els.cartList.appendChild(node);
  });

  els.cartTotal.textContent = formatPrice(cartTotal());
}

function changeQty(key, delta) {
  const idx = state.cart.findIndex(x => x.key === key);
  if (idx < 0) return;

  state.cart[idx].qty += delta;
  if (state.cart[idx].qty <= 0) state.cart.splice(idx, 1);

  persistCart();
  updateCartBadge();
  renderCart();
}

function removeItem(key) {
  const idx = state.cart.findIndex(x => x.key === key);
  if (idx < 0) return;

  state.cart.splice(idx, 1);
  persistCart();
  updateCartBadge();
  renderCart();
}

function cartTotal() {
  return state.cart.reduce((sum, x) => sum + x.price * x.qty, 0);
}

function formatPrice(v) {
  return `${v} ₽`;
}

function updateCartBadge() {
  const total = cartTotal();
  els.cartBtn.textContent = formatPrice(total);
}

async function checkout() {
  if (!state.cart.length) {
    alert('Корзина пуста');
    return;
  }

  const order = {
    items: state.cart.map(x => ({
      id: x.id,
      title: x.title,
      brand: x.brand,
      size: x.size,
      qty: x.qty,
      price: x.price
    })),
    total: cartTotal(),
    ts: new Date().toISOString()
  };

  try {
    const res = await fetch("/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    if (res.ok) {
      tg && tg.showPopup({
        title: "Заказ",
        message: "✅ Заказ отправлен!",
        buttons: [{ type: "ok" }]
      });

      state.cart = [];
      localStorage.removeItem("cart");
      renderCart();
      updateCartBadge();
    } else {
      throw new Error("Server error");
    }
  } catch (e) {
    tg && tg.showPopup({
      title: "Ошибка",
      message: "Не удалось отправить заказ",
      buttons: [{ type: "ok" }]
    });
  }
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

init();
