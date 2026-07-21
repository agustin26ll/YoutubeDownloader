import os
from dataclasses import asdict
import webview

from app.config.env import IS_DEV, VITE_DEV_URL
from app.controllers.download_controller import DownloadController
from app.services.youtube_service import YoutubeService
from app.exceptions.video_download_exceptions import VideoDownloadError

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DIST_INDEX = os.path.join(_PROJECT_ROOT, "ui", "dist", "index.html")

class API:

    def __init__(self, controller: DownloadController):
        self.controller = controller

    
    def get_video(self, url: str) -> dict:
        try:
            video = self.controller.get_video(url)
            options = self.controller.get_download_options(video)

            return {
                "success" : True,
                "video": asdict(video),
                "options": [asdict(option) for option in options]
            }
        
        except VideoDownloadError as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
        except Exception:
            return {
                "success": False,
                "error": "Ocurrió un error inesperado. Intenta de nuevo.",
                "error_type": "UnknownError",
            }

def launch_app():
    youtube_service = YoutubeService()
    controller = DownloadController(youtube_service)
    api = API(controller)

    url = VITE_DEV_URL if IS_DEV else _DIST_INDEX

    webview.create_window(
        title="YT DOWNLOADER",
        url=url,
        js_api=api,
        width=1280,
        height=720,
        min_size=(600, 400)
    )

    webview.start(debug=True)
