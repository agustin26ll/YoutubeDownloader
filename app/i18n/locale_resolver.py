import ctypes
import locale


def detect_system_locale() -> str:
    try:
        lcid = ctypes.windll.kernel32.GetUserDefaultUILanguage()
        lang_code = locale.windows_locale.get(lcid, "en")
    except Exception:
        lang_code = "en"

    return "es" if lang_code.lower().startswith("es") else "en"


def resolve_locale(settings) -> str:
    if settings.language in ("es", "en"):
        return settings.language
    return detect_system_locale()