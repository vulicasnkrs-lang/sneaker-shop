from aiogram import Bot, Dispatcher
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from app.config import BOT_TOKEN, ADMIN_ID  # <- абсолютный импорт

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

async def start(message):
    """Обработчик команды /start"""
    kb = InlineKeyboardMarkup()
    kb.add(
        InlineKeyboardButton(
            text="Открыть магазин 👟",
            web_app=InlineKeyboardButton.WebAppInfo(
                url="https://your-app.onrender.com/web/index.html"
            )
        )
    )
    await message.answer("Добро пожаловать в магазин 👇", reply_markup=kb)

# ==========================
# Запуск бота (если нужно)
# ==========================
if __name__ == "__main__":
    import asyncio
    from aiogram import executor
    from aiogram.dispatcher.filters import Command

    # Регистрируем команду /start
    @dp.message_handler(commands=["start"])
    async def cmd_start(message):
        await start(message)

    # Запускаем бота
    asyncio.run(dp.start_polling())
