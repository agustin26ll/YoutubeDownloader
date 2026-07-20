import re

_YOUTUBE_PATTERN = re.compile(
    r"^https?://(www\.|m\.)?(youtube\.com|youtu\.be)/"
)


def is_youtube_url(url: str) -> bool:
    return bool(_YOUTUBE_PATTERN.match(url.strip()))