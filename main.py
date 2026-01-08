import os
import asyncio
import logging
from aiohttp import web
from bot.bot import run_bot

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("vulica.main")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, "webapp")

async def index(request):
    return web.FileResponse(os.path.join(WEB_DIR, "index.html"))

async def create_app():
    app = web.Application()
    app.router.add_get("/", index)
    app.router.add_static("/", WEB_DIR)
    return app

async def run_web():
    app = await create_app()
    port = int(os.getenv("PORT", "10000"))
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host="0.0.0.0", port=port)
    await site.start()
    log.info(f"WebApp доступен на порту {port}")
    # держим сервер живым
    while True:
        await asyncio.sleep(3600)

async def main():
    # Запускаем и бота, и веб-сервер параллельно
    await asyncio.gather(
        run_bot(),
        run_web()
    )

if __name__ == "__main__":
    asyncio.run(main())
