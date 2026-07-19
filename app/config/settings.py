from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class Settings:

    ffmpeg_path: Path

    download_directory: Path

    merge_output_format: str = "mp4"