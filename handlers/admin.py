from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from states import AddSpecialist, AddService
from models import Company, Specialist
from sqlalchemy.ext.asyncio import async_session
from keyboards import admin_menu
from datetime import datetime, timedelta

router = Router()

@router.message(F.text == "/mycompany")
async def my_company(message: Message):
    async with async_session() as session:
        company = await session.scalar(...)  # найти по owner_telegram_id
        if not company or datetime.utcnow() > company.free_until and not company.paid_until:
            await message.answer("Подписка закончилась!")
            return
    await message.answer("Админ-панель твоей компании:", reply_markup=admin_menu(company.id))
