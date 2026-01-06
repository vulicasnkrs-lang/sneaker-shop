# app/bot.py

import os
from aiohttp import web
from aiogram import Bot, Dispatcher, types
from config import BOT_TOKEN, BASE_URL

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

# ==========================
# Обработчик команды /start
# ==========================
@dp.message_handler(commands=["start"])
async def start(message: types.Message):
    kb = types.InlineKeyboardMarkup()
    kb.add(
        types.InlineKeyboardButton(
            text="Открыть магазин 👟",
            web_app=types.InlineKeyboardButton.WebAppInfo(
                url=f"{BASE_URL}/web/index.html"
            )
        )
    )
    await message.answer("Добро пожаловать в магазин 👇", reply_markup=kb)

# ==========================
# Webhook-сервер на aiohttp
# ==========================
WEBHOOK_PATH = "/webhook"
WEBHOOK_URL = f"{BASE_URL}{WEBHOOK_PATH}"

async def handle(request):
    update = await request.json()
    await dp.process_update(update)
    return web.Response(text="OK")

app = web.Application()
app.router.add_post(WEBHOOK_PATH, handle)

# ==========================
# Установка вебхука при старте
# ==========================
async def on_startup(app):
    await bot.set_webhook(WEBHOOK_URL)
    print(f"Webhook установлен: {WEBHOOK_URL}")

async def on_shutdown(app):
    await bot.delete_webhook()
    await bot.session.close()

app.on_startup.append(on_startup)
app.on_cleanup.append(on_shutdown)

# ==========================
# Запуск aiohttp
# ==========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Сервер слушает порт {port}")
    web.run_app(app, port=port)
