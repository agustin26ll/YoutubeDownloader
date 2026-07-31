import re

_NOISE_PATTERNS = [
    r"\(?\s*official\s+video\s*\)?",
    r"\(?\s*official\s+music\s+video\s*\)?",
    r"\(?\s*official\s+audio\s*\)?",
    r"\(?\s*official\s+lyric\s+video\s*\)?",
    r"\(?\s*video\s+oficial\s*\)?",
    r"\(?\s*audio\s+oficial\s*\)?",
    r"\(?\s*lyric\s+video\s*\)?",
]

_INVALID_FILENAME_CHARS = r'[\\/:*?"<>|]'

_MAX_FILENAME_LENGTH = 150


def clean_title(title: str) -> str:
    cleaned = title

    for pattern in _NOISE_PATTERNS:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)

    cleaned = cleaned.replace("_", " ")
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = cleaned.strip(" -|")

    return cleaned.strip()


def sanitize_filename(name: str) -> str:
    sanitized = re.sub(_INVALID_FILENAME_CHARS, "", name)
    sanitized = sanitized.strip(" .")

    if not sanitized:
        sanitized = "video"

    return sanitized[:_MAX_FILENAME_LENGTH]