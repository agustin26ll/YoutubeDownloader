import threading
import queue
import time

from app.models.queue_item import QueueItem
from app.models.download_request import DownloadRequest
from app.exceptions.video_download_exceptions import VideoDownloadError

BYTES_PER_MB = 1_048_576

class DownloadCancelled(Exception):
    pass

class DownloadQueueService:

    def __init__(self, controller, history_service, on_event):
        self.controller = controller
        self.history_service = history_service
        self._on_event = on_event

        self._queue: "queue.Queue[QueueItem]" = queue.Queue()
        self._items: dict[str, QueueItem] = {}
        self._order: list[str] = []
        self._cancel_flag = threading.Event()
        self._current_id: str | None = None
        self._lock = threading.Lock()

        self._worker = threading.Thread(target=self._run, daemon=True)
        self._worker.start()

    def enqueue(self, item: QueueItem) -> None:
        with self._lock:
            self._items[item.id] = item
            self._order.append(item.id)
        self._queue.put(item)
        self._emit_queue_updated()

    def cancel_current(self) -> None:
        self._cancel_flag.set()

    def get_snapshot(self) -> None:
        with self._lock:
            return [self._to_dict(self._items[iid]) for iid in self._order]

    def _to_dict(self, item: QueueItem ) -> None:
        return {
            "id": item.id,
            "title": item.title,
            "thumbnail": item.thumbnail,
            "status": item.status,
            "error": item.error,
            "is_audio": item.is_audio,
        }

    def _emit_queue_updated(self) -> None:
        self._on_event("queue-updated", { "items": self.get_snapshot()})

    def _run(self) -> None:
        while True:
            item = self._queue.get()
            self._current_id = item.id
            self._cancel_flag.clear()

            item.status = "downloading"
            self._emit_queue_updated()

            def on_progress(d: dict) -> None:
                if self._cancel_flag.is_set():
                    raise DownloadCancelled()

                if d.get("status") == "downloading":
                    self._on_event("download-progress", {
                        "status": "downloading",
                        "item_id": item.id,
                        **self._progress_payload(d),
                    })

            try:
                request = DownloadRequest(
                    url=item.url,
                    output_directory=item.output_directory,
                    options=item.option,
                )

                filename, effective_dir = self.controller.dowload(
                    request, progress_callback=on_progress, custom_filename=item.custom_filename
                )

                self.history_service.add({
                    "url": item.url,
                    "title": item.title,
                    "uploader": "",
                    "thumbnail": item.thumbnail,
                    "duration_seconds": 0,
                    "quality_label": item.option_label,
                    "output_directory": str(effective_dir),
                    "filename": filename,
                    "extension": "mp3" if item.is_audio else "mp4",
                    "is_audio": item.is_audio,
                    "format_string": item.option.format_string,
                    "audio_codec": item.option.audio_codec,
                })

                item.status = "done"

            except DownloadCancelled:
                item.status = "cancelled"
            except VideoDownloadError as e:
                item.status = "error"
                item.error = str(e)
            except Exception:
                item.status = "error"
                item.error = "Ocurrió un error inesperado."

            self._current_id = None
            self._emit_queue_updated()
            self._queue.task_done()

    def _progress_payload(self, d: dict) -> dict:
        downloaded = d.get("download_bytes") or 0
        total = d.get("total_byyes") or d.get("total_bytes_estimate") or 0
        return {
            "percent": round((downloaded / total * 100), 1) if total else 0,
            "downloaded_mb": round(downloaded / BYTES_PER_MB, 2),
            "total_mb": round(total / BYTES_PER_MB, 2) if total else None,
            "speed_mb_s": round((d.get("speed") or 0) / BYTES_PER_MB, 2),
            "eta_seconds": d.get("eta"),
        }
        