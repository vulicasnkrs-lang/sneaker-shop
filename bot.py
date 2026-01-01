import logging
import os
import asyncio
import json
from aiogram import Bot, Dispatcher, executor, types
from aiohttp import web

logging.basicConfig(level=logging.INFO)

# --- Telegram Bot ---
BOT_TOKEN = os.getenv("BOT_TOKEN")
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

@dp.message_handler(commands=["start"])
async def start(message: types.Message):
    # Только приветствие, без лишних кнопок
    await message.answer("Добро пожаловать в vulica.SNKRS!")

@dp.message_handler(content_types=["web_app_data"])
async def web_app_handler(message: types.Message):
    try:
        data = json.loads(message.web_app_data.data)
        if data.get("action") == "order":
            cart = data.get("cart", [])
            total = data.get("total", 0)

            if not cart:
                await message.answer("Корзина пуста.")
                return

            summary = "\n".join(
                f"• {item['name']} — {item['price']} BYN ({item['size']})"
                for item in cart
            )

            username = message.from_user.username or message.from_user.first_name
            reply = (
                f"🛒 Заказ от @{username}:\n"
                f"{summary}\n\n"
                f"Итого: {total} BYN"
            )

            await message.answer(reply)
    except Exception as e:
        logging.exception("Ошибка при обработке WebApp данных")

# --- WebApp сервер ---
async def index(request):
    return web.FileResponse(path=os.path.join("webapp", "index.html"))

app = web.Application()
app.router.add_get("/", index)
app.router.add_static("/static/", path="webapp", name="static")

async def start_webapp():
    port = int(os.getenv("PORT", 10000))
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logging.info(f"WebApp запущен на порту {port}")

# --- Main ---
if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    # Запускаем WebApp сервер
    loop.create_task(start_webapp())

    # Сбрасываем старые апдейты
    loop.run_until_complete(bot.delete_webhook(drop_pending_updates=True))

    # Запускаем бота
    try:
        executor.start_polling(dp)
    finally:
        loop.close()
