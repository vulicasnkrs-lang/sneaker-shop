/* ———— Telegram ———— */
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

/* ———— State ———— */
const state = {
  products: [],
  filtered: [],
  favorites: new Set(JSON.parse(localStorage.getItem('favorites') || '[]')),
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  brandSet: new Set(),
  allSizes: new Set()
};

/* ———— Elements ———— */
const els = {
  catalog: document.getElementById('catalog'),

  brandFilter: document.getElementById('brandFilter'),
  sizeFilter: document.getElementById('sizeFilter'),

  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),

  openMysteryBtn: document.getElementById('openMysteryBtn'),

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

/* ———— Init ———— */
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

/* ———— Load products ———— */
async function loadProducts() {
  let products = [];
  try {
    const res = await fetch('/products.json', { cache: 'no-store' });
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

/* ———— Filters ———— */
function buildFilters() {
  [...state.brandSet].sort().forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    els.brandFilter.appendChild(opt);
  });

  for (let s = 35; s <= 49; s++) {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = String(s);
    els.sizeFilter.appendChild(opt);
  }
}

function attachEvents() {
  els.brandFilter.addEventListener('change', applyFilters);
  els.sizeFilter.addEventListener('change', applyFilters);

  els.searchInput.addEventListener('input', debounce(applyFilters, 300));
  els.sortSelect.addEventListener('change', applyFilters);

  els.openMysteryBtn.addEventListener('click', openMysteryBox);

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

/* ———— Mystery Box ———— */
function openMysteryBox() {
  const arr = state.products;
  if (!arr.length) return;

  const randomIndex = Math.floor(Math.random() * arr.length);
  const p = arr[randomIndex];

  alert(`Сегодняшняя пара: ${p.title} — ${formatPrice(p.price)}`);
}

/* ———— Apply filters ———— */
function applyFilters() {
  const brand = els.brandFilter.value;
  const size = els.sizeFilter.value ? Number(els.sizeFilter.value) : null;
  const search = els.searchInput.value.trim().toLowerCase();
  const sort = els.sortSelect.value;

  let arr = state.products.filter(p => {
    const byBrand = !brand || p.brand === brand;
    const bySize = !size || (p.sizes || []).includes(size);
    const bySearch = !search || p.title.toLowerCase().includes(search);

    return byBrand && bySize && bySearch;
  });

  if (sort === 'price-asc') arr.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') arr.sort((a, b) => b.price - a.price);

  state.filtered = arr;
  renderCatalog();
}

/* ———— Render catalog ———— */
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

/* ———— CARD NODE (Air Minimal Bold Clean) ———— */
function cardNode(p) {
  const node = document.createElement('div');
  node.className = 'card';
  node.dataset.id = p.id;

  const cover = (p.images && p.images[0]) || '';
  const price = formatPrice(p.price);
  const fav = state.favorites.has(p.id);

  node.innerHTML = `
    <button class="fav-btn">
      <svg class="fav-icon ${fav ? 'active' : ''}" viewBox="0 0 24 24">
        <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/>
      </svg>
    </button>

    <div class="card-image">
      <img src="${cover}" alt="${p.title}">
    </div>

    <div class="card-info">
      <div class="card-title">${p.title}</div>
      <div class="card-price">${price}</div>
    </div>
  `;

  node.addEventListener('click', () => openProductModal(p));

  const favBtn = node.querySelector('.fav-btn');
  const favIcon = node.querySelector('.fav-icon');

  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(p.id);
    favIcon.classList.toggle('active');
    favIcon.classList.add('animate');
    setTimeout(() => favIcon.classList.remove('animate'), 300);
  });

  return node;
}

/* ———— Product modal ———— */
function openProductModal(p) {
  currentProduct = p;
  selectedSize = null;

  els.modalImages.innerHTML = (p.images || []).map(src => `<img src="${src}" alt="">`).join('');
  els.modalTitle.textContent = p.title;
  els.modalBrandSeason.textContent = p.title;
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

/* ———— Favorites ———— */
function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);

  localStorage.setItem('favorites', JSON.stringify([...state.favorites]));

  const icon = document.querySelector(`.card[data-id="${id}"] .fav-icon`);
  if (icon) {
    icon.classList.toggle('active');
    icon.classList.add('animate');
    setTimeout(() => icon.classList.remove('animate'), 400);
  }
}

/* ———— Cart ———— */
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

function closeCart()
