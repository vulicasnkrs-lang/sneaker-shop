import logging
import os
import asyncio
from aiogram import Bot, Dispatcher, executor, types
from aiohttp import web

logging.basicConfig(level=logging.INFO)

BOT_TOKEN = os.getenv("BOT_TOKEN")

# создаём новый event loop
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

bot = Bot(token=BOT_TOKEN, loop=loop)
dp = Dispatcher(bot)

# --- Хэндлер /start с кнопкой WebApp ---
@dp.message_handler(commands=["start"])
async def start(message: types.Message):
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True)
    web_app_button = types.KeyboardButton(
        text="Открыть магазин 👟",
        web_app=types.WebAppInfo(url="https://sneaker-shop-r7fa.onrender.com")
    )
    keyboard.add(web_app_button)

    await message.answer(
        "Добро пожаловать в vulica.SNKRS!\nОткрой магазин прямо в Telegram:",
        reply_markup=keyboard
    )

# --- Обработчик данных из WebApp ---
@dp.message_handler(content_types=["web_app_data"])
async def web_app_handler(message: types.Message):
    data = message.web_app_data.data
    await message.answer(f"Получены данные из WebApp: {data}")

# --- HTTP-сервер для Render ---
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

async def main():
    # Запускаем веб-сервер
    await start_webapp()

    # Сбрасываем webhook, чтобы polling работал
    await bot.delete_webhook(drop_pending_updates=True)

    # Запускаем aiogram-поллинг
    executor.start_polling(dp, skip_updates=True)

if __name__ == "__main__":
    try:
        loop.run_until_complete(main())
    except (KeyboardInterrupt, SystemExit):
        logging.info("Бот остановлен")
