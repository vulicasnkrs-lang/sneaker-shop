from aiogram import Bot, Dispatcher
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from .config import BOT_TOKEN, ADMIN_ID

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

async def start(message):
    kb = InlineKeyboardMarkup()
    kb.add(InlineKeyboardButton(
        text="Открыть магазин 👟",
        web_app=InlineKeyboardButton.WebAppInfo(url="https://your-app.onrender.com/web/index.html")
    ))
    await message.answer("Добро пожаловать в магазин 👇", reply_markup=kb)
