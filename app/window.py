import os
from pathlib import Path
from dataclasses import asdict
import webview

from app.config.env import IS_DEV, VITE_DEV_URL
from app.models.download_request import DownloadRequest
from app.controllers.download_controller import DownloadController
from app.services.youtube_service import YoutubeService
from app.services.settings_service import SettingsService
from app.exceptions.video_download_exceptions import VideoDownloadError

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DIST_INDEX = os.path.join(_PROJECT_ROOT, "ui", "dist", "index.html")

class API:

    def __init__(self, controller: DownloadController, settings_service: SettingsService):
        self.controller = controller
        self.settings_service = settings_service
        self._last_url = None
        self._last_options = []

    
    def get_video(self, url: str) -> dict:
        try:
            video = self.controller.get_video(url)
            options = self.controller.get_download_options(video)

            self._last_url = url
            self._last_options = options

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
        
    def get_settings(self) -> dict:
        settings = self.settings_service.load()

        return {
            "download_directory": str(settings.download_directory),
            "default_quality": settings.default_quality,
        }
    
    def pick_folder(self) -> dict:
        result = webview.windows[0].create_file_dialog(webview.FOLDER_DIALOG)

        if not result:
            return {
                "success": False,
                "canceled": True
            }
        
        selected_path = result[0]
        self.settings_service.update_download_directory(Path(selected_path))

        return {"success": True, "path": selected_path}
    
    def download(self, option_index: int, output_directory: str) -> dict:
        if not self._last_url or option_index >= len(self._last_options):
            return {"success": False, "error": "No hay un video seleccionado válido."}
        
        try:
            request = DownloadRequest(
                url=self._last_url,
                output_directory=Path(output_directory),
                options=self._last_options[option_index],
            )

            self.controller.download(request)
            return {"success": True}
        except VideoDownloadError as e:
            return {"success": False, "error": str(e), "error_type": type(e).__name__}
        except Exception:
            return {
                "success": False,
                "error": "Ocurrió un error inesperado durante la descarga.",
                "error_type": "UnknownError",
            }


def launch_app():
    youtube_service = YoutubeService()
    settings_service = SettingsService()
    controller = DownloadController(youtube_service)
    api = API(controller, settings_service)

    url = VITE_DEV_URL if IS_DEV else _DIST_INDEX

    webview.create_window(
        title="YT DOWNLOADER",
        url=url,
        js_api=api,
        width=1280,
        height=720,
        min_size=(600, 400)
    )

    webview.start(debug=IS_DEV)
