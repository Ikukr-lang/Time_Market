import asyncio
import os
import logging
import hmac
import hashlib
import json
from urllib.parse import parse_qs

from aiogram import Bot, Dispatcher
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.filters import Command
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from aiohttp import web
import aiohttp_jinja2
import jinja2

from config import BOT_TOKEN, BASE_URL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# === IN-MEMORY ХРАНИЛИЩЕ ===
companies = {}          # company_id → данные компании
user_companies = {}     # telegram_id → список company_id
company_counter = 1

# ── Проверка initData ──
def validate_init_data(init_data_str: str):
    try:
        params = parse_qs(init_data_str)
        hash_value = params.pop('hash', [''])[0]
        data_check_string = '\n'.join(f"{k}={v[0]}" for k, v in sorted(params.items()))
        secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        if hmac.new(secret, data_check_string.encode(), hashlib.sha256).hexdigest() == hash_value:
            return json.loads(params.get('user', ['{}'])[0])
    except:
        pass
    return None

# ── Bot start ──
@dp.message(Command("start"))
async def cmd_start(message: Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="Открыть приложение", web_app=WebAppInfo(url=BASE_URL))
    ]])
    await message.answer("Добро пожаловать! Откройте маркетплейс:", reply_markup=kb)

# ── API ──
async def api_my_companies(request):
    data = await request.json()
    user = validate_init_data(data.get("initData"))
    if not user: return web.json_response({"companies": []})
    ids = user_companies.get(user["id"], [])
    return web.json_response({"companies": [companies.get(cid, {}) for cid in ids]})

async def api_create_company(request):
    global company_counter
    data = await request.json()
    user = validate_init_data(data.get("initData"))
    if not user: return web.json_response({"error": "Не авторизован"}, status=403)

    cid = company_counter
    company_counter += 1

    companies[cid] = {
        "id": cid,
        "owner_id": user["id"],
        "name": data["name"],
        "photo": data.get("photo"),
        "description": data.get("description", ""),
        "address": data.get("address", ""),
        "specialists": [],
        "services": []
    }
    user_companies.setdefault(user["id"], []).append(cid)
    return web.json_response({"success": True, "company_id": cid})

async def api_add_specialist(request):
    data = await request.json()
    user = validate_init_data(data.get("initData"))
    cid = data["company_id"]
    if cid not in companies or companies[cid]["owner_id"] != user["id"]:
        return web.json_response({"error": "Нет доступа"}, status=403)

    companies[cid]["specialists"].append({
        "name": data["name"],
        "surname": data.get("surname", ""),
        "photo": data.get("photo")
    })
    return web.json_response({"success": True})

async def api_add_service(request):
    data = await request.json()
    user = validate_init_data(data.get("initData"))
    cid = data["company_id"]
    if cid not in companies or companies[cid]["owner_id"] != user["id"]:
        return web.json_response({"error": "Нет доступа"}, status=403)

    companies[cid]["services"].append({
        "name": data["name"],
        "price": data["price"],
        "duration": data["duration"]
    })
    return web.json_response({"success": True})

async def api_company_public(request):
    try:
        cid = int(request.match_info["id"])
        return web.json_response(companies.get(cid, {}))
    except:
        return web.json_response({"error": "Не найдено"}, status=404)

# ── Приложение ──
def create_app():
    app = web.Application()
    aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader("templates"))

    app.router.add_static("/static/", "static", name="static")

    app.router.add_post("/api/my_companies", api_my_companies)
    app.router.add_post("/api/create_company", api_create_company)
    app.router.add_post("/api/add_specialist", api_add_specialist)
    app.router.add_post("/api/add_service", api_add_service)
    app.router.add_get("/api/company/{id}", api_company_public)

    # Telegram webhook
    webhook_handler = SimpleRequestHandler(dispatcher=dp, bot=bot)
    webhook_handler.register(app, path="/telegram-webhook")

    setup_application(app, dp, bot=bot)
    return app

async def main():
    app = create_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", int(os.getenv("PORT", 10000)))
    await site.start()
    await bot.set_webhook(f"{BASE_URL}/telegram-webhook")
    logger.info(f"✅ Мини-апп запущен: {BASE_URL}")
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())
