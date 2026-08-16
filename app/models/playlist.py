from dataclasses import dataclass, field
from app.models.playlist_item import PlaylistItem

@dataclass(slots=True)
class Playlist:
    title: str
    uploader: str
    items: list[PlaylistItem] = field(default_factory=list)