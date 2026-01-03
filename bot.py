import json
from telebot import TeleBot, types

TOKEN = "BOT_TOKEN"
PAY_TOKEN = "PAYMENT_PROVIDER_TOKEN"

bot = TeleBot(TOKEN)

@bot.message_handler(commands=['start'])
def start(msg):
    kb = types.InlineKeyboardMarkup()
    kb.add(types.InlineKeyboardButton(
        text="Открыть магазин 👟",
        web_app=types.WebAppInfo(url="https://YOUR-RENDER-URL.onrender.com")
    ))
    bot.send_message(msg.chat.id, "Добро пожаловать!", reply_markup=kb)

@bot.message_handler(content_types=['web_app_data'])
def pay(msg):
    cart = json.loads(msg.web_app_data.data)

    bot.send_invoice(
        msg.chat.id,
        title="Оплата заказа",
        description="Кроссовки",
        payload="order",
        provider_token=PAY_TOKEN,
        currency="BYN",
        prices=[types.LabeledPrice("Товары", 10000)]
    )

bot.infinity_polling()
