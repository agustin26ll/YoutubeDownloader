from dataclasses import dataclass

@dataclass(slots=True)

class VideoFormat:
    format_id: str
    extension: str
    resolution: int | None
    fps: int
    video_codec: str
    audio_codec: str
    file_size: int | None
    is_video: bool
    is_audio: bool

