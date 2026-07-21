from dataclasses import dataclass
from pathlib import Path

@dataclass(slots=True)

class Settings:
    download_directory: Path
    default_quality: str  # "best" | "1080" | "720" | "480" | "audio_only"
    ffmpeg_path: Path