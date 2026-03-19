import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
# SECRET для проверки initData (произвольный, но длинный)
WEBAPP_SECRET = os.getenv("WEBAPP_SECRET", "super-secret-string-change-me-1234567890")
BASE_URL = f"https://{os.getenv('RENDER_EXTERNAL_HOSTNAME', 'localhost:10000')}"
