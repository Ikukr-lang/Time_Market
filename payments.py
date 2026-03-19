from yookassa import Configuration, Payment
from config import YOOKASSA_SHOP_ID, YOOKASSA_SECRET

Configuration.account_id = YOOKASSA_SHOP_ID
Configuration.secret_key = YOOKASSA_SECRET

def create_payment(company_id: int, specialists: int):
    price = 150 + 50 * (specialists - 1) if specialists > 1 else 150
    payment = Payment.create({
        "amount": {"value": str(price), "currency": "RUB"},
        "confirmation": {"type": "redirect", "return_url": "https://t.me/yourbot"},
        "capture": True,
        "description": f"Подписка на {specialists} специалистов"
    })
    return payment.confirmation.confirmation_url, payment.id
