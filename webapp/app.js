const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

const state = {
  products: [],
  filtered: [],
  favorites: new Set(JSON.parse(localStorage.getItem('favorites') || '[]')),
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  promoCode: null,
  promoDiscountPct: 0,
  brandSet: new Set(),
  allSizes: new Set()
};

const els = {
  catalog: document.getElementById('catalog'),
  brandFilter: document.getElementById('brandFilter'),
  seasonFilter: document.getElementById('seasonFilter'),
  discountFilter: document.getElementById('discountFilter'),
  sizeFilter: document.getElementById('sizeFilter'),
  sortSelect: document.getElementById('sortSelect'),
  searchInput: document.getElementById('searchInput'),
  minPrice: document.getElementById('minPrice'),
  maxPrice: document.getElementById('maxPrice'),
  promoInput: document.getElementById('promoInput'),
  applyFilters: document.getElementById('applyFilters'),
  clearFilters: document.getElementById('clearFilters'),
  favoritesBtn: document.getElementById('favoritesBtn'),
  cartBtn: document.getElementById('cartBtn'),
  cartDrawer: document.getElementById('cartDrawer'),
  closeCart: document.getElementById('closeCart'),
  cartList: document.getElementById('cartList'),
  cartTotal: document.getElementById('cartTotal'),
  checkoutBtn: document.getElementById('checkoutBtn'),
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
    const res = await fetch('products.json', { cache: 'no-store' });
    products = await res.json();
  } catch (e) {
    products = [];
  }
  state.products = products;
  state.products.forEach(p => {
    state.brandSet.add(p.brand);
    (p.sizes || []).forEach(s => state.allSizes.add(s));
  });
  state.filtered = [...state.products];
}

function buildFilters() {
  [...state.brandSet].sort().forEach(b => {
    const opt = document.createElement('option');
    opt.value = b; opt.textContent = b;
    els.brandFilter.appendChild(opt);
  });
  for (let s = 35; s <= 49; s++) {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = String(s);
    els.sizeFilter.appendChild(opt);
  }
}

function attachEvents() {
  els.applyFilters.addEventListener('click', applyFilters);
  els.clearFilters.addEventListener('click', clearFilters);
  els.searchInput.addEventListener('input', debounce(applyFilters, 300));
  [els.brandFilter, els.seasonFilter, els.discountFilter, els.sizeFilter, els.sortSelect].forEach(el =>
    el.addEventListener('change', applyFilters)
  );
  els.minPrice.addEventListener('input', debounce(applyFilters, 300));
  els.maxPrice.addEventListener('input', debounce(applyFilters, 300));
  els.promoInput.addEventListener('change', applyPromo);

  els.favoritesBtn.addEventListener('click', () => {
    const favIds = state.favorites;
    state.filtered = state.products.filter(p => favIds.has(p.id));
    renderCatalog(true);
  });

  els.cartBtn.addEventListener('click', openCart);
  els.closeCart.addEventListener('click', closeCart);
  els.checkoutBtn.addEventListener('click', checkout);
  els.closeProduct.addEventListener('click', closeProductModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeProductModal();
    }
  });
}

function applyFilters() {
  const q = els.searchInput.value.trim().toLowerCase();
  const brand = els.brandFilter.value;
  const season = els.seasonFilter.value;
  const discountFilter = els.discountFilter.value;
  const size = els.sizeFilter.value ? Number(els.sizeFilter.value) : null;
  const minPrice = Number(els.minPrice.value || 0);
  const maxPrice = Number(els.maxPrice.value || Infinity);

  let arr = state.products.filter(p => {
    const title = (p.title || '').toLowerCase();
    const byTitle = !q || title.includes(q);
    const byBrand = !brand || p.brand === brand;
    const bySeason = !season || p.season === season;
    const price = Number(p.price);
    const byPrice = price >= minPrice && price <= maxPrice;
    const hasDiscount = Number(p.discount || 0) > 0;
    const byDiscount = discountFilter === '' || (discountFilter === 'has' && hasDiscount) || (discountFilter === 'no' && !hasDiscount);
    const bySize = !size || (p.sizes || []).includes(size);
    return byTitle && byBrand && bySeason && byPrice && byDiscount && bySize;
  });

  const sortKey = els.sortSelect.value;
  arr.sort((a, b) => {
    if (sortKey === 'price_asc') return a.price - b.price;
    if (sortKey === 'price_desc') return b.price - a.price;
    if (sortKey === 'newest') return new Date(b.addedAt) - new Date(a.addedAt);
    if (sortKey === 'discount') return (b.discount || 0) - (a.discount || 0);
    return (b.popularity || 0) - (a.popularity || 0);
  });

  state.filtered = arr;
  renderCatalog();
}

function clearFilters() {
  els.searchInput.value = '';
  els.brandFilter.value = '';
  els.seasonFilter.value = '';
  els.discountFilter.value = '';
  els.sizeFilter.value = '';
  els.sortSelect.value = 'popular';
  els.minPrice.value = '';
  els.maxPrice.value = '';
  els.promoInput.value = '';
  state.promoCode = null;
  state.promoDiscountPct = 0;
  state.filtered = [...state.products];
  renderCatalog();
}

function applyPromo() {
  const code = els.promoInput.value.trim();
  state.promoCode = code || null;
  const known = { NANOGI10: 10, VULICA5: 5 }; // демо-значения, можно валидировать на сервере
  state.promoDiscountPct = known[code] || 0;
  updateCartBadge();
  renderCart();
}

function renderCatalog(onlyFavorites = false) {
  const arr = onlyFavorites ? state.products.filter(p => state.favorites.has(p.id)) : state.filtered;
  els.catalog.innerHTML = '';
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
  const cover = (p.images && p.images[0]) || '';
  const price = formatPrice(finalPrice(p.price, p.discount));
  const meta = `${p.brand} • ${seasonLabel(p.season)}${p.discount ? ` • -${p.discount}%` : ''}`;
  const fav = state.favorites.has(p.id);

  node.innerHTML = `
    <img src="${cover}" alt="${p.title}" loading="lazy">
    <div class="info">
      <div class="row">
        <h3 class="title">${p.title}</h3>
        <button class="ghost" data-fav="${fav ? '1' : '0'}">★</button>
      </div>
      <div class="meta">${meta}</div>
      <div class="row">
        <div class="price">${price}</div>
        <div class="btns">
          <button class="secondary" data-action="details">Подробнее</button>
          <button class="primary" data-action="quick">В корзину</button>
        </div>
      </div>
    </div>
  `;

  node.querySelector('[data-action="details"]').addEventListener('click', () => openProductModal(p));
  node.querySelector('[data-action="quick"]').addEventListener('click', () => {
    selectedSize = pickFirstSize(p);
    addToCart(p, selectedSize, 1);
  });
  node.querySelector('[data-fav]').addEventListener('click', () => toggleFavorite(p.id));

  return node;
}

function openProductModal(p) {
  currentProduct = p;
  selectedSize = null;
  els.modalImages.innerHTML = (p.images || []).map(src => `<img src="${src}" alt="">`).join('');
  els.modalTitle.textContent = p.title;
  els.modalBrandSeason.textContent = `${p.brand} • ${seasonLabel(p.season)}`;
  const priceWithDiscount = finalPrice(p.price, p.discount);
  els.modalPrice.textContent = `${formatPrice(priceWithDiscount)}${p.discount ? `  (−${p.discount}%)` : ''}`;
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
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  localStorage.setItem('favorites', JSON.stringify([...state.favorites]));
  renderCatalog();
}

function pickFirstSize(p) {
  return (p.sizes || [])[0] || null;
}

function addToCart(p, size, qty) {
  const key = `${p.id}:${size}`;
  const idx = state.cart.findIndex(x => x.key === key);
  if (idx >= 0) state.cart[idx].qty += qty;
  else state.cart.push({
    key, id: p.id, title: p.title, brand: p.brand, season: p.season,
    price: p.price, discount: p.discount || 0, size, qty, images: p.images
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
        <div class="meta">${item.brand} • ${seasonLabel(item.season)} • Размер ${item.size}</div>
        <div class="qty-row">
          <button class="qty-btn" data-act="minus">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-act="plus">+</button>
          <button class="remove-btn" data-act="remove">Удалить</button>
        </div>
      </div>
      <div class="price">${formatPrice(finalPrice(item.price, item.discount))}</div>
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
  const subtotal = state.cart.reduce((sum, x) => sum + finalPrice(x.price, x.discount) * x.qty, 0);
  const promo = Math.round(subtotal * (state.promoDiscountPct / 100));
  return Math.max(0, subtotal - promo);
}

function finalPrice(price, discountPct) {
  const d = Number(discountPct || 0);
  const base = Number(price || 0);
  return Math.round(base * (100 - d) / 100);
}

function formatPrice(v) {
  return `${v} ₽`;
}

function seasonLabel(s) {
  return s === 'summer' ? 'Лето' : s === 'winter' ? 'Зима' : 'Круглый год';
}

function updateCartBadge() {
  const total = cartTotal();
  els.cartBtn.textContent = formatPrice(total);
}

function checkout() {
  if (!state.cart.length) {
    alert('Корзина пуста');
    return;
  }
  const order = {
    items: state.cart.map(x => ({
      id: x.id,
      title: x.title,
      brand: x.brand,
      season: x.season,
      size: x.size,
      qty: x.qty,
      price: finalPrice(x.price, x.discount)
    })),
    promoCode: state.promoCode,
    promoDiscountPct: state.promoDiscountPct,
    total: cartTotal(),
    ts: new Date().toISOString()
  };

  if (tg) {
    tg.sendData(JSON.stringify(order));
    alert("✅ Заказ отправлен в бота!"); // временное подтверждение
    // tg.close(); // пока закомментируй, чтобы видеть результат
  } else {
    alert('Заказ:\n' + JSON.stringify(order, null, 2));
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
