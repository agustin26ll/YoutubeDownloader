from dataclasses import dataclass

@dataclass(slots=True)
class DownloadHistoryEntry:
    id: str
    url: str
    title: str
    uploader: str
    thumbnail: str
    duration_seconds: int
    quality_label: str
    output_directory: str
    filename: str
    extension: str
    is_audio: bool
    format_string: str
    audio_codec: str | None
    downloaded_at: str