import asyncio
import os
import logging
from datetime import datetime

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import Message
from aiogram.filters import Command

from aiohttp import web
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# ────────────────────────────────────────────────
#               КОНФИГУРАЦИЯ
# ────────────────────────────────────────────────

BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN не найден в переменных окружения")

# Для примера — можно вынести в отдельный config.py позже
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///bot.db")

# Настройка логирования (очень полезно на Render)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

# ────────────────────────────────────────────────
#               БАЗА ДАННЫХ (минимальная)
# ────────────────────────────────────────────────

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Пока пустая — можно потом добавить модели
async def init_db():
    # Здесь в будущем будут await Base.metadata.create_all(engine)
    logger.info("База данных подключена (инициализация пропущена в демо-версии)")

# ────────────────────────────────────────────────
#               DUMMY HTTP СЕРВЕР ДЛЯ RENDER
# ────────────────────────────────────────────────

async def handle_health(request):
    return web.Response(text="Bot is alive\n")

async def start_http_server():
    port = int(os.getenv("PORT", "10000"))
    app = web.Application()
    app.router.add_get("/", handle_health)
    app.router.add_get("/health", handle_health)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logger.info(f"Dummy HTTP сервер запущен на порту {port}")

# ────────────────────────────────────────────────
#               HANDLERS (минимальный набор)
# ────────────────────────────────────────────────

dp = Dispatcher(storage=MemoryStorage())

@dp.message(Command("start"))
async def cmd_start(message: Message):
    await message.answer(
        "Привет! Это заготовка маркетплейс-бота для записи к специалистам.\n\n"
        "Пока работает только /start и /ping\n"
        "Дальше будем добавлять создание компаний, специалистов, запись и оплату."
    )

@dp.message(Command("ping"))
async def cmd_ping(message: Message):
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    await message.answer(f"Pong! {now}")

# ────────────────────────────────────────────────
#               MAIN
# ────────────────────────────────────────────────

async def main():
    bot = Bot(token=BOT_TOKEN)

    # 1. Запускаем HTTP-сервер в фоне (обязательно для Render)
    asyncio.create_task(start_http_server())

    # 2. Инициализация базы (если нужно)
    await init_db()

    # 3. Удаляем webhook (на всякий случай)
    await bot.delete_webhook(drop_pending_updates=True)
    logger.info("Webhook удалён, переходим на long polling")

    # 4. Запускаем polling
    try:
        await dp.start_polling(
            bot,
            allowed_updates=["message", "callback_query"],
            drop_pending_updates=True,
        )
    except Exception as e:
        logger.exception("Ошибка в polling: %s", e)
    finally:
        await bot.session.close()
        logger.info("Бот остановлен")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Остановка по Ctrl+C")
    except Exception as exc:
        logger.exception("Критическая ошибка при запуске: %s", exc)
