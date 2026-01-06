from aiohttp import web
from aiogram import Bot, Dispatcher
from app.config import BOT_TOKEN, PORT
from app.bot import register_bot
from app.api import create_order

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

register_bot(dp)

app = web.Application()
app["bot"] = bot

dp.setup_aiohttp(app)

app.router.add_post("/api/order", create_order)
app.router.add_static("/", path="webapp", show_index=True)

if __name__ == "__main__":
    web.run_app(app, host="0.0.0.0", port=PORT)
