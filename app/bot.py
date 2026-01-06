from aiogram import Dispatcher, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from .config import WEBAPP_URL

def register_bot(dp: Dispatcher):

    @dp.message_handler(commands=["start"])
    async def start(message: types.Message):
        kb = InlineKeyboardMarkup()
        kb.add(
            InlineKeyboardButton(
                text="Открыть магазин 👟",
                web_app=types.WebAppInfo(url=WEBAPP_URL)
            )
        )
        await message.answer(
            "Добро пожаловать в магазин кроссовок 👟",
            reply_markup=kb
        )
