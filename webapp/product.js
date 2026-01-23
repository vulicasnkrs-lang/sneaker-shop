/* Telegram */
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

/* Root element */
const root = document.getElementById('productRoot');

/* Init */
init();

async function init() {
  if (tg) tg.expand();

  // Получаем ID товара из URL
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  // Загружаем товары
  let products = [];
  try {
    const res = await fetch('/products.json', { cache: 'no-store' });
    products = await res.json();
  } catch (e) {
    root.textContent = 'Ошибка загрузки товара';
    return;
  }

  const p = products.find(x => String(x.id) === String(id));

  if (!p) {
    root.textContent = 'Товар не найден';
    return;
  }

  renderProduct(p);

  // Включаем системную кнопку Telegram "Назад"
  if (tg) {
    tg.BackButton.show();
    tg.BackButton.onClick(() => {
      tg.close(); // Возвращает в каталог
    });
  }
}

/* Render product */
function renderProduct(p) {
  const cover = (p.images && p.images[0]) || '';
  const price = `${p.price} ₽`;

  root.innerHTML = `
    <div class="modal open" style="opacity:1; pointer-events:auto; position:relative;">
      <div class="modal-content">

        <div class="modal-images">
          <img src="${cover}" alt="${p.title}" style="width:100%; height:100%; object-fit:contain;">
        </div>

        <div class="modal-info">
          <h2>${p.title}</h2>
          <div class="modal-meta">${p.brand} • ${p.season || ''}</div>
          <div class="modal-price">${price}</div>

          <p class="modal-desc">${p.description || ''}</p>

          <div class="modal-sizes">
            ${(p.sizes || []).map(s => `
              <button class="size">${s}</button>
            `).join('')}
          </div>

          <div class="modal-qty">
            <input id="qtyInput" type="number" value="1" min="1" />
          </div>

          <button id="addBtn" class="primary full-width">Добавить в корзину</button>
        </div>

      </div>
    </div>
  `;

  // Логика выбора размера
  const sizeBtns = root.querySelectorAll('.size');
  let selectedSize = null;

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.textContent;
    });
  });

  // Логика добавления в корзину
  const addBtn = document.getElementById('addBtn');
  addBtn.addEventListener('click', () => {
    const qty = Math.max(1, Number(document.getElementById('qtyInput').value || 1));
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

    // Отправляем заказ в backend
    fetch('/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    }).then(() => {
      tg && tg.showPopup({
        title: "Заказ",
        message: "✅ Товар добавлен!",
        buttons: [{ type: "ok" }]
      });
    });
  });
}
