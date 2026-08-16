from dataclasses import dataclass

@dataclass(slots=True)
class PlaylistItem:
    video_id: str
    url: str
    title: str
    duration_seconds: int
    thumbnail: str