import yt_dlp

from app.models.playlist import Playlist
from app.models.playlist_item import PlaylistItem
from app.exceptions.video_download_exceptions import PlaylistUnavailableError, VideoNotFoundError
from app.utils.url_validator import is_youtube_url

_UNAVAILABLE_MARKERS = (
    "private",
    "sign in",
    "not available",
    "unavailable",
    "removed",
)


class PlaylistService:

    def is_playlist_url(self, url: str) -> bool:
        return "list=" in url

    def get_playlist(self, url: str) -> Playlist:
        if not is_youtube_url(url):
            raise VideoNotFoundError("La URL no corresponde a un video de YouTube válido.")

        info = self._extract_flat(url)

        entries = info.get("entries") or []
        items = [self._parse_item(entry) for entry in entries if entry]

        return Playlist(
            title=info.get("title") or "Lista de reproducción",
            uploader=info.get("uploader") or info.get("channel") or "",
            items=items,
        )

    def _extract_flat(self, url: str) -> dict:
        options = {"quiet": True, "extract_flat": "in_playlist", "skip_download": True}
        try:
            with yt_dlp.YoutubeDL(options) as ydl:
                return ydl.extract_info(url, download=False)
        except yt_dlp.utils.DownloadError as e:
            message = str(e).lower()
            if any(marker in message for marker in _UNAVAILABLE_MARKERS):
                raise PlaylistUnavailableError(
                    "Esta lista es privada o no está disponible públicamente."
                ) from e
            raise VideoNotFoundError("No se pudo obtener información de la lista.") from e

    def _parse_item(self, entry: dict) -> PlaylistItem:
        video_id = entry.get("id", "")
        return PlaylistItem(
            video_id=video_id,
            url=entry.get("url") or f"https://www.youtube.com/watch?v={video_id}",
            title=entry.get("title") or "Video",
            duration_seconds=entry.get("duration") or 0,
            thumbnail=entry.get("thumbnails", [{}])[-1].get("url", "") if entry.get("thumbnails") else "",
        )