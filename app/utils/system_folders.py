from pathlib import Path


def get_default_directory(is_audio: bool) -> Path:
    home = Path.home()
    return home / "Music" if is_audio else home / "Videos"