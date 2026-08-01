from app.models.video_format import VideoFormat

from dataclasses import dataclass

@dataclass(slots=True)
class DownloadOption:
    label: str
    video_format: VideoFormat | None
    audio_format: VideoFormat | None
    format_string: str
    is_audio: bool
    audio_codec: str | None = None