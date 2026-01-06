import json
from aiohttp import web
from aiogram import Bot
from .config import ADMIN_ID

async def create_order(request: web.Request):
    bot: Bot = request.app["bot"]

    data = await request.json()

    text = (
        "🆕 НОВЫЙ ЗАКАЗ\n\n"
        f"👤 Имя: {data['user'].get('first_name')}\n"
        f"🔗 Username: @{data['user'].get('username')}\n\n"
        "📦 Товары:\n"
    )

    for item in data["items"]:
        text += f"• {item['title']} — {item['price']} BYN\n"

    await bot.send_message(ADMIN_ID, text)

    return web.json_response({"status": "ok"})
