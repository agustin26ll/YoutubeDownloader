import os
from pathlib import Path
from dataclasses import asdict
import webview
import subprocess
import time
import json

from app.config.env import IS_DEV, VITE_DEV_URL, WINDOW_TITLE, WINDOW_WIDTH, WINDOW_HEIGHT, WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT
from app.models.download_request import DownloadRequest
from app.models.video import Video
from app.models.queue_item import QueueItem
from app.controllers.download_controller import DownloadController
from app.services.youtube_service import YoutubeService
from app.services.settings_service import SettingsService
from app.services.history_service import HistoryService
from app.services.playlist_service import PlaylistService
from app.services.download_queue_service import DownloadQueueService
from app.exceptions.video_download_exceptions import VideoDownloadError
from app.i18n.translator import t
from app.i18n.locale_resolver import resolve_locale

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

PROGRESS_EMIT_INTERVAL_S = 0.25

_AUDIO_EXTENSIONS = {"mp3": "mp3", "m4a": "m4a", "wav": "wav", "flac": "flac", "vorbis": "ogg"}

BYTES_PER_MB = 1_048_576

class API:

    def __init__(self, controller: DownloadController, settings_service: SettingsService, history_service: HistoryService):
        self.controller = controller
        self.settings_service = settings_service
        self.history_service = history_service
        self.queue_service = DownloadQueueService(controller, history_service, self._on_queue_event)
        self._locale = resolve_locale(settings_service.load())
        self.playlist_service = PlaylistService()
        self._last_url = None
        self._last_video = None
        self._last_video_options = []
        self._last_audio_options = []
        self._playlist_options = {}

    def _t(self, key: str) -> str:
        return t(key, locale=self._locale)

    # CONFIGURACIÓN DE APP

    def get_settings(self) -> dict:
        settings = self.settings_service.load()
        return {
            "custom_directory": str(settings.download_directory),
            "folder_mode": settings.folder_mode,
            "default_quality": settings.default_quality,
            "naming_expression": settings.naming_expression,
            "auto_max_quality": settings.auto_max_quality,
            "create_subfolder": settings.create_subfolder,
            "language": settings.language,
            "resolved_locale": self._locale,
        }

    def get_default_directory(self, is_audio: bool) -> dict:
        from app.utils.system_folders import get_default_directory
        path = get_default_directory(is_audio)
        return {"path": str(path), "exists": path.exists()}

    # CONFIGURACIÓN DE CARPETAS, CALIDAD, ACTUALIZAR LENGUAJE Y EXPRESIONES DE NOMBRES DE ARCHIVOS

    def update_folder_mode(self, mode: str) -> dict:
        settings = self.settings_service.update_folder_mode(mode)
        return {"success": True, "folder_mode": settings.folder_mode}

    def update_create_subfolder(self, value: bool) -> dict:
        settings = self.settings_service.update_create_subfolder(value)
        return {"success": True, "create_subfolder": settings.create_subfolder}

    def update_auto_max_quality(self, value: bool) -> dict:
        settings = self.settings_service.update_auto_max_quality(value)
        return {"success": True, "auto_max_quality": settings.auto_max_quality}

    def update_naming_expression(self, expression: str) -> dict:
        settings = self.settings_service.update_naming_expression(expression)
        return {"success": True, "naming_expression": settings.naming_expression}

    def update_language(self, language: str) -> dict:
        settings = self.settings_service.update_language(language)
        self._locale = resolve_locale(settings)
        return {"success": True, "language": settings.language, "resolved_locale": self._locale}

    def preview_subfolder(self) -> dict:
        settings = self.settings_service.load()
        if not settings.create_subfolder:
            return {"enabled": False, "name": None}

        from app.services.filename_formatter import FilenameFormatter
        sample = self._last_video or _SAMPLE_VIDEO
        name = FilenameFormatter().build(sample, settings.naming_expression)
        return {"enabled": True, "name": name}

    def preview_filename(self, expression: str) -> dict:
        from app.services.filename_formatter import FilenameFormatter
        sample = self._last_video or _SAMPLE_VIDEO
        filename = FilenameFormatter().build(sample, expression)
        return {"filename": filename}

    # FUNCIONALIDADES DE VIDEO Y DESCARGA: PLAYLIST Y ARCHIVO INDIVIDUAL
    
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
            return {"success": False, "error": self._t("errors.unexpected"), "error_type": "UnknownError"}
        
    def get_playlist(self, url: str) -> dict:
        try:
            playlist = self.playlist_service.get_playlist(url)
            return {
                "success": True,
                "playlist": {
                    "title": playlist.title,
                    "uploader": playlist.uploader,
                    "items": [asdict(item) for item in playlist.items],
                },
            }
        except VideoDownloadError as e:
            return {"success": False, "error": str(e), "error_type": type(e).__name__}
        except Exception:
            return {"success": False, "error": self._t("errors.unexpected"), "error_type": "UnknownError"}

    def check_is_playlist(self, url: str) -> dict:
        return {"is_playlist": self.playlist_service.is_playlist_url(url)}

    def _emit_progress(self, payload: dict) -> None:
        try:
            webview.windows[0].evaluate_js(
                f"window.dispatchEvent(new CustomEvent('download-progress', {{ detail: {json.dumps(payload)} }}))"
            )
        except Exception:
            pass

    def download(self, option_index: int, output_directory: str, is_audio: bool = False, custom_filename: str | None = None) -> dict:
        options_list = self._last_audio_options if is_audio else self._last_video_options

        if not self._last_url or option_index >= len(options_list):
            return {"success": False, "error": self._t("errors.no_valid_selection")}

        resolved_dir = Path(output_directory).expanduser().resolve()
        if not resolved_dir.exists():
            return {"success": False, "error": self._t("errors.folder_missing")}

        selected_option = options_list[option_index]
        last_emit = {"t": 0.0}

        def on_progress(d: dict) -> None:
            status = d.get("status")

            if status == "downloading":
                now = time.time()
                if now - last_emit["t"] < PROGRESS_EMIT_INTERVAL_S:
                    return
                last_emit["t"] = now

                downloaded = d.get("downloaded_bytes") or 0
                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                percent = round((downloaded / total * 100), 1) if total else 0

                self._emit_progress({
                    "status": "downloading",
                    "percent": percent,
                    "downloaded_mb": round(downloaded / BYTES_PER_MB, 2),
                    "total_mb": round(total / BYTES_PER_MB, 2) if total else None,
                    "speed_mb_s": round((d.get("speed") or 0) / BYTES_PER_MB, 2),
                    "eta_seconds": d.get("eta"),
                })

            elif status == "finished":
                self._emit_progress({"status": "processing"})

        try:
            request = DownloadRequest(url=self._last_url, output_directory=resolved_dir, options=selected_option)

            filename, effective_dir = self.controller.download(request, progress_callback=on_progress, custom_filename=custom_filename)

            extension = _AUDIO_EXTENSIONS.get(selected_option.audio_codec, "mp3") if is_audio else "mp4"

            self.history_service.add({
                "url": self._last_url,
                "title": self._last_video.title if self._last_video else filename,
                "uploader": self._last_video.uploader if self._last_video else "",
                "thumbnail": self._last_video.thumbnail if self._last_video else "",
                "duration_seconds": self._last_video.duration_seconds if self._last_video else 0,
                "quality_label": selected_option.label,
                "output_directory": str(effective_dir),
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
            return {"success": False, "error": self._t("errors.download_failed"), "error_type": "UnknownError"}

    def resolve_playlist_item(self, video_id: str, url: str, is_audio: bool) -> dict:
        try:
            video = self.controller.get_video(url)
            video_options = self.controller.get_download_options(video)
            audio_options = self.controller.get_audio_options(video)

            self._playlist_options[video_id] = {
                "video_options": video_options,
                "auido_options": audio_options,
            }

            options = audio_options if is_audio else video_options

            if not options:
                return { "success" : False, "video_id": video_id, "error": self._t("errors.no_formats_available")}

            default_index = 0 if is_audio else len(options) - 1

            return {
                "success" : True,
                "video_id": video_id,
                "default_index": default_index,
                "options": [{"index": i, "label": o.label} for i, o in enumerate(options)],
            }
        except VideoDownloadError as e:
            return { "success" : False, "video_id": video_id, "error": str(e)}
        except Exception:
            return { "success" : False, "video_id": video_id, "error": self._t("errors.unexpected")}

    def download_playlist(self, items: list[dict], output_directory: str) -> dict:
        resolved_dir = Path(output_directory).expanduser().resolve()

        if not resolved_dir.exists():
            return { "success": False, "error": self._t("errors.folder_missing")}

        total = len(items)
        results = []

        for index, item in enumerate(items, start=1):
            video_id = item["video_id"]
            cached = self._playlist_options.get(video_id)

            if not cached:
                results.append({"video_id": video_id, "success": False, "error": self._t("errors.no_formats_available")})
                continue

            options_list = cached["audio_options"] if item["is_audio"] else cached["video_options"]
            option_index = item["option_index"]

            if option_index >= len(options_list):
                results.append({"video_id": video_id, "success": False, "error": self._t("errors.no_formats_available")})
                continue

            selected_option = options_list[option_index]
            last_emit = { "t": 0.0 }

            def on_progress(d: dict, video_id=video_id, index=index) -> None:
                status = d.get("status")

                if status != "downloading":
                    return

                now = time.time()
                if now - last_emit["t"] < PROGRESS_EMIT_INTERVAL_S:
                    return
                last_emit["t"] = now

                downloaded = d.get("downloaded_bytes") or 0
                total_bytes = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                percent = round((downloaded / total_bytes * 100), 1) if total_bytes else 0

                self._emit_progress({
                    "status": "downloading",
                    "percent": percent,
                    "downloaded_mb": round(downloaded / BYTES_PER_MB, 2),
                    "total_mb": round(total_bytes / BYTES_PER_MB, 2) if total_bytes else None,
                    "speed_mb_s": round((d.get("speed") or 0) / BYTES_PER_MB, 2),
                    "eta_seconds": d.get("eta"),
                    "playlist_index": index,
                    "playlist_total": total,
                    "video_id": video_id,
                })

            try:
                request = DownloadRequest(url=item["url"], output_directory=resolved_dir, options=selected_option)
                filename, effective_dir = self.controller.download(request, progress_callback=on_progress)

                extension = _AUDIO_EXTENSIONS.get(selected_option.audio_codec, "mp3") if item["is_audio"] else "mp4"

                self.history_service.add({
                    "url": item["url"],
                    "title": item.get("title", filename),
                    "uploader": item.get("uploader", ""),
                    "thumbnail": item.get("thumbnail", ""),
                    "duration_seconds": item.get("duration_seconds", 0),
                    "quality_label": selected_option.label,
                    "output_directory": str(effective_dir),
                    "filename": filename,
                    "extension": extension,
                    "is_audio": item["is_audio"],
                    "format_string": selected_option.format_string,
                    "audio_codec": selected_option.audio_codec,
                })

                results.append({ "video_id": video_id, "success": True })

            except VideoDownloadError as e:
                results.append({ "video_id": video_id, "success": False, "error": str(e)})
            except Exception:
                results.append({ "video_id": video_id, "success": False, "error": self._t("errors.download_failed")})

        self._emit_progress({"status": "playlist_completed"})

        return { "success": True, "results": results }

    # FUNCIONALIDADES DE COLA

    def _on_queue_event(self, event_type: str, payload: dict) -> None:
        self._emit_progress({"event": event_type, **payload }) if event_type == "download-progress" else self._emit_js_event(event_type, payload)

    def _emit_js_event(self, event_name: str, payload: dict) -> None:
        try:
            webview.windows[0].evaluate_js(
                f"window.dispatchEvent(new CustomEvent('{event_name}', {{ detail: {json.dumps(payload)} }} ))"
            )
        except Exception:
            pass

    def enqueue_download(self, url: str, title:str, thumbnail: str, option_index: int, output_directory: str, is_audio: bool, custom_filename: str | None = None) -> dict:
        options_list = self._last_audio_options if is_audio else self._last_video_options

        if option_index >= len(options_list):
            return {"success": False, "error": self._t("errors.no_valid_selection")}

        item = QueueItem.create(
            url=url,
            title=title,
            thumbnail=thumbnail,
            output_directory=Path(output_directory).expanduser().resolve(),
            option=options_list[option_index],
            is_audio=is_audio,
            custom_filename=custom_filename
        )

        self.queue_service.enqueue(item)
        return {"success": True, "queue_id": item.id}

    def get_queue_snapshot(self) -> dict:
        return {"items": self.queue_service.get_snapshot()}
    
    def cancel_current_download(self) -> dict:
        self.queue_service.cancel_current()
        return {"success": True}

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
            return {"success": False, "error": self._t("errors.folder_create_failed")}

    def open_folder(self, path: str) -> dict:
        try:
            folder = Path(path)
            if not folder.exists():
                return {"success": False, "error": self._t("errors.folder_open_failed")}
            os.startfile(str(folder))
            return {"success": True}
        except Exception:
            return {"success": False, "error": self._t("errors.file_missing")}

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
            return {"success": False, "error": self._t("errors.history_item_not_found")}

        file_path = Path(entry.output_directory) / f"{entry.filename}.{entry.extension}"
        if not file_path.exists():
            return {"success": False, "missing": True, "error": self._t("errors.file_missing")}
        
        try:
            os.startfile(str(file_path))
            return {"success": True}
        except Exception:
            return {"success": False, "error": self._t("errors.file_open_failed")}
        
    def open_history_folder(self, entry_id: str) -> dict:
        entry = self.history_service.get_by_id(entry_id)
        if not entry:
            return {"success": False, "error": self._t("errors.history_item_not_found")}
        
        folder = Path(entry.output_directory)
        if not folder.exists():
            return {"success": False, "error": self._t("errors.folder_no_longer_exists")}
        
        file_path = folder / f"{entry.filename}.{entry.extension}"

        try:
            if file_path.exists():
                subprocess.run(["explorer", "/select,", str(file_path)])
            else:
                os.startfile(str(folder))
            return {"success": True}
        except Exception:
            return {"success": False, "error": self._t("errors.folder_open_failed")}
        
    def redownload_from_history(self, entry_id: str) -> dict:
        entry = self.history_service.get_by_id(entry_id)
        if not entry:
            return {"success": False, "error": self._t("errors.history_item_not_found")}

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
            return {"success": False, "error": self._t("errors.no_formats_available")}

        self._last_url = entry.url
        self._last_video = video
        if entry.is_audio:
            self._last_audio_options = options
        else:
            self._last_video_options = options

        resolved_dir = Path(entry.output_directory)
        if not resolved_dir.exists():
            return {"success": False, "error": self._t("errors.history_folder_missing")}

        return self.download(matching_index, str(resolved_dir), entry.is_audio)

    def delete_history_item(self, entry_id: str) -> dict:
        self.history_service.delete(entry_id)
        return {"success": True}

    def clear_history(self) -> dict:
        self.history_service.clear_all()
        return { "success": True }

def launch_app():
    youtube_service = YoutubeService()
    settings_service = SettingsService()
    history_service = HistoryService()
    controller = DownloadController(youtube_service)
    api = API(controller, settings_service, history_service)

    url = VITE_DEV_URL if IS_DEV else _DIST_INDEX

    webview.create_window(
        title=WINDOW_TITLE,
        url=url,
        js_api=api,
        width=WINDOW_WIDTH,
        height=WINDOW_HEIGHT,
        min_size=(WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT)
    )
    webview.start(debug=IS_DEV)