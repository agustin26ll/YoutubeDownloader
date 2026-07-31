import os
from pathlib import Path
from dataclasses import asdict
import webview

from app.config.env import IS_DEV, VITE_DEV_URL
from app.models.video import Video
from app.models.download_request import DownloadRequest
from app.controllers.download_controller import DownloadController
from app.services.youtube_service import YoutubeService
from app.services.settings_service import SettingsService
from app.services.filename_formatter import FilenameFormatter
from app.exceptions.video_download_exceptions import VideoDownloadError

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DIST_INDEX = os.path.join(_PROJECT_ROOT, "ui", "dist", "index.html")

_SAMPLE_VIDEO = Video(
    title="Bad Bunny - MONACO (Official Video)",
    uploader="Bad Bunny",
    duration_seconds=185,
    thumbnail="",
    webpage_url="",
    artist="Bad Bunny",
)

class API:

    def __init__(self, controller: DownloadController, settings_service: SettingsService):
        self.controller = controller
        self.settings_service = settings_service
        self.filename_formatter = FilenameFormatter()
        self._last_url = None
        self._last_video = None
        self._last_video_options = []
        self._last_audio_options = []

    
    def get_video(self, url: str) -> dict:
        try:
            video = self.controller.get_video(url)
            self._last_video = video

            video_options = self.controller.get_download_options(video)
            audio_options = self.controller.get_audio_options(video)

            self._last_url = url
            self._last_video_options = video_options
            self._last_audio_options = audio_options

            return {
                "success" : True,
                "video": asdict(video),
                "video_options": [asdict(o) for o in video_options],
                "audio_options": [asdict(o) for o in audio_options],
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
            "naming_expression": settings.naming_expression,
            "ask_folder_always": settings.ask_folder_always,
            "auto_max_quality": settings.auto_max_quality,
        }

    def update_naming_expression(self, expression: str) -> dict:
        settings = self.settings_service.update_naming_expression(expression)
        return {"success": True, "naming_expression": settings.naming_expression}

    def preview_filename(self, expression: str) -> dict:
        sample = self._last_video or _SAMPLE_VIDEO
        filename = self.filename_formatter.build(sample, expression)
        return {"filename": filename}

    def update_ask_folder_always(self, value: bool) -> dict:
        settings = self.settings_service.update_ask_folder_always(value)
        return {"success": True, "ask_folder_always": settings.ask_folder_always}

    def update_auto_max_quality(self, value: bool) -> dict:
        settings = self.settings_service.update_auto_max_quality(value)
        return {"success": True, "auto_max_quality": settings.auto_max_quality}
    
    def create_folder(self, path: str) -> dict:
        try:
            Path(path).mkdir(parents=True, exist_ok=True)
            return {"success": True}
        except Exception:
            return {"success": False, "error": "No se pudo crear la carpeta."}

    def check_folder_exists(self, path: str) -> dict:
        return {"exists": Path(path).exists()}

    def open_folder(self, path: str) -> dict:
        try:
            folder = Path(path)
            if not folder.exists():
                return {
                    "success": False,
                    "error": "La carpeta no existe."
                }

            os.startfile(str(folder))

            return {"success": True}
        except Exception:
            return {
                "success": False,
                "error": "No se pudo abrir la carpeta."
            }
    
    def pick_folder(self) -> dict:
        result = webview.windows[0].create_file_dialog(webview.FOLDER_DIALOG)

        if not result:
            return {
                "success": False,
                "canceled": True
            }
        
        selected_path = Path(result[0]).expanduser().resolve()

        self.settings_service.update_download_directory(selected_path)

        return {"success": True, "path": str(selected_path)}
    
    def download(self, option_index: int, output_directory: str, is_audio: bool = False) -> dict:
        options_list = self._last_audio_options if is_audio else self._last_video_options

        if not self._last_url or option_index >= len(options_list):
            return {"success": False, "error": "No hay un video seleccionado válido."}

        resolved_dir = Path(output_directory).expanduser().resolve()

        if not resolved_dir.exists():
            return {"success": False, "error": "La carpeta de destino ya no existe. Selecciónala de nuevo."}

        try:
            request = DownloadRequest(
                url=self._last_url,
                output_directory=resolved_dir,
                options=options_list[option_index],
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
