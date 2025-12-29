import logging
import asyncio
import os
from aiogram import Bot, Dispatcher, executor, types
from aiohttp import web

logging.basicConfig(level=logging.INFO)

BOT_TOKEN = os.getenv("BOT_TOKEN")
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

@dp.message_handler(commands=["start", "help"])
async def send_welcome(message: types.Message):
    await message.reply("Привет! Бот работает на Render 🚀")

# --- HTTP-сервер для Render ---
async def handle(request):
    return web.Response(text="Bot is running")

app = web.Application()
app.router.add_get("/", handle)

async def main():
    # Запускаем aiogram-поллинг в фоне
    asyncio.create_task(executor.start_polling(dp, skip_updates=True))

    # Берём порт из переменной окружения (Render его задаёт автоматически)
    port = int(os.getenv("PORT", 10000))

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()

    # Держим процесс живым
    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    asyncio.run(main())
