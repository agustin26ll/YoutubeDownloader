import os
import webview

from app.controllers.download_controller import DownloadController
from app.services.youtube_service import YoutubeService

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DIST_INDEX = os.path.join(_PROJECT_ROOT, "ui", "dist", "index.html")
_DEV_MODE = os.environ.get("APP_ENV", "dev") == "dev"

class API:

    def __init__(self, controller: DownloadController):
        self.controller = controller

    def ping(self) -> dict:
        return {"status": "ok", "message": "Python respondió correctamente"}

def launch_app():
    youtube_service = YoutubeService()
    controller = DownloadController(youtube_service)
    api = API(controller)

    url = "http://localhost:5173" if _DEV_MODE else _DIST_INDEX

    webview.create_window(
        title="YT DOWNLOADER",
        url=url,
        js_api=api,
        width=1280,
        height=720,
        min_size=(600, 400)
    )

    webview.start(debug=True)
