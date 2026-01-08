import os
import json
import asyncio
import logging
from aiogram import Bot, Dispatcher, F, types
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart

BOT_TOKEN = os.getenv("BOT_TOKEN", "8300602711:AAFRLntEhgV6Rep6six2vzge6_qY7DpK8og")
ADMIN_CHAT_ID = int(os.getenv("ADMIN_CHAT_ID", "1426577785"))
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://sneaker-shop-r7fa.onrender.com/index.html")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("vulica.bot")

bot = Bot(BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher()

def webapp_keyboard():
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(types.KeyboardButton(text="Открыть vulica.SNKRS", web_app=types.WebAppInfo(url=WEBAPP_URL)))
    return kb

@dp.message(CommandStart())
async def cmd_start(m: types.Message):
    await m.answer(
        "Привет! Добро пожаловать в vulica.SNKRS 👟 Жми «Открыть vulica.SNKRS» и оформляй заказ прямо в Telegram.",
        reply_markup=webapp_keyboard()
    )

@dp.message(F.web_app_data)
async def on_webapp_data(m: types.Message):
    # Логируем сырые данные для диагностики
    log.info(f"RAW DATA: {m.web_app_data.data}")

    try:
        data = json.loads(m.web_app_data.data)
    except Exception:
        log.exception("Некорректные данные из WebApp")
        await m.answer("Ошибка чтения заказа. Попробуйте ещё раз.")
        return

    # Формируем сообщение
    lines = []
    lines.append("🛒 Новый заказ в vulica.SNKRS")
    lines.append(f"👤 Пользователь: @{m.from_user.username or '—'} (ID: {m.from_user.id})")
    lines.append("")
    total = data.get("total", 0)
    promo = data.get("promoCode")
    promoPct = data.get("promoDiscountPct", 0)
    for i, item in enumerate(data.get("items", []), start=1):
        lines.append(f"{i}) {item['title']} • {item['brand']} • {item['season']}")
        lines.append(f"   Размер: {item['size']}  Кол-во: {item['qty']}  Цена: {item['price']} ₽")
    lines.append("")
    if promo and promoPct:
        lines.append(f"🎟 Промокод: {promo} (−{promoPct}%)")
    lines.append(f"💰 Итого: {total} ₽")
    lines.append(f"🕒 Время: {data.get('ts', '')}")

    admin_msg = "\n".join(lines)

    # Отправляем админу
    if ADMIN_CHAT_ID:
        try:
            await bot.send_message(chat_id=ADMIN_CHAT_ID, text=admin_msg)
        except Exception:
            log.exception("Не удалось отправить сообщение админу")

    # Подтверждаем пользователю
    await m.answer("✅ Заказ получен! Спасибо за покупку в vulica.SNKRS 👟")

async def run_bot():
    log.info("Запуск бота vulica.SNKRS...")
    await dp.start_polling(bot)
