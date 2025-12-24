import logging
import asyncio
from aiogram import Bot, Dispatcher, executor, types
from aiohttp import web
import os

# Включаем логирование
logging.basicConfig(level=logging.INFO)

# Получаем токен из переменных окружения
BOT_TOKEN = os.getenv("BOT_TOKEN")
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

# Простейший хэндлер
@dp.message_handler(commands=["start", "help"])
async def send_welcome(message: types.Message):
    await message.reply("Привет! Бот работает на Render 🚀")

# --- Фейковый HTTP-сервер для Render ---
async def handle(request):
    return web.Response(text="Bot is running")

app = web.Application()
app.router.add_get("/", handle)

# --- Запуск ---
if __name__ == "__main__":
    loop = asyncio.get_event_loop()

    # Запускаем aiogram-поллинг в фоне
    loop.create_task(executor.start_polling(dp, skip_updates=True))

    # Запускаем HTTP-сервер на порту 10000
    web.run_app(app, port=10000)
