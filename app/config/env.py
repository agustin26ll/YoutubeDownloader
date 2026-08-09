import os
from dotenv import load_dotenv

load_dotenv()

APP_ENV = os.environ.get("APP_ENV", "dev")

IS_DEV = APP_ENV == "dev"

VITE_DEV_HOST = os.environ.get("VITE_DEV_HOST", "localhost")
VITE_DEV_PORT = os.environ.get("VITE_DEV_PORT", "5173")

VITE_DEV_URL = f"http://{VITE_DEV_HOST}:{VITE_DEV_PORT}"

PROJECT_NAME = os.environ.get("PROJECT_NAME", "YTDownloader")
WINDOW_TITLE = os.environ.get("WINDOW_TITLE", "YT Downloader")
WINDOW_WIDTH = int(os.environ.get("WINDOW_WIDTH", "1280"))
WINDOW_HEIGHT = int(os.environ.get("WINDOW_HEIGHT", "720"))
WINDOW_MIN_WIDTH = int(os.environ.get("WINDOW_MIN_WIDTH", "600"))
WINDOW_MIN_HEIGHT = int(os.environ.get("WINDOW_MIN_HEIGHT", "400"))