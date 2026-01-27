/* Telegram */
const tg = window.Telegram?.WebApp || null;

/* State */
const state = {
  products: [],
  filtered: [],
  favorites: new Set(JSON.parse(localStorage.getItem('favorites') || '[]')),
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  brandSet: new Set(),
  allSizes: new Set(),
  view: 'catalog',
  mysteryProductId: null,

  orders: JSON.parse(localStorage.getItem('orders') || '[]'),
  postponed: JSON.parse(localStorage.getItem('postponed') || '[]') // [{id, until}]
};

/* Elements */
const els = {
  catalog: document.getElementById('catalog'),

  brandFilter: document.getElementById('brandFilter'),
  sizeFilter: document.getElementById('sizeFilter'),
  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),

  filtersSection: document.getElementById('filtersSection'),
  favoritesHeader: document.getElementById('favoritesHeader'),
  favoritesCountLabel: document.getElementById('favoritesCountLabel'),
  clearFavoritesBtn: document.getElementById('clearFavoritesBtn'),

  mysteryBox: document.getElementById('mysteryBox'),
  openMysteryBtn: document.getElementById('openMysteryBtn'),

  mysteryModal: document.getElementById('mysteryModal'),
  closeMystery: document.getElementById('closeMystery'),
  mysteryImg: document.getElementById('mysteryImg'),
  mysteryTitle: document.getElementById('mysteryTitle'),
  mysteryPrice: document.getElementById('mysteryPrice'),
  mysteryOk: document.getElementById('mysteryOk'),

  cartBtn: document.getElementById('cartBtn'),
  cartDrawer: document.getElementById('cartDrawer'),
  closeCart: document.getElementById('closeCart'),
  cartList: document.getElementById('cartList'),
  cartTotal: document.getElementById('cartTotal'),
  checkoutBtn: document.getElementById('checkoutBtn'),

  productModal: document.getElementById('productModal'),

  carousel: document.getElementById('carousel'),
  photoCounter: document.getElementById('photoCounter'),

  modalTitle: document.getElementById('modalTitle'),
  modalBrandSeason: document.getElementById('modalBrandSeason'),
  modalPrice: document.getElementById('modalPrice'),
  modalDesc: document.getElementById('modalDesc'),
  modalSizes: document.getElementById('modalSizes'),
  modalQty: document.getElementById('modalQty'),
  addToCartBtn: document.getElementById('addToCartBtn'),
  toggleFavBtn: document.getElementById('toggleFavBtn'),

  favBtn: document.getElementById('favBtn'),
  favCount: document.getElementById('favCount'),

  browserBackBtn: document.getElementById('browserBackBtn'),

  /* Профиль */
  profileBtn: document.getElementById('profileBtn'),
  profileBackBtn: document.getElementById('profileBackBtn'),
  profileHeader: document.getElementById('profileHeader'),
  profileAvatar: document.getElementById('profileAvatar'),
  profileName: document.getElementById('profileName'),
  profileUsername: document.getElementById('profileUsername'),

  profileTabs: document.querySelectorAll('.profile-tab'),
  profileOrders: document.getElementById('profileOrders'),
  profileFavorites: document.getElementById('profileFavorites'),
  profilePostponed: document.getElementById('profilePostponed')
};

let currentProduct = null;
let selectedSize = null;

/* Fade SPA Navigation */
function showScreen(view) {
  const catalogView = document.getElementById('catalogView');
  const productView = document.getElementById('productView');
  const profileView = document.getElementById('profileView');

  catalogView.classList.add('hidden');
  productView.classList.add('hidden');
  profileView.classList.add('hidden');

  if (view === 'catalog') {
    catalogView.classList.remove('hidden');
    catalogView.classList.add('fade-in');
  } else if (view === 'product') {
    productView.classList.remove('hidden');
    productView.classList.add('fade-in');
  } else if (view === 'profile') {
    profileView.classList.remove('hidden');
    profileView.classList.add('fade-in');
  }

  state.view = view;
}

/* Init */
async function init() {
  renderSkeletons();
  await loadProducts();
  buildFilters();
  updateCartBadge();
  updateFavBadge();
  renderCatalog();
  attachEvents();
  initProfileFromTelegram();
  renderProfileSections();

  if (tg) {
    tg.expand();
    tg.MainButton.text = 'Оформить заказ';
    tg.MainButton.onClick(checkout);
  }
}

/* Telegram profile init */
function initProfileFromTelegram() {
  if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) return;

  const user = tg.initDataUnsafe.user;

  els.profileName.textContent = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Покупатель';
  els.profileUsername.textContent = user.username ? '@' + user.username : '';

  if (user.photo_url) {
    els.profileAvatar.textContent = '';
    els.profileAvatar.style.backgroundImage = `url(${user.photo_url})`;
    els.profileAvatar.style.backgroundSize = 'cover';
    els.profileAvatar.style.backgroundPosition = 'center';
  }
}

/* Skeletons */
function renderSkeletons() {
  els.catalog.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const sk = document.createElement('div');
    sk.className = 'card skeleton';
    sk.innerHTML = `
      <div class="card-image skeleton"></div>
      <div class="card-info">
        <div class="skeleton" style="height:16px; width:70%;"></div>
        <div class="skeleton" style="height:18px; width:40%; margin-top:6px;"></div>
      </div>
    `;
    els.catalog.appendChild(sk);
  }
}

/* Load products */
async function loadProducts() {
  try {
    const res = await fetch('/products.json', { cache: 'no-store' });
    state.products = await res.json();
  } catch {
    state.products = [];
  }

  state.products.forEach(p => {
    state.brandSet.add(p.brand);
    (p.sizes || []).forEach(s => state.allSizes.add(s));
  });

  state.filtered = applyPostponedFilter([...state.products]);
}

/* Учитываем отложенные товары (до даты) */
function applyPostponedFilter(arr) {
  const now = Date.now();
  const activePostponed = state.postponed.filter(x => new Date(x.until).getTime() > now);
  const hiddenIds = activePostponed.map(x => x.id);
  return arr.filter(p => !hiddenIds.includes(p.id));
}

/* Filters */
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
  els.brandFilter.addEventListener('change', () => state.view === 'catalog' && applyFilters());
  els.sizeFilter.addEventListener('change', () => state.view === 'catalog' && applyFilters());

  els.searchInput.addEventListener('input', debounce(() => {
    if (state.view === 'catalog') applyFilters();
  }, 300));

  els.sortSelect.addEventListener('change', () => state.view === 'catalog' && applyFilters());

  els.openMysteryBtn.addEventListener('click', openMysteryBox);
  els.closeMystery.addEventListener('click', closeMysteryModal);
  els.mysteryOk.addEventListener('click', closeMysteryModal);

  els.cartBtn.addEventListener('click', openCart);
  els.closeCart.addEventListener('click', closeCart);
  els.checkoutBtn.addEventListener('click', checkout);

  els.favBtn.addEventListener('click', toggleFavoritesView);
  els.clearFavoritesBtn.addEventListener('click', clearFavorites);

  /* Профиль */
  if (els.profileBtn) {
    els.profileBtn.addEventListener('click', () => {
      showScreen('profile');
      renderProfileSections();
    });
  }

  if (els.profileBackBtn) {
    els.profileBackBtn.addEventListener('click', () => {
      showScreen('catalog');
    });
  }

  els.profileTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      els.profileTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      switchProfileTab(tab.dataset.tab);
    });
  });

  /* Browser Back Button */
  if (!tg) {
    els.browserBackBtn.addEventListener('click', () => {
      closeProductModal();
      showScreen('catalog');
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeProductModal();
      closeMysteryModal();
    }
  });
}

/* Mystery Box */
function openMysteryBox() {
  const arr = state.products;
  if (!arr.length) return;

  els.mysteryBox.classList.add('mystery-animate');
  setTimeout(() => els.mysteryBox.classList.remove('mystery-animate'), 500);

  const p = arr[Math.floor(Math.random() * arr.length)];
  state.mysteryProductId = p.id;

  els.mysteryImg.src = p.images?.[0] || '';
  els.mysteryTitle.textContent = p.title;
  els.mysteryPrice.textContent = formatPrice(p.price);

  els.mysteryModal.classList.remove('hidden');
  requestAnimationFrame(() => els.mysteryModal.classList.add('open'));
}

function closeMysteryModal() {
  els.mysteryModal.classList.remove('open');
  setTimeout(() => els.mysteryModal.classList.add('hidden'), 220);
}

/* Render catalog */
function renderCatalog() {
  els.catalog.innerHTML = '';

  if (!state.filtered.length) {
    const empty = document.createElement('div');
    empty.style.color = '#aeb4c0';
    empty.textContent = 'Ничего не найдено';
    els.catalog.appendChild(empty);
    return;
  }

  state.filtered.forEach((p, i) => {
    const node = cardNode(p);
    node.style.animationDelay = `${i * 40}ms`;
    els.catalog.appendChild(node);
  });
}

/* Render favorites */
function renderFavorites() {
  els.catalog.innerHTML = '';

  const favIds = [...state.favorites];
  const arr = state.products.filter(p => favIds.includes(p.id));

  els.favoritesCountLabel.textContent = arr.length ? `(${arr.length})` : '(0)';

  if (!arr.length) {
    const empty = document.createElement('div');
    empty.style.color = '#aeb4c0';
    empty.textContent = 'В избранном пока пусто';
    els.catalog.appendChild(empty);
    return;
  }

  arr.forEach(p => els.catalog.appendChild(cardNode(p)));
}

/* Card node */
function cardNode(p) {
  const node = document.createElement('div');
  node.className = 'card';
  node.dataset.id = p.id;

  const cover = p.images?.[0] || '';
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

  node.addEventListener('click', () => {
    if (tg) openProductScreen(p.id);
    else {
      showScreen('product');
      openProductModal(p);
    }
  });

  const favBtn = node.querySelector('.fav-btn');
  const favIcon = node.querySelector('.fav-icon');

  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(p.id);
    favIcon.classList.toggle('active');
    favIcon.classList.add('animate');
    setTimeout(() => favIcon.classList.remove('animate'), 300);
  });

  /* Tilt effect */
  node.addEventListener('mousemove', (e) => {
    const rect = node.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const tiltX = (y / rect.height) * 3;
    const tiltY = -(x / rect.width) * 3;

    node.style.transform =
      `translateY(-4px) scale(1.02) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  });

  node.addEventListener('mouseleave', () => {
    node.style.transform = '';
  });

  return node;
}
/* PRODUCT SCREEN (SPA) */
function openProductScreen(productId) {
  const p = state.products.find(x => String(x.id) === String(productId));
  if (!p) return;

  currentProduct = p;
  selectedSize = null;

  showScreen('product');
  openProductModal(p);

  if (tg) {
    tg.BackButton.show();
    tg.BackButton.onClick(() => {
      closeProductModal();
      tg.BackButton.hide();
      tg.BackButton.onClick(() => {});
    });
  } else {
    els.browserBackBtn.classList.remove('hidden');
  }
}

/* PRODUCT MODAL */
function openProductModal(p) {
  currentProduct = p;
  selectedSize = null;

  const carousel = els.carousel;
  const counter = els.photoCounter;

  carousel.innerHTML = "";

  const imgs = p.images || [];
  imgs.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = p.title;
    carousel.appendChild(img);
  });

  carousel.scrollLeft = 0;
  counter.textContent = `1 / ${imgs.length}`;

  carousel.onscroll = () => {
    const width = carousel.clientWidth;
    const index = Math.round(carousel.scrollLeft / width);
    counter.textContent = `${index + 1} / ${imgs.length}`;
  };

  els.modalTitle.textContent = p.title;
  els.modalBrandSeason.textContent = p.brand + " • " + (p.season || "");
  els.modalPrice.textContent = formatPrice(p.price);
  els.modalDesc.textContent = p.description || '';
  els.modalQty.value = 1;

  if (state.mysteryProductId === p.id) {
    els.productModal.classList.add('highlighted');
  } else {
    els.productModal.classList.remove('highlighted');
  }

  els.modalSizes.innerHTML = "";
  (p.sizes || []).forEach(s => {
    const b = document.createElement("button");
    b.className = "size";
    b.textContent = s;

    b.addEventListener("click", () => {
      selectedSize = s;

      els.modalSizes.querySelectorAll(".size")
        .forEach(x => x.classList.remove("active"));
      b.classList.add("active");

      els.modalPrice.classList.remove("bump");
      void els.modalPrice.offsetWidth;
      els.modalPrice.classList.add("bump");
    });

    els.modalSizes.appendChild(b);
  });

  els.productModal.classList.remove("hidden");
  requestAnimationFrame(() => {
    els.productModal.classList.add("open");
  });

  els.addToCartBtn.onclick = (e) => {
    addRippleEffect(els.addToCartBtn, e);

    const qty = Math.max(1, Number(els.modalQty.value || 1));
    if (!selectedSize) selectedSize = pickFirstSize(p);

    addToCart(p, selectedSize, qty);
    createFlyAnimation(p);

    closeProductModal();
    openCart();
  };

  els.toggleFavBtn.onclick = () => {
    toggleFavorite(p.id);
    updateFavBadge();
    renderProfileFavorites(); // чтобы профиль сразу обновлялся
  };
}

/* Close product modal */
function closeProductModal() {
  els.productModal.classList.remove('open');

  if (!tg) {
    els.browserBackBtn.classList.add('hidden');
  }

  setTimeout(() => {
    els.productModal.classList.add('hidden');
    showScreen('catalog');
  }, 220);

  if (tg) {
    tg.BackButton.hide();
    tg.BackButton.onClick(() => {});
  }
}

/* Favorites */
function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);

  localStorage.setItem('favorites', JSON.stringify([...state.favorites]));
  updateFavBadge();

  if (state.view === 'favorites') renderFavorites();
}

function clearFavorites() {
  state.favorites.clear();
  localStorage.setItem('favorites', JSON.stringify([]));
  updateFavBadge();
  if (state.view === 'favorites') renderFavorites();
}

function updateFavBadge() {
  els.favCount.textContent = state.favorites.size;
}

/* Cart */
function pickFirstSize(p) {
  return (p.sizes || [])[0] || null;
}

function addToCart(p, size, qty) {
  const key = `${p.id}:${size}`;
  const idx = state.cart.findIndex(x => x.key === key);

  if (idx >= 0) {
    state.cart[idx].qty += qty;
  } else {
    state.cart.push({
      key,
      id: p.id,
      title: p.title,
      brand: p.brand,
      price: p.price,
      size,
      qty,
      images: p.images
    });
  }

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
      <img src="${item.images?.[0] || ''}" alt="">
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
  els.cartBtn.textContent = formatPrice(cartTotal());
}

/* Fly animation */
function createFlyAnimation(p) {
  const cover = p.images?.[0] || '';
  if (!cover) return;

  const img = document.createElement('img');
  img.src = cover;
  img.className = 'fly';
  img.style.width = '80px';
  img.style.height = '80px';
  img.style.borderRadius = '50%';
  img.style.objectFit = 'cover';

  const rect = els.productModal.getBoundingClientRect();
  img.style.left = rect.left + rect.width / 2 - 40 + 'px';
  img.style.top = rect.top + rect.height / 2 - 40 + 'px';

  document.body.appendChild(img);
  setTimeout(() => img.remove(), 700);
}

/* Orders / Profile helpers */
function saveOrders() {
  localStorage.setItem('orders', JSON.stringify(state.orders));
}

function savePostponed() {
  localStorage.setItem('postponed', JSON.stringify(state.postponed));
}

/* Отложить товар (по умолчанию на 3 дня, но максимум 7) */
function postponeProduct(id, days = 3) {
  const safeDays = Math.min(Math.max(days, 1), 7);
  const until = new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000).toISOString();

  const existingIdx = state.postponed.findIndex(x => x.id === id);
  if (existingIdx >= 0) {
    state.postponed[existingIdx].until = until;
  } else {
    state.postponed.push({ id, until });
  }

  savePostponed();
  state.filtered = applyPostponedFilter([...state.products]);
  if (state.view === 'catalog') renderCatalog();
  renderProfilePostponed();
}

/* Очистка просроченных отложенных */
function cleanupPostponed() {
  const now = Date.now();
  state.postponed = state.postponed.filter(x => new Date(x.until).getTime() > now);
  savePostponed();
}

/* Profile rendering */
function renderProfileSections() {
  cleanupPostponed();
  renderProfileOrders();
  renderProfileFavorites();
  renderProfilePostponed();
}

function switchProfileTab(tab) {
  const sections = {
    orders: els.profileOrders,
    favorites: els.profileFavorites,
    postponed: els.profilePostponed
  };

  Object.values(sections).forEach(s => s.classList.remove('active'));
  if (sections[tab]) sections[tab].classList.add('active');
}

function renderProfileOrders() {
  if (!els.profileOrders) return;
  els.profileOrders.innerHTML = '';

  if (!state.orders.length) {
    const empty = document.createElement('div');
    empty.className = 'profile-empty';
    empty.textContent = 'Покупок пока нет';
    els.profileOrders.appendChild(empty);
    return;
  }

  const sorted = [...state.orders].sort((a, b) => new Date(b.ts) - new Date(a.ts));

  sorted.forEach(order => {
    const node = document.createElement('div');
    node.className = 'profile-order';

    const date = new Date(order.ts);
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    node.innerHTML = `
      <div class="profile-order-header">
        <div class="profile-order-date">${dateStr}</div>
        <div class="profile-order-total">${formatPrice(order.total)}</div>
      </div>
      <div class="profile-order-items">
        ${order.items.map(it => `
          <div class="profile-order-item">
            <div class="title">${it.title}</div>
            <div class="meta">Размер ${it.size} • ${it.qty} шт.</div>
          </div>
        `).join('')}
      </div>
    `;

    els.profileOrders.appendChild(node);
  });
}

function renderProfileFavorites() {
  if (!els.profileFavorites) return;
  els.profileFavorites.innerHTML = '';

  const favIds = [...state.favorites];
  const arr = state.products.filter(p => favIds.includes(p.id));

  if (!arr.length) {
    const empty = document.createElement('div');
    empty.className = 'profile-empty';
    empty.textContent = 'В избранном пока пусто';
    els.profileFavorites.appendChild(empty);
    return;
  }

  arr.forEach(p => {
    const node = document.createElement('div');
    node.className = 'profile-fav-item';

    const cover = p.images?.[0] || '';

    node.innerHTML = `
      <div class="profile-fav-left">
        <img src="${cover}" alt="${p.title}">
        <div>
          <div class="title">${p.title}</div>
          <div class="meta">${p.brand}</div>
        </div>
      </div>
      <div class="profile-fav-right">
        <div class="price">${formatPrice(p.price)}</div>
      </div>
    `;

    els.profileFavorites.appendChild(node);
  });
}

function renderProfilePostponed() {
  if (!els.profilePostponed) return;
  els.profilePostponed.innerHTML = '';

  cleanupPostponed();

  if (!state.postponed.length) {
    const empty = document.createElement('div');
    empty.className = 'profile-empty';
    empty.textContent = 'Отложенных пар нет';
    els.profilePostponed.appendChild(empty);
    return;
  }

  state.postponed.forEach(entry => {
    const p = state.products.find(x => x.id === entry.id);
    if (!p) return;

    const node = document.createElement('div');
    node.className = 'profile-postponed-item';

    const cover = p.images?.[0] || '';
    const untilDate = new Date(entry.until);
    const diffMs = untilDate.getTime() - Date.now();
    const daysLeft = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));

    node.innerHTML = `
      <div class="profile-postponed-left">
        <img src="${cover}" alt="${p.title}">
        <div>
          <div class="title">${p.title}</div>
          <div class="meta">${p.brand}</div>
          <div class="meta">Ещё ~${daysLeft} дн.</div>
        </div>
      </div>
      <div class="profile-postponed-right">
        <div class="price">${formatPrice(p.price)}</div>
        <button class="secondary small" data-id="${p.id}">Вернуть в каталог</button>
      </div>
    `;

    const btn = node.querySelector('button');
    btn.addEventListener('click', () => {
      state.postponed = state.postponed.filter(x => x.id !== p.id);
      savePostponed();
      state.filtered = applyPostponedFilter([...state.products]);
      if (state.view === 'catalog') renderCatalog();
      renderProfilePostponed();
    });

    els.profilePostponed.appendChild(node);
  });
}

/* Checkout */
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
      // сохраняем в историю
      state.orders.push(order);
      saveOrders();
      renderProfileOrders();

      tg?.showPopup({
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
  } catch {
    tg?.showPopup({
      title: "Ошибка",
      message: "Не удалось отправить заказ",
      buttons: [{ type: "ok" }]
    });
  }
}

/* Utils */
function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function toggleFavoritesView() {
  if (state.view === 'favorites') {
    state.view = 'catalog';
    els.favoritesHeader.classList.add('hidden');
    renderCatalog();
  } else {
    state.view = 'favorites';
    els.favoritesHeader.classList.remove('hidden');
    renderFavorites();
  }
}

init();
