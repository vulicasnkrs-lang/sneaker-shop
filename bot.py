import os
import json
from aiohttp import web
from aiogram import Bot, Dispatcher, types
from aiogram.utils.executor import start_webhook
from dotenv import load_dotenv

# ======================
# Настройки
# ======================
load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID = int(os.getenv("ADMIN_ID"))
WEBAPP_URL = os.getenv("RENDER_EXTERNAL_URL")  # URL твоего Render проекта

if not BOT_TOKEN or not ADMIN_ID or not WEBAPP_URL:
    raise ValueError("Не заданы BOT_TOKEN, ADMIN_ID или WEBAPP_URL в .env")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

# ======================
# Webhook
# ======================
WEBHOOK_PATH = f"/webhook/{BOT_TOKEN}"
WEBHOOK_URL = f"{WEBAPP_URL}{WEBHOOK_PATH}"
WEBAPP_HOST = "0.0.0.0"
WEBAPP_PORT = int(os.environ.get("PORT", 10000))

# ======================
# Обработчики бота
# ======================
@dp.message_handler(commands=["start"])
async def start(msg: types.Message):
    keyboard = types.InlineKeyboardMarkup()
    keyboard.add(
        types.InlineKeyboardButton(
            text="Открыть магазин 👟",
            web_app=types.WebAppInfo(url=f"{WEBAPP_URL}/webapp/index.html")
        )
    )
    await msg.answer("Открой каталог 👇", reply_markup=keyboard)

@dp.message_handler(content_types=types.ContentType.WEB_APP_DATA)
async def handle_order(msg: types.Message):
    data = json.loads(msg.web_app_data.data)
    user = data.get("user", {})
    text = (
        "🆕 НОВЫЙ ЗАКАЗ\n\n"
        f"👤 Клиент: {user.get('first_name', '')}\n"
        f"🔗 Username: @{user.get('username', '')}\n\n"
        "📦 Товары:\n"
    )
    for item in data.get("items", []):
        text += f"• {item['title']} — {item['price']} BYN\n"
    text += f"\n💰 Итого: {data.get('total', 0)} BYN"
    await bot.send_message(ADMIN_ID, text)
    await msg.answer("✅ Заказ отправлен! Мы свяжемся с вами в Telegram.")

# ======================
# Healthcheck
# ======================
async def health(request):
    return web.Response(text="OK")

# ======================
# Aiohttp приложение для статики
# ======================
app = web.Application()
app.router.add_get("/", health)
app.router.add_static("/webapp", path="./webapp", name="webapp")

# ======================
# Startup / Shutdown webhook
# ======================
async def on_startup(dp):
    await bot.set_webhook(WEBHOOK_URL)
    print(f"Webhook установлен: {WEBHOOK_URL}")

async def on_shutdown(dp):
    await bot.delete_webhook()
    await bot.session.close()
    print("Webhook удалён и сессия закрыта")

# ======================
# Запуск
# ======================
if __name__ == "__main__":
    start_webhook(
        dispatcher=dp,
        webhook_path=WEBHOOK_PATH,
        on_startup=on_startup,
        on_shutdown=on_shutdown,
        host=WEBAPP_HOST,
        port=WEBAPP_PORT,
        app=app  # для aiogram 2.x
    )
