import os
import asyncio
import logging
from aiohttp import web
from bot.bot import run_bot, bot, ADMIN_CHAT_ID  # важно: импортируем bot и ADMIN_CHAT_ID

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("vulica.main")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, "webapp")

# -----------------------------
# 1) Главная страница WebApp
# -----------------------------
async def index(request):
    return web.FileResponse(os.path.join(WEB_DIR, "index.html"))

# -----------------------------
# 2) Обработчик заказа /order
# -----------------------------
async def order_handler(request):
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"status": "error", "msg": "invalid json"}, status=400)

    # Формируем сообщение админу
    lines = []
    lines.append("🛒 Новый заказ в vulica.SNKRS")
    lines.append("")
    total = data.get("total", 0)
    lines.append(f"💰 Итого: {total} ₽")
    lines.append(f"🕒 Время: {data.get('ts', '')}")
    lines.append("")

    for i, item in enumerate(data.get("items", []), start=1):
        lines.append(f"{i}) {item['title']} • {item['brand']} • {item['season']}")
        lines.append(f"   Размер: {item['size']}  Кол-во: {item['qty']}  Цена: {item['price']} ₽")

    admin_msg = "\n".join(lines)

    # Отправляем админу
    try:
        await bot.send_message(chat_id=ADMIN_CHAT_ID, text=admin_msg)
    except Exception as e:
        log.exception("Ошибка отправки админу")

    return web.json_response({"status": "ok"})

# -----------------------------
# 3) Создание приложения
# -----------------------------
async def create_app():
    app = web.Application()
    app.router.add_get("/", index)
    app.router.add_post("/order", order_handler)  # <-- ДОБАВЛЕНО
    app.router.add_static("/", WEB_DIR)
    return app

# -----------------------------
# 4) Запуск веб-сервера
# -----------------------------
async def run_web():
    app = await create_app()
    port = int(os.getenv("PORT", "10000"))
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host="0.0.0.0", port=port)
    await site.start()
    log.info(f"WebApp доступен на порту {port}")

    while True:
        await asyncio.sleep(3600)

# -----------------------------
# 5) Запуск бота + веба
# -----------------------------
async def main():
    await asyncio.gather(
        run_bot(),
        run_web()
    )

if __name__ == "__main__":
    asyncio.run(main())
