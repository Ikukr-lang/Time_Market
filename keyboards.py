from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

def admin_menu(company_id: int):
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="➕ Добавить услугу", callback_data=f"add_service_{company_id}")],
        [InlineKeyboardButton(text="➕ Добавить специалиста", callback_data=f"add_spec_{company_id}")],
        [InlineKeyboardButton(text="🔗 Ссылка для записи", callback_data=f"get_link_{company_id}")],
        [InlineKeyboardButton(text="📅 Календарь", callback_data=f"calendar_{company_id}")],
        [InlineKeyboardButton(text="💳 Повысить тариф", callback_data=f"upgrade_{company_id}")],
    ])
