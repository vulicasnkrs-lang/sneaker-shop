import os
import json
import logging
from aiohttp import web
from aiogram import Bot, Dispatcher, F, types
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
import asyncio

# -----------------------------------
# Конфигурация
# -----------------------------------
BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_CHAT_ID = int(os.getenv("ADMIN_CHAT_ID", "1426577785"))

# URL WebApp — обязательно чистим от переносов/пробелов
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://sneaker-shop-r7fa.onrender.com").strip()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
log = logging.getLogger("vulica.bot")

bot = Bot(BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher()

# -----------------------------------
# Команда /start
# -----------------------------------
@dp.message(CommandStart())
async def cmd_start(m: types.Message):

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть магазин 👟",
                    web_app=WebAppInfo(url=WEBAPP_URL)
                )
            ]
        ]
    )

    await m.answer(
        "👟 Добро пожаловать в vulica.SNKRS!\n"
        "Нажми кнопку ниже, чтобы открыть магазин.",
        reply_markup=kb
    )

# -----------------------------------
# Обработка данных из WebApp
# -----------------------------------
@dp.message(F.web_app_data)
async def on_webapp_data(m: types.Message):
    log.info(f"RAW DATA: {m.web_app_data.data}")

    try:
        data = json.loads(m.web_app_data.data)
    except Exception:
        log.exception("Некорректные данные из WebApp")
        await m.answer("Ошибка чтения заказа. Попробуйте ещё раз.")
        return

    # Формируем сообщение админу
    lines = []
    lines.append("🛒 Новый заказ в vulica.SNKRS")
    lines.append(f"👤 Пользователь: @{m.from_user.username or '—'} (ID: {m.from_user.id})")
    lines.append("")

    total = data.get("total", 0)
    promo = data.get("promoCode")
    promoPct = data.get("promoDiscountPct", 0)

    for i, item in enumerate(data.get("items", []), start=1):
        lines.append(f"{i}) {item['title']} • {item['brand']} • {item.get('season', '')}")
        lines.append(
            f"   Размер: {item['size']}  Кол-во: {item['qty']}  Цена: {item['price']} ₽"
        )

    lines.append("")
    if promo and promoPct:
        lines.append(f"🎟 Промокод: {promo} (−{promoPct}%)")

    lines.append(f"💰 Итого: {total} ₽")
    lines.append(f"🕒 Время: {data.get('ts', '')}")

    admin_msg = "\n".join(lines)

    # Отправляем админу
    try:
        await bot.send_message(chat_id=ADMIN_CHAT_ID, text=admin_msg)
    except Exception:
        log.exception("Не удалось отправить сообщение админу")

    # Подтверждаем пользователю
    await m.answer("✅ Заказ получен! Спасибо за покупку в vulica.SNKRS 👟")

# -----------------------------------
# Webhook обработчик
# -----------------------------------
async def process_update(request):
    data = await request.json()
    update = types.Update(**data)
    await dp.feed_update(bot, update)
    return web.Response(text="OK")

# -----------------------------------
# Подключение маршрута webhook
# -----------------------------------
def setup_webhook_routes(app):
    app.router.add_post("/webhook", process_update)

# -----------------------------------
# Установка webhook при старте
# -----------------------------------
async def run_bot():
    clean_url = WEBAPP_URL.strip()
    webhook_url = f"{clean_url}/webhook"
    log.info(f"Устанавливаем webhook: {webhook_url}")
    await bot.set_webhook(webhook_url)

    # 🔥 ВАЖНО: бот должен оставаться живым, иначе Render завершит процесс
    while True:
        await asyncio.sleep(3600)
