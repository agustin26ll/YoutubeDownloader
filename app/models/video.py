from app.models.video_format import VideoFormat

from dataclasses import dataclass, field

@dataclass(slots=True)

class Video:
    title: str
    uploader: str
    duration_seconds: int
    thumbnail: str
    webpage_url: str
    video_formats: list[VideoFormat] = field(default_factory=list)
    audio_formats: list[VideoFormat] = field(default_factory=list)
    