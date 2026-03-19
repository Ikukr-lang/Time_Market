import asyncio
import os
import logging
import hmac
import hashlib
from urllib.parse import parse_qs

from aiogram import Bot, Dispatcher
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.filters import Command
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from aiohttp import web
import aiohttp_jinja2
import jinja2

from config import BOT_TOKEN, WEBAPP_SECRET, BASE_URL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

WEBHOOK_PATH = "/telegram-webhook"
WEBHOOK_URL = f"{BASE_URL}{WEBHOOK_PATH}"

# Проверка initData (Telegram Web App auth)
def validate_init_data(init_data_str: str) -> dict | None:
    try:
        params = parse_qs(init_data_str)
        hash_value = params.pop('hash', [''])[0]
        if not hash_value:
            return None

        data_check_string = '\n'.join(f"{k}={v[0]}" for k, v in sorted(params.items()))
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if calculated == hash_value:
            user_data = json.loads(params.get('user', ['{}'])[0])
            return user_data
        return None
    except Exception as e:
        logger.error(f"InitData validation error: {e}")
        return None

# ── Bot handlers ──

@dp.message(Command("start"))
async def cmd_start(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="Открыть маркетплейс",
            web_app=WebAppInfo(url=f"{BASE_URL}/")
        )
    ]])
    await message.answer(
        "Добро пожаловать в маркетплейс записи к специалистам!\n\n"
        "Нажмите кнопку ниже, чтобы открыть приложение:",
        reply_markup=keyboard
    )

# ── API endpoints для Mini App ──

async def api_companies(request):
    # TODO: из базы данных
    data = [
        {"id": 1, "name": "Салон Красоты VIP", "rating": 4.8, "specialists": 5},
        {"id": 2, "name": "Автосервис Master", "rating": 4.6, "specialists": 3},
    ]
    return web.json_response({"companies": data})

async def api_book(request):
    data = await request.json()
    init_data = data.get("initData")
    user = validate_init_data(init_data)
    if not user:
        return web.json_response({"error": "Invalid authentication"}, status=403)

    # TODO: сохранить запись в БД
    logger.info(f"Booking from user {user.get('id')}: {data.get('booking')}")

    return web.json_response({"success": True, "message": "Запись создана!"})

# ── Mini App главная страница ──

@aiohttp_jinja2.template("index.html")
async def mini_app_page(request):
    return {"base_url": BASE_URL}

def create_app():
    app = web.Application()

    aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader("templates"))

    # Статические файлы
    app.router.add_static("/static/", path="static", name="static")

    # Страницы и API
    app.router.add_get("/", mini_app_page)
    app.router.add_get("/api/companies", api_companies)
    app.router.add_post("/api/book", api_book)

    # Telegram webhook
    webhook_handler = SimpleRequestHandler(dispatcher=dp, bot=bot)
    webhook_handler.register(app, path=WEBHOOK_PATH)

    setup_application(app, dp, bot=bot)

    return app

async def on_startup():
    await bot.set_webhook(WEBHOOK_URL)
    logger.info(f"Webhook установлен: {WEBHOOK_URL}")

async def main():
    app = create_app()

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", int(os.getenv("PORT", 10000)))
    await site.start()

    logger.info(f"Сервер запущен → {BASE_URL}")

    await on_startup()
    await asyncio.Event().wait()  # бесконечный цикл

if __name__ == "__main__":
    asyncio.run(main())
