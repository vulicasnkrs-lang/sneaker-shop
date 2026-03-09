const fs = require("fs");
const path = require("path");

// 1) Читаем products.json
const productsPath = path.join(__dirname, "static/products.json");
const raw = fs.readFileSync(productsPath, "utf8");
const products = JSON.parse(raw);

// 2) Папка, куда будем класть HTML-страницы
const outDir = path.join(__dirname, "share/product");

// 3) Создаём папку, если её нет
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 4) Экранирование для HTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// 5) Генерируем HTML для каждого товара
products.forEach((p) => {
  const id = p.id;                 // например "asics-gel-pickax"
  const title = escapeHtml(p.title); // "Asics GEL-PICKAX"
  const price = `${p.price} BYN`;    // "190 BYN"

  // Берём первую картинку товара
  const image = p.images?.[0]
    ? `https://vulica.snk.rs${p.images[0]}`
    : "https://vulica.snk.rs/static/images/default.jpg";

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- OG-теги для Telegram / соцсетей -->
  <meta property="og:title" content="${title} — ${price}">
  <meta property="og:description" content="Оригинальная пара. Доставка по РБ.">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="https://vulica.snk.rs/share/product/${id}.html">
  <meta name="twitter:card" content="summary_large_image">

  <title>${title}</title>
</head>
<body>

<script>
  // Редирект в WebApp с передачей id товара
  location.href = "https://t.me/vulicaSNKRS_bot?startapp=${id}";
</script>

</body>
</html>`;

  const filePath = path.join(outDir, `${id}.html`);
  fs.writeFileSync(filePath, html, "utf8");

  console.log("✔ Создано:", filePath);
});

console.log("Готово! Все share-страницы созданы.");
