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
async def start(message: types.Message):
    kb = types.InlineKeyboardMarkup()
    kb.add(
        types.InlineKeyboardButton(
            text="Открыть магазин 👟",
            web_app=types.WebAppInfo(url=WEBAPP_URL + "/web/index.html")
        )
    )
    await message.answer("Добро пожаловать в магазин 👇", reply_markup=kb)


@dp.message_handler(content_types=types.ContentType.WEB_APP_DATA)
async def handle_order(message: types.Message):
    order = json.loads(message.web_app_data.data)

    text = (
        "🆕 НОВЫЙ ЗАКАЗ\n\n"
        f"👤 {order['user']['first_name']} (@{order['user'].get('username')})\n\n"
        "📦 Товары:\n"
    )

    for item in order["items"]:
        text += f"• {item['title']} — {item['price']} BYN\n"

    await bot.send_message(ADMIN_ID, text)
    await message.answer("✅ Заказ отправлен! Мы свяжемся с вами.")


app = web.Application()
dp.setup_aiohttp(app)

if __name__ == "__main__":
    web.run_app(app, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
