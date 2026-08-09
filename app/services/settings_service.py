import json
from pathlib import Path
from dataclasses import asdict
from app.models.settings import Settings
from app.utils.system_folders import get_default_manual_directory

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

_VALID_QUALITIES = {"best", "1080", "720", "480", "audio_only"}

class SettingsService:
    
    CONFIG_FILE = Path("app/config/settings.json")

    _DEFAULTS = Settings(
        download_directory=get_default_manual_directory(),
        default_quality="best",
        ffmpeg_path=_PROJECT_ROOT / "tools" / "ffmpeg",
        naming_expression="{artist} - {title:title}",
        folder_mode="default",
        auto_max_quality=False,
        create_subfolder=False,
        language="auto",
    )

    def __init__(self):
        self.CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)

    def save(self, settings: Settings) -> None:
        self._validate(settings)
    
        data = {
            "download_directory": str(settings.download_directory),
            "default_quality": settings.default_quality,
            "ffmpeg_path": str(settings.ffmpeg_path),
            "naming_expression": settings.naming_expression,
            "folder_mode": settings.folder_mode,
            "auto_max_quality": settings.auto_max_quality,
            "create_subfolder": settings.create_subfolder,
            "language": settings.language,
        }
    
        self.CONFIG_FILE.write_text(
            json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    def load(self) -> Settings:
        if not self.CONFIG_FILE.exists():
            self.save(self._DEFAULTS)
            return self._DEFAULTS
        
        try:
            raw = json.loads(self.CONFIG_FILE.read_text(encoding="utf-8"))

            return Settings(
                download_directory=Path(raw["download_directory"]),
                default_quality=raw["default_quality"],
                ffmpeg_path=Path(raw["ffmpeg_path"]),
                naming_expression=raw.get("naming_expression", "{artist} - {title:title}"),
                folder_mode=raw.get("folder_mode", "default"),
                auto_max_quality=raw.get("auto_max_quality", False),
                create_subfolder=raw.get("create_subfolder", False),
                language=raw.get("language", "auto"),
            )
        
        except (json.JSONDecodeError, KeyError, TypeError):
            self.save(self._DEFAULTS)
            return self._DEFAULTS

    def update_naming_expression(self, expression: str) -> Settings:
        settings = self.load()
        settings.naming_expression = expression.strip() or "{artist} - {title:title}"
        self.save(settings)
        return settings

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

    def update_folder_mode(self, mode: str) -> Settings:
        if mode not in ("default", "manual"):
            raise ValueError(f"Modo de carpeta inválido: {mode}")

        settings = self.load()
        settings.folder_mode = mode
        self.save(settings)
        return settings

    def update_create_subfolder(self, value: bool) -> Settings:
        settings = self.load()
        settings.create_subfolder = value
        self.save(settings)
        return settings

    def update_auto_max_quality(self, value: bool) -> Settings:
        settings = self.load()
        settings.auto_max_quality = value
        self.save(settings)
        return settings

    def update_language(self, language: str) -> Settings:
        if language not in ("auto", "es", "en"):
            raise ValueError(f"Idioma inválido: {language}")
        settings = self.load()
        settings.language = language
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