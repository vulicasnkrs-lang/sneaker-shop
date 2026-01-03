import os
import json
from aiohttp import web
from aiogram import Bot, Dispatcher, types
from aiogram.utils.executor import start_webhook
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID = int(os.getenv("ADMIN_ID"))
WEBAPP_URL = os.getenv("RENDER_EXTERNAL_URL")

if not BOT_TOKEN or not ADMIN_ID or not WEBAPP_URL:
    raise ValueError("Не заданы BOT_TOKEN, ADMIN_ID или WEBAPP_URL в .env")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

# Webhook
WEBHOOK_PATH = f"/webhook/{BOT_TOKEN}"
WEBHOOK_URL = f"{WEBAPP_URL}{WEBHOOK_PATH}"

# ======================
# Обработчики
# ======================

@dp.message_handler(commands=["start"])
async def start(msg: types.Message):
    keyboard = types.InlineKeyboardMarkup()
    keyboard.add(
        types.InlineKeyboardButton(
            text="Открыть магазин 👟",
            web_app=types.WebAppInfo(url=WEBAPP_URL)
        )
    )
    await msg.answer("Открой каталог 👇", reply_markup=keyboard)

@dp.message_handler(content_types=types.ContentType.WEB_APP_DATA)
async def handle_order(msg: types.Message):
    data = json.loads(msg.web_app_data.data)

    text = (
        "🆕 НОВЫЙ ЗАКАЗ\n\n"
        f"👤 Клиент: {data['user'].get('first_name')}\n"
        f"🔗 Username: @{data['user'].get('username')}\n\n"
        "📦 Товары:\n"
    )

    for item in data["items"]:
        text += f"• {item['title']} — {item['price']} BYN\n"

    await bot.send_message(ADMIN_ID, text)
    await msg.answer("✅ Заказ отправлен! Мы свяжемся с вами в Telegram.")

# ======================
# Healthcheck
# ======================

async def health(request):
    return web.Response(text="OK")

# ======================
# Webhook startup/shutdown
# ======================

async def on_startup(app):
    await bot.set_webhook(WEBHOOK_URL)
    print(f"Webhook установлен: {WEBHOOK_URL}")

async def on_shutdown(app):
    await bot.delete_webhook()
    await bot.session.close()
    print("Webhook удалён и сессия закрыта")

# ======================
# Aiohttp приложение
# ======================

app = web.Application()
app.router.add_get("/", health)  # healthcheck

# ======================
# Запуск webhook
# ======================

if __name__ == "__main__":
    start_webhook(
        dispatcher=dp,
        webhook_path=WEBHOOK_PATH,
        on_startup=on_startup,
        on_shutdown=on_shutdown,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000)),
        app=app,
    )
