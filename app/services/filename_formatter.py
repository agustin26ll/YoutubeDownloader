import re

from app.models.video import Video
from app.utils.text_cleaner import clean_title, sanitize_filename

_TOKEN_PATTERN = re.compile(r"\{(\w+)(?::(\w+))?\}")

_DEFAULT_EXPRESSION = "{artist} - {title:title}"

_SECONDS_PER_MINUTE = 60

class FilenameFormatter:

    def build(self, video: Video, expression: str | None = None) -> str:
        expression = expression or _DEFAULT_EXPRESSION

        result = _TOKEN_PATTERN.sub(
            lambda match: self._resolve_token(video, match.group(1), match.group(2)),
            expression,
        )

        result = re.sub(r"\s+", " ", result).strip(" -")

        if not result:
            result = clean_title(video.title)

        return sanitize_filename(result)

    def _resolve_token(self, video: Video, token: str, modifier: str | None) -> str:
        value = self._token_value(video, token)
        return self._apply_modifier(value, modifier)

    def _token_value(self, video: Video, token: str) -> str:
        if token == "title":
            return clean_title(video.title)
        if token == "original_title":
            return video.title
        if token == "artist":
            return video.artist or video.uploader
        if token == "channel":
            return video.uploader
        if token == "duration":
            return self._format_duration(video.duration_seconds)
        return ""

    def _apply_modifier(self, value: str, modifier: str | None) -> str:
        if modifier == "upper":
            return value.upper()
        if modifier == "lower":
            return value.lower()
        if modifier == "title":
            return value.title()
        return value

    def _format_duration(self, seconds: int) -> str:
        minutes, secs = divmod(seconds, _SECONDS_PER_MINUTE)
        return f"{minutes}:{secs:02d}"