from dataclasses import dataclass
from pathlib import Path
from app.models.download_option import DownloadOption

@dataclass(slots=True)

class DownloadRequest:
    url: str
    output_directory: Path
    options: DownloadOption