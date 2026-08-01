import os
from pathlib import Path
from dataclasses import asdict
import webview
import subprocess
import time
import json

from app.config.env import IS_DEV, VITE_DEV_URL
from app.controllers.download_controller import DownloadController
from app.services.youtube_service import YoutubeService
from app.services.settings_service import SettingsService
from app.services.history_service import HistoryService
from app.models.download_request import DownloadRequest
from app.models.video import Video
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

_AUDIO_EXTENSIONS = {"mp3": "mp3", "m4a": "m4a", "wav": "wav", "flac": "flac", "vorbis": "ogg"}


class API:

    def __init__(self, controller: DownloadController, settings_service: SettingsService, history_service: HistoryService):
        self.controller = controller
        self.settings_service = settings_service
        self.history_service = history_service
        self._last_url = None
        self._last_video = None
        self._last_video_options = []
        self._last_audio_options = []

    # CONFIGURACIÓN DE APP

    def get_settings(self) -> dict:
        settings = self.settings_service.load()
        return {
            "custom_directory": str(settings.download_directory),
            "folder_mode": settings.folder_mode,
            "default_quality": settings.default_quality,
            "naming_expression": settings.naming_expression,
            "auto_max_quality": settings.auto_max_quality,
        }

    def get_default_directory(self, is_audio: bool) -> dict:
        from app.utils.system_folders import get_default_directory
        path = get_default_directory(is_audio)
        return {"path": str(path), "exists": path.exists()}

    # CONFIGURACIÓN DE CARPETAS, CALIDAD Y EXPRESIONES DE NOMBRES DE ARCHIVOS

    def update_folder_mode(self, mode: str) -> dict:
        settings = self.settings_service.update_folder_mode(mode)
        return {"success": True, "folder_mode": settings.folder_mode}

    def update_auto_max_quality(self, value: bool) -> dict:
        settings = self.settings_service.update_auto_max_quality(value)
        return {"success": True, "auto_max_quality": settings.auto_max_quality}

    def update_naming_expression(self, expression: str) -> dict:
        settings = self.settings_service.update_naming_expression(expression)
        return {"success": True, "naming_expression": settings.naming_expression}

    def preview_filename(self, expression: str) -> dict:
        from app.services.filename_formatter import FilenameFormatter
        sample = self._last_video or _SAMPLE_VIDEO
        filename = FilenameFormatter().build(sample, expression)
        return {"filename": filename}

    # FUNCIONALIDADES DE VIDEO Y DESCARGA
    
    def get_video(self, url: str) -> dict:
        try:
            video = self.controller.get_video(url)
            video_options = self.controller.get_download_options(video)
            audio_options = self.controller.get_audio_options(video)

            self._last_url = url
            self._last_video = video
            self._last_video_options = video_options
            self._last_audio_options = audio_options

            return {
                "success": True,
                "video": asdict(video),
                "video_options": [asdict(o) for o in video_options],
                "audio_options": [asdict(o) for o in audio_options],
            }
        except VideoDownloadError as e:
            return {"success": False, "error": str(e), "error_type": type(e).__name__}
        except Exception:
            return {"success": False, "error": "Ocurrió un error inesperado. Intenta de nuevo.", "error_type": "UnknownError"}

    def _emit_progress(self, payload: dict) -> None:
        try:
            webview.windows[0].evaluate_js(
                f"window.dispatchEvent(new CustomEvent('download-progress', {{ detail: {json.dumps(payload)} }}))"
            )
        except Exception:
            pass

    def download(self, option_index: int, output_directory: str, is_audio: bool = False) -> dict:
        options_list = self._last_audio_options if is_audio else self._last_video_options

        if not self._last_url or option_index >= len(options_list):
            return {"success": False, "error": "No hay un video seleccionado válido."}

        resolved_dir = Path(output_directory).expanduser().resolve()
        if not resolved_dir.exists():
            return {"success": False, "error": "La carpeta de destino ya no existe. Selecciónala de nuevo."}

        selected_option = options_list[option_index]
        last_emit = {"t": 0.0}

        def on_progress(d: dict) -> None:
            status = d.get("status")

            if status == "downloading":
                now = time.time()
                if now - last_emit["t"] < 0.25:
                    return
                last_emit["t"] = now

                downloaded = d.get("downloaded_bytes") or 0
                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                percent = round((downloaded / total * 100), 1) if total else 0

                self._emit_progress({
                    "status": "downloading",
                    "percent": percent,
                    "downloaded_mb": round(downloaded / 1_048_576, 2),
                    "total_mb": round(total / 1_048_576, 2) if total else None,
                    "speed_mb_s": round((d.get("speed") or 0) / 1_048_576, 2),
                    "eta_seconds": d.get("eta"),
                })

            elif status == "finished":
                self._emit_progress({"status": "processing"})

        try:
            request = DownloadRequest(url=self._last_url, output_directory=resolved_dir, options=selected_option)
            filename = self.controller.download(request, progress_callback=on_progress)

            extension = _AUDIO_EXTENSIONS.get(selected_option.audio_codec, "mp3") if is_audio else "mp4"

            self.history_service.add({
                "url": self._last_url,
                "title": self._last_video.title if self._last_video else filename,
                "uploader": self._last_video.uploader if self._last_video else "",
                "thumbnail": self._last_video.thumbnail if self._last_video else "",
                "duration_seconds": self._last_video.duration_seconds if self._last_video else 0,
                "quality_label": selected_option.label,
                "output_directory": str(resolved_dir),
                "filename": filename,
                "extension": extension,
                "is_audio": is_audio,
                "format_string": selected_option.format_string,
                "audio_codec": selected_option.audio_codec,
            })

            self._emit_progress({"status": "completed"})
            return {"success": True}

        except VideoDownloadError as e:
            self._emit_progress({"status": "error"})
            return {"success": False, "error": str(e), "error_type": type(e).__name__}
        except Exception:
            self._emit_progress({"status": "error"})
            return {"success": False, "error": "Ocurrió un error inesperado durante la descarga.", "error_type": "UnknownError"}

    # FUNCIONALIDADES DE SELECCIÓN, VERIFICACIÓN, CREACIÓN Y APERTURA DE CARPETAS

    def pick_folder(self) -> dict:
        result = webview.windows[0].create_file_dialog(webview.FOLDER_DIALOG)
        if not result:
            return {"success": False, "cancelled": True}

        selected_path = Path(result[0]).expanduser().resolve()
        self.settings_service.update_download_directory(selected_path)
        return {"success": True, "path": str(selected_path)}

    def check_folder_exists(self, path: str) -> dict:
        return {"exists": Path(path).exists()}

    def create_folder(self, path: str) -> dict:
        try:
            Path(path).mkdir(parents=True, exist_ok=True)
            return {"success": True}
        except Exception:
            return {"success": False, "error": "No se pudo crear la carpeta."}

    def open_folder(self, path: str) -> dict:
        try:
            folder = Path(path)
            if not folder.exists():
                return {"success": False, "error": "La carpeta no existe."}
            os.startfile(str(folder))
            return {"success": True}
        except Exception:
            return {"success": False, "error": "No se pudo abrir la carpeta."}

    # FUNCIONALIDADES DE HISTORIAL: OBTENER, ABRIR ARCHIVO Y REDESCARGA

    def get_history(self) -> dict:
        entries = self.history_service.load()
        return {"entries": [asdict(e) for e in entries]}

    def check_history_item_exists(self, entry_id: str) -> dict:
        entry = self.history_service.get_by_id(entry_id)
        if not entry:
            return {"exists": False}
        
        file_path = Path(entry.output_directory) / f"{entry.filename}.{entry.extension}"

        return {"exists": file_path.exists()}
    
    def open_history_file(self, entry_id: str) -> dict:
        entry = self.history_service.get_by_id(entry_id)
        if not entry:
            return {"success": False, "error": "No se encontró el elemento."}

        file_path = Path(entry.output_directory) / f"{entry.filename}.{entry.extension}"
        if not file_path.exists():
            return {"success": False, "missing": True, "error": "El archivo ya no existe."}
        
        try:
            os.startfile(str(file_path))
            return {"success": True}
        except Exception:
            return {"success": False, "error": "No se pudo abrir el archivo."}
        
    def open_history_folder(self, entry_id: str) -> dict:
        entry = self.history_service.get_by_id(entry_id)
        if not entry:
            return {"success": False, "error": "No se encontró el elemento."}
        
        folder = Path(entry.output_directory)
        if not folder.exists():
            return {"success": False, "error": "La carpeta ya no existe."}
        
        file_path = folder / f"{entry.filename}.{entry.extension}"

        try:
            if file_path.exists():
                subprocess.run(["explorer", "/select,", str(file_path)])
            else:
                os.startfile(str(folder))
            return {"success": True}
        except Exception:
            return {"success": False, "error": "No se pudo abrir la carpeta."}
        
    def redownload_from_history(self, entry_id: str) -> dict:
        entry = self.history_service.get_by_id(entry_id)
        if not entry:
            return {"success": False, "error": "No se encontró el elemento."}

        try:
            video = self.controller.get_video(entry.url)
        except VideoDownloadError as e:
            return {"success": False, "error": str(e), "error_type": type(e).__name__}

        options = self.controller.get_audio_options(video) if entry.is_audio else self.controller.get_download_options(video)

        matching_index = next(
            (i for i, o in enumerate(options)
             if (o.audio_codec == entry.audio_codec if entry.is_audio else o.format_string == entry.format_string)),
            len(options) - 1 if options else None,
        )

        if matching_index is None:
            return {"success": False, "error": "No hay formatos disponibles para este video."}

        self._last_url = entry.url
        self._last_video = video
        if entry.is_audio:
            self._last_audio_options = options
        else:
            self._last_video_options = options

        resolved_dir = Path(entry.output_directory)
        if not resolved_dir.exists():
            return {"success": False, "error": "La carpeta original ya no existe."}

        return self.download(matching_index, str(resolved_dir), entry.is_audio)

def launch_app():
    youtube_service = YoutubeService()
    settings_service = SettingsService()
    history_service = HistoryService()
    controller = DownloadController(youtube_service)
    api = API(controller, settings_service, history_service)

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