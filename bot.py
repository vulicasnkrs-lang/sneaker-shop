import os
import json
from aiohttp import web
from aiogram import Bot, Dispatcher, types

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID = int(os.getenv("ADMIN_ID"))
WEBAPP_URL = os.getenv("RENDER_EXTERNAL_URL")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)


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


async def health(request):
    return web.Response(text="OK")


app = web.Application()
dp.setup_aiohttp(app)
app.router.add_get("/", health)

if __name__ == "__main__":
    web.run_app(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000))
    )
