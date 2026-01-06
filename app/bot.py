# app/bot.py

import os
from fastapi import FastAPI, Request
from aiogram import Bot, Dispatcher, types
from config import BOT_TOKEN, BASE_URL

# Создаём FastAPI приложение
app = FastAPI()

# Инициализируем бота и диспетчер
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

# ==========================
# Обработчик команды /start
# ==========================
@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/webhook")
async def webhook(request: Request):
    update = await request.json()
    await dp.process_update(update)
    return {"status": "ok"}

# ==========================
# Установка вебхука при старте
# ==========================
@app.on_event("startup")
async def on_startup():
    WEBHOOK_URL = f"{BASE_URL}/webhook"
    await bot.set_webhook(WEBHOOK_URL)
    print(f"Webhook установлен: {WEBHOOK_URL}")

@app.on_event("shutdown")
async def on_shutdown():
    await bot.delete_webhook()
    await bot.session.close()

# ==========================
# Запуск FastAPI с Uvicorn
# ==========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  # Render автоматически даст порт
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)
