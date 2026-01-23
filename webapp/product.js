const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

let product = null;
let selectedSize = null;

const els = {
  carousel: document.getElementById('carousel'),
  photoCounter: document.getElementById('photoCounter'),
  modalTitle: document.getElementById('modalTitle'),
  modalBrandSeason: document.getElementById('modalBrandSeason'),
  modalPrice: document.getElementById('modalPrice'),
  modalDesc: document.getElementById('modalDesc'),
  modalSizes: document.getElementById('modalSizes'),
  modalQty: document.getElementById('modalQty'),
  addToCartBtn: document.getElementById('addToCartBtn')
};

init();

async function init() {
  if (tg) tg.expand();

  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  const res = await fetch('/products.json', { cache: 'no-store' });
  const products = await res.json();
  product = products.find(x => String(x.id) === String(id));

  if (!product) {
    els.modalTitle.textContent = 'Товар не найден';
    return;
  }

  renderProduct(product);

  if (tg) {
    tg.BackButton.show();
    tg.BackButton.onClick(() => tg.close());
  }
}

function renderProduct(p) {
  // Галерея
  els.carousel.innerHTML = '';
  const imgs = p.images || [];

  imgs.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = p.title;
    els.carousel.appendChild(img);
  });

  els.carousel.scrollLeft = 0;
  els.photoCounter.textContent = `1 / ${imgs.length}`;

  els.carousel.onscroll = () => {
    const width = els.carousel.clientWidth;
    const index = Math.round(els.carousel.scrollLeft / width);
    els.photoCounter.textContent = `${index + 1} / ${imgs.length}`;
  };

  // Текст
  els.modalTitle.textContent = p.title;
  els.modalBrandSeason.textContent = `${p.brand} • ${p.season || ''}`;
  els.modalPrice.textContent = `${p.price} ₽`;
  els.modalDesc.textContent = p.description || '';

  // Размеры
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

  // Добавление в корзину
  els.addToCartBtn.onclick = () => {
    const qty = Math.max(1, Number(els.modalQty.value || 1));
    if (!selectedSize) selectedSize = (p.sizes || [])[0];

    const order = {
      items: [{
        id: p.id,
        title: p.title,
        brand: p.brand,
        size: selectedSize,
        qty,
        price: p.price
      }],
      total: p.price * qty,
      ts: new Date().toISOString()
    };

    fetch('/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    }).then(() => {
      tg && tg.showPopup({
        title: "Заказ",
        message: "Товар добавлен!",
        buttons: [{ type: "ok" }]
      });
    });
  };
}
