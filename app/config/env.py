import os
from dotenv import load_dotenv

load_dotenv()

APP_ENV = os.environ.get("APP_ENV", "dev")

IS_DEV = APP_ENV == "dev"

VITE_DEV_HOST = os.environ.get("VITE_DEV_HOST", "localhost")
VITE_DEV_PORT = os.environ.get("VITE_DEV_PORT", "5173")

VITE_DEV_URL = f"http://{VITE_DEV_HOST}:{VITE_DEV_PORT}"