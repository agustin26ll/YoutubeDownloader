import json
from pathlib import Path
from dataclasses import asdict

from app.models.settings import Settings

_VALID_QUALITIES = {"best", "1080", "720", "480", "audio_only"}

class SettingsService:
    
    CONFIG_FILE = Path("app/config/settings.json")

    _DEFAULTS = Settings(
        download_directory = Path("downloads"),
        default_quality = "best",
        ffmpeg_path = Path("tools/ffmpeg"),
    )

    def __init__(self):
        self.CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)

    def load(self) -> Settings:
        if not self.CONFIG_FILE.exists():
            self.save(self._DEFAULTS)
            return self._DEFAULTS
        
        try:
            raw = json.loads(self.CONFIG_FILE.read_text(encoding="utf-8"))

            return Settings(
                download_directory=Path(raw["download_directory"]),
                default_quality=raw["default_quality"],
                ffmpeg_path=Path(raw["ffmpeg_path"])
            )
        
        except (json.JSONDecodeError, KeyError, TypeError):
            self.save(self._DEFAULTS)
            return self._DEFAULTS
        
    def save(self, settings: Settings) -> None:
        self._validate(settings)

        data = {
            "download_directory": str(settings.download_directory),
            "default_quality": settings.default_quality,
            "ffmpeg_path": str(settings.ffmpeg_path)
        }

        self.CONFIG_FILE.write_text(
            json.dumps(data, indent=2, ensure_ascci=False), encoding="utf-8"
        )

    def update_download_directory(self, new_path: Path) -> Settings:
        settings = self.load()
        settings.download_directory = self._resolve_safe_path(new_path)
        self.save(settings)
        return settings
    
    def update_default_quality(self, quality: str) -> Settings:
        settings = self.load()
        settings.default_quality = quality
        self.save(settings)
        return settings

    def _validate(self, settings: Settings) -> None:
        if settings.default_quality not in _VALID_QUALITIES:
            raise ValueError(
                f"Calidad inválida: {settings.default_quality}. "
                f"Debe ser una de {_VALID_QUALITIES}."
            )
        
    def _resolve_safe_path(self, path: Path) -> Path:
        resolved = path.expanduser().resolve()

        if not resolved.exists():
            resolved.mkdir(parents=True, exist_ok=True)

        if not resolved.is_dir():
            raise ValueError(f"La ruta '{resolved}' no es una carpeta válida.")

        return resolved