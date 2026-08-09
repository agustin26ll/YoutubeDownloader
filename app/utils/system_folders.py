from pathlib import Path
from app.config.env import PROJECT_NAME

def get_default_directory(is_audio: bool) -> Path:
    home = Path.home()
    return home / "Music" if is_audio else home / "Videos"

def get_default_manual_directory() -> Path:
    path = Path.home() / "Downloads" / PROJECT_NAME
    path.mkdir(parents=True, exist_ok=True)
    return path