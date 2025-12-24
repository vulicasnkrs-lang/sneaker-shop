from aiogram import Bot, Dispatcher, types
from aiogram.utils import executor
import os

BOT_TOKEN = os.getenv("BOT_TOKEN")
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

@dp.message_handler(content_types=types.ContentType.WEB_APP_DATA)
async def web_app_data_handler(message: types.Message):
    data = message.web_app_data.data
    await message.answer(f"🛒 Получен заказ:\n{data}")

if __name__ == "__main__":
    executor.start_polling(dp, skip_updates=True)
# Фейковый HTTP-сервер для Render
from aiohttp import web

async def handle(request):
    return web.Response(text="Bot is running")

app = web.Application()
app.router.add_get("/", handle)

if __name__ == "__main__":
    web.run_app(app, port=10000)
