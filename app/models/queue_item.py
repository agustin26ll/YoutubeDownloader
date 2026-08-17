from dataclasses import dataclass, field
from pathlib import Path
from app.models.download_option import DownloadOption
import uuid

@dataclass(slots=True)
class QueueItem:
    id: str
    url: str
    title: str
    thumbnail: str
    output_directory: Path
    option: DownloadOption
    is_audio: bool
    custom_filename: str | None = None
    status: str = "queued"
    error: str | None = None

    @staticmethod
    def create(**kwargs) -> "QueueItem":
        return QueueItem(id=str(uuid.uuid4()), **kwargs)