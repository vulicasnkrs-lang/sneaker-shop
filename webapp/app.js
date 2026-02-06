/* Telegram */
const tg = window.Telegram?.WebApp || null;

/* ========================= */
/*          STATE            */
/* ========================= */

const state = {
  products: [],
  filtered: [],
  favorites: new Set(JSON.parse(localStorage.getItem('favorites') || '[]')),
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  brandSet: new Set(),
  allSizes: new Set(),
  mysteryProductId: null,
  orders: JSON.parse(localStorage.getItem('orders') || '[]'),
  postponed: JSON.parse(localStorage.getItem('postponed') || '[]'),

  /* ⭐ NEW: бронь размера */
  reserved: JSON.parse(localStorage.getItem('reserved') || '[]'),

  view: 'catalog'
};

/* ========================= */
/*         ELEMENTS          */
/* ========================= */

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
  thumbStrip: document.getElementById('thumbStrip'),

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

  profileModal: document.getElementById('profileModal'),

  profileAvatarHeader: document.getElementById('profileAvatar'),
  profileAvatarProfile: document.getElementById('profileAvatarProfile'),
  profileName: document.getElementById('profileName'),
  profileUsername: document.getElementById('profileUsername'),

  profileTabs: document.querySelectorAll('.profile-tab'),
  profileOrders: document.getElementById('profileOrders'),
  profileFavorites: document.getElementById('profileFavorites'),
  profilePostponed: document.getElementById('profilePostponed'),

  /* ⭐ NEW: Availability */
  stockCount: document.getElementById('stockCount'),
  reserveBtn: document.getElementById('reserveBtn')
};

let currentProduct = null;
let selectedSize = null;

/* ========================= */
/*            INIT           */
/* ========================= */

async function init() {
  cleanupReserved(); // ⭐ очищаем истёкшие брони

  renderSkeletons();
  await loadProducts();
  buildFilters();
  updateCartBadge();
  updateFavBadge();
  renderCatalog();
  attachEvents();
  initProfileFromTelegram();
  renderProfileSections();
  renderProfileOrders();
  renderProfileFavorites();
  renderProfilePostponed();

  if (tg) {
    tg.expand();
    tg.MainButton.text = 'Оформить заказ';
    tg.MainButton.onClick(checkout);
  }
}

/* ========================= */
/*   TELEGRAM PROFILE INIT   */
/* ========================= */

function initProfileFromTelegram() {
  if (!tg?.initDataUnsafe?.user) return;

  const user = tg.initDataUnsafe.user;

  els.profileName.textContent =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Покупатель';

  els.profileUsername.textContent = user.username ? '@' + user.username : '';

  if (user.photo_url) {
    els.profileAvatarHeader.style.backgroundImage = `url(${user.photo_url})`;
    els.profileAvatarHeader.style.backgroundSize = 'cover';
    els.profileAvatarHeader.style.backgroundPosition = 'center';

    els.profileAvatarProfile.style.backgroundImage = `url(${user.photo_url})`;
    els.profileAvatarProfile.style.backgroundSize = 'cover';
    els.profileAvatarProfile.style.backgroundPosition = 'center';
  }
}
/* ========================= */
/*   PRODUCT SCREEN (TG)     */
/* ========================= */

function openProductScreen(productId) {
  const p = state.products.find(x => String(x.id) === String(productId));
  if (!p) return;

  currentProduct = p;
  selectedSize = null;

  openProductModal(p);

  tg.BackButton.show();
  tg.BackButton.onClick(() => {
    closeProductModal();
    tg.BackButton.hide();
    tg.BackButton.onClick(() => {});
  });
}

/* ========================= */
/*       PRODUCT MODAL       */
/* ========================= */

function openProductModal(p) {
  currentProduct = p;
  selectedSize = null;

  const carousel = els.carousel;
  const thumbStrip = els.thumbStrip;

  carousel.innerHTML = '';
  thumbStrip.innerHTML = '';

  const imgs = p.images || [];

  // --- GALLERY IMAGES ---
  imgs.forEach((src) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = p.title;
    carousel.appendChild(img);
  });

  // --- THUMBNAILS ---
  imgs.forEach((src, i) => {
    const t = document.createElement('div');
    t.className = 'thumb' + (i === 0 ? ' active' : '');
    t.innerHTML = `<img src="${src}" alt="">`;

    t.addEventListener('click', () => {
      const width = carousel.clientWidth;
      carousel.scrollTo({ left: width * i, behavior: 'smooth' });
      updateThumbs(i);
    });

    thumbStrip.appendChild(t);
  });

  const thumbs = Array.from(thumbStrip.querySelectorAll('.thumb'));

  // --- SCROLL SYNC ---
  carousel.scrollLeft = 0;

  carousel.onscroll = () => {
    const width = carousel.clientWidth || 1;
    const index = Math.round(carousel.scrollLeft / width);
    const safeIndex = Math.min(Math.max(index, 0), imgs.length - 1);
    updateThumbs(safeIndex);
  };

  function updateThumbs(i) {
    thumbs.forEach((th, idx) => {
      th.classList.toggle('active', idx === i);
    });
  }

  // --- PRODUCT INFO ---
  els.modalTitle.textContent = p.title;
  els.modalBrandSeason.textContent = p.brand + ' • ' + (p.season || '');
  els.modalPrice.textContent = formatPrice(p.price);
  els.modalDesc.textContent = p.description || '';
  els.modalQty.value = 1;

  // --- SIZES ---
  els.modalSizes.innerHTML = '';
  (p.sizes || []).forEach(obj => {
    const s = obj.size;
    const stock = obj.stock;

    const b = document.createElement('button');
    b.className = 'size';
    b.textContent = s;

    if (stock <= 0) {
      b.disabled = true;
      b.style.opacity = 0.4;
    }

    b.addEventListener('click', () => {
      selectedSize = s;

      els.modalSizes.querySelectorAll('.size')
        .forEach(x => x.classList.remove('active'));
      b.classList.add('active');

      updateStockDisplay(p, s);
      updateReserveButton(p, s);

      els.modalPrice.classList.remove('bump');
      void els.modalPrice.offsetWidth;
      els.modalPrice.classList.add('bump');
    });

    els.modalSizes.appendChild(b);
  });

  // --- INITIAL STOCK DISPLAY ---
  els.stockCount.textContent = '—';
  els.reserveBtn.disabled = true;

  // --- RESERVE BUTTON ---
  els.reserveBtn.onclick = () => {
    if (!selectedSize) return;

    reserveSize(p.id, selectedSize);
    updateStockDisplay(p, selectedSize);
    updateReserveButton(p, selectedSize);
  };

  // --- OPEN MODAL ---
  els.productModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    els.productModal.classList.add('open');
  });

  // --- ADD TO CART ---
  els.addToCartBtn.onclick = (e) => {
    addRippleEffect(els.addToCartBtn, e);

    if (!selectedSize) selectedSize = pickFirstSize(p);

    const sizeObj = p.sizes.find(x => x.size === selectedSize);
    if (!sizeObj || sizeObj.stock <= 0) {
      alert('Нет в наличии');
      return;
    }

    const qty = Math.max(1, Number(els.modalQty.value || 1));

    addToCart(p, selectedSize, qty);
    createFlyAnimation(p);

    closeProductModal();
    openCart();
  };

  // --- FAVORITE ---
  els.toggleFavBtn.onclick = () => {
    toggleFavorite(p.id);
    updateFavBadge();
    renderProfileFavorites();
  };
}

/* ========================= */
/*   STOCK + RESERVE LOGIC   */
/* ========================= */

function updateStockDisplay(p, size) {
  const sizeObj = p.sizes.find(x => x.size === size);
  if (!sizeObj) return;

  const stock = sizeObj.stock;

  if (stock > 1) els.stockCount.textContent = `${stock} пар`;
  else if (stock === 1) els.stockCount.textContent = `1 пара`;
  else els.stockCount.textContent = `Нет в наличии`;
}

function updateReserveButton(p, size) {
  const key = `${p.id}:${size}`;
  const reserved = state.reserved.find(x => x.key === key);

  const sizeObj = p.sizes.find(x => x.size === size);

  if (!sizeObj || sizeObj.stock <= 0) {
    els.reserveBtn.disabled = true;
    els.reserveBtn.textContent = 'Нет в наличии';
    return;
  }

  if (reserved) {
    els.reserveBtn.disabled = true;
    els.reserveBtn.textContent = 'Забронировано';
  } else {
    els.reserveBtn.disabled = false;
    els.reserveBtn.textContent = 'Забронировать пару';
  }
}

function reserveSize(productId, size) {
  const key = `${productId}:${size}`;
  const p = state.products.find(x => x.id === productId);
  if (!p) return;

  const sizeObj = p.sizes.find(x => x.size === size);
  if (!sizeObj || sizeObj.stock <= 0) return;

  // уменьшаем stock
  sizeObj.stock -= 1;

  // создаём бронь
  state.reserved.push({
    key,
    id: productId,
    size,
    until: Date.now() + 24 * 60 * 60 * 1000 // 24 часа
  });

  saveReserved();
  saveProductsStock();
}

function cleanupReserved() {
  const now = Date.now();
  const before = state.reserved.length;

  state.reserved = state.reserved.filter(r => {
    if (r.until > now) return true;

    // бронь истекла → вернуть stock
    const p = state.products.find(x => x.id === r.id);
    if (p) {
      const sizeObj = p.sizes.find(x => x.size === r.size);
      if (sizeObj) sizeObj.stock += 1;
    }

    return false;
  });

  if (state.reserved.length !== before) {
    saveReserved();
    saveProductsStock();
  }
}

function saveReserved() {
  localStorage.setItem('reserved', JSON.stringify(state.reserved));
}

function saveProductsStock() {
  // сохраняем только stock, не весь products.json
  const stockMap = {};

  state.products.forEach(p => {
    stockMap[p.id] = p.sizes.map(s => ({
      size: s.size,
      stock: s.stock
    }));
  });

  localStorage.setItem('stockMap', JSON.stringify(stockMap));
}

function restoreProductsStock() {
  const raw = localStorage.getItem('stockMap');
  if (!raw) return;

  const stockMap = JSON.parse(raw);

  state.products.forEach(p => {
    if (!stockMap[p.id]) return;

    p.sizes.forEach(s => {
      const saved = stockMap[p.id].find(x => x.size === s.size);
      if (saved) s.stock = saved.stock;
    });
  });
}
/* ========================= */
/*          ORDERS           */
/* ========================= */

function renderProfileOrders() {
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

/* ========================= */
/*       PROFILE FAVORITES   */
/* ========================= */

function renderProfileFavorites() {
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

/* ========================= */
/*       PROFILE POSTPONED   */
/* ========================= */

function renderProfilePostponed() {
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
    const daysLeft = Math.max(1, Math.ceil(diffMs / 86400000));

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

    node.querySelector('button').addEventListener('click', () => {
      state.postponed = state.postponed.filter(x => x.id !== p.id);
      savePostponed();
      state.filtered = applyPostponedFilter([...state.products]);
      renderCatalog();
      renderProfilePostponed();
    });

    els.profilePostponed.appendChild(node);
  });
}

/* ========================= */
/*       FAVORITES VIEW      */
/* ========================= */

function renderFavorites() {
  els.catalog.innerHTML = '';

  const favIds = [...state.favorites];
  const arr = state.products.filter(p => favIds.includes(p.id));

  if (!arr.length) {
    const empty = document.createElement('div');
    empty.style.color = '#aeb4c0';
    empty.style.padding = '20px';
    empty.textContent = 'В избранном пока пусто';
    els.catalog.appendChild(empty);
    return;
  }

  arr.forEach((p, i) => {
    const node = cardNode(p);
    node.style.animationDelay = `${i * 40}ms`;
    els.catalog.appendChild(node);
  });
}

/* ========================= */
/*          CHECKOUT         */
/* ========================= */

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
    const res = await fetch('/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });

    if (res.ok) {
      state.orders.push(order);
      saveOrders();
      renderProfileOrders();

      tg?.showPopup({
        title: 'Заказ',
        message: '✅ Заказ отправлен!',
        buttons: [{ type: 'ok' }]
      });

      state.cart = [];
      localStorage.removeItem('cart');
      renderCart();
      updateCartBadge();
    } else {
      throw new Error('Server error');
    }
  } catch {
    tg?.showPopup({
      title: 'Ошибка',
      message: 'Не удалось отправить заказ',
      buttons: [{ type: 'ok' }]
    });
  }
}

/* ========================= */
/*            UTILS          */
/* ========================= */

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

function saveOrders() {
  localStorage.setItem('orders', JSON.stringify(state.orders));
}

function savePostponed() {
  localStorage.setItem('postponed', JSON.stringify(state.postponed));
}

function addRippleEffect(button, event) {
  const rect = button.getBoundingClientRect();
  const circle = document.createElement('span');
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');

  const existing = button.getElementsByClassName('ripple')[0];
  if (existing) existing.remove();

  button.appendChild(circle);
}

function cleanupPostponed() {
  const now = Date.now();
  const before = state.postponed.length;
  state.postponed = state.postponed.filter(
    x => new Date(x.until).getTime() > now
  );
  if (state.postponed.length !== before) {
    savePostponed();
  }
}
/* ========================= */
/*       FLY ANIMATION       */
/* ========================= */

function createFlyAnimation(p) {
  const src = p.images?.[0] || '';
  if (!src) return;

  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  img.style.width = '64px';
  img.style.height = '64px';
  img.style.borderRadius = '16px';
  img.style.objectFit = 'cover';

  const fly = document.createElement('div');
  fly.className = 'fly';
  fly.appendChild(img);
  document.body.appendChild(fly);

  const startRect = els.productModal.getBoundingClientRect();
  const cartRect = els.cartBtn.getBoundingClientRect();

  const startX = startRect.left + startRect.width / 2;
  const startY = startRect.top + startRect.height / 2;
  const endX = cartRect.left + cartRect.width / 2;
  const endY = cartRect.top + cartRect.height / 2;

  fly.style.left = `${startX - 32}px`;
  fly.style.top = `${startY - 32}px`;

  requestAnimationFrame(() => {
    const dx = endX - startX;
    const dy = endY - startY;
    fly.style.transform = `translate(${dx}px, ${dy}px) scale(0.4)`;
    fly.style.opacity = '0';
  });

  setTimeout(() => {
    fly.remove();
  }, 700);
}

/* ========================= */
/*       MYSTERY BOX         */
/* ========================= */

function openMysteryBox() {
  const arr = state.filtered.length ? state.filtered : state.products;
  if (!arr.length) return;

  const p = arr[Math.floor(Math.random() * arr.length)];
  state.mysteryProductId = p.id;

  els.mysteryImg.src = p.images?.[0] || '';
  els.mysteryTitle.textContent = p.title;
  els.mysteryPrice.textContent = formatPrice(p.price);

  els.mysteryModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    els.mysteryModal.classList.add('open');
  });
}

function closeMysteryModal() {
  els.mysteryModal.classList.remove('open');
  setTimeout(() => {
    els.mysteryModal.classList.add('hidden');
  }, 200);
}

/* ========================= */
/*   PROFILE MODAL (NEW)     */
/* ========================= */

function openProfileModal() {
  els.profileModal.classList.remove('hidden');

  requestAnimationFrame(() => {
    els.profileModal.classList.add('open');
  });

  if (tg) {
    tg.BackButton.show();
    tg.BackButton.onClick(() => {
      closeProfileModal();
      tg.BackButton.hide();
      tg.BackButton.onClick(() => {});
    });
  }
}

function closeProfileModal() {
  els.profileModal.classList.remove('open');

  setTimeout(() => {
    els.profileModal.classList.add('hidden');
  }, 200);

  if (tg) {
    tg.BackButton.hide();
    tg.BackButton.onClick(() => {});
  }
}

/* ========================= */
/*       ATTACH EVENTS       */
/* ========================= */

function attachEvents() {
  els.brandFilter.addEventListener('change', applyFilters);
  els.sizeFilter.addEventListener('change', applyFilters);
  els.sortSelect.addEventListener('change', applyFilters);
  els.searchInput.addEventListener('input', debounce(applyFilters, 300));

  els.openMysteryBtn.addEventListener('click', openMysteryBox);
  els.closeMystery.addEventListener('click', closeMysteryModal);
  els.mysteryOk.addEventListener('click', closeMysteryModal);

  els.cartBtn.addEventListener('click', openCart);
  els.closeCart.addEventListener('click', closeCart);
  els.checkoutBtn.addEventListener('click', checkout);

  els.favBtn.addEventListener('click', toggleFavoritesView);
  els.clearFavoritesBtn.addEventListener('click', clearFavorites);

  els.profileAvatarHeader.addEventListener('click', () => {
    openProfileModal();
    renderProfileSections();
    renderProfileOrders();
    renderProfileFavorites();
    renderProfilePostponed();
  });

  els.profileTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      els.profileTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      switchProfileTab(tab.dataset.tab);
    });
  });

  if (!tg) {
    els.browserBackBtn.addEventListener('click', () => {
      closeProductModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeProductModal();
      closeMysteryModal();
      closeProfileModal();
    }
  });
}

/* ========================= */
/*           START           */
/* ========================= */

init();
