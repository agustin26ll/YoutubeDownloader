import json
from pathlib import Path
from functools import lru_cache


_I18N_DIR=Path(__file__).resolve().parent
_DEFAULT_LOCALE = "es"

@lru_cache(maxsize=None)
def _load(locale: str) -> dict:
    path = _I18N_DIR / f"{locale}.json"

    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))

def t(key: str, locale: str = _DEFAULT_LOCALE) -> str:
    messages = _load(locale)
    value = messages

    for part in key.split("."):
        if not isinstance(value, dict) or part not in value:
            return key
        value = value[part]

    return value if isinstance(value, str) else key