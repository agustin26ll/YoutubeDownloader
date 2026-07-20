from pathlib import Path

import yt_dlp
from app.models.video import Video
from app.models.download_option import DownloadOption
from app.services.video_format_parser import VideoFormatParser
from app.services.format_selector import FormatSelector
from app.services.download_option_builder import DownloadOptionBuilder
from app.models.download_request import DownloadRequest


from app.exceptions.video_download_exceptions import (
    VideoNotFoundError,
    VideoUnavailableError,
    FFmpegNotFoundError,
    DownloadFailedError,
)

from app.utils.url_validator import is_youtube_url

_UNAVAILABLE_MARKERS = (
    "private video",
    "sign in to confirm your age",
    "not available in your country",
    "video is unavailable",
    "this video has been removed",
)

class YoutubeService:

    DOWNLOADS_FOLDER = Path("downloads")
    DOWNLOADS_FOLDER.mkdir(exist_ok=True)

    def __init__(
            self,
            parser: VideoFormatParser | None = None,
            selector: FormatSelector | None = None,
            builder: DownloadOptionBuilder | None = None
        ):
        self.parser = parser or VideoFormatParser()
        self.selector = selector or FormatSelector()
        self.builder = builder or DownloadOptionBuilder()
    
    def get_video(self, url: str) -> Video:
        if not is_youtube_url(url):
            raise VideoNotFoundError("La URL no corresponde a un video de YouTube válido.")
        
        info = self._extract_info(url)
        all_formats = self.parser.parse_formats(info)

        video_formats = self.selector.select_available_video_formats(all_formats)
        audio_formats = self.selector.select_available_audio_formats(all_formats)

        return Video(
            title=info.get("title"),
            uploader=info.get("uploader"),
            duration_seconds=info.get("duration"),
            thumbnail=info.get("thumbnail"),
            webpage_url=info.get("webpage_url"),
            video_formats=video_formats,
            audio_formats=audio_formats,
        )

    def get_download_options(self, video: Video) -> list[DownloadOption]:
        best_audio = self.selector.get_best_audio(video.audio_formats)

        return self.builder.build_options(video.video_formats, best_audio)
    
    def download(self, request: DownloadRequest) -> None:
        if not Path("tools/ffmpeg/ffmpeg.exe").exists():
            raise FFmpegNotFoundError("No se encontró ffmpeg en tools/ffmpeg. Reinstala la aplicación.")
        
        options = self._build_download_options(request)

        try:
            with yt_dlp.YoutubeDL(options) as ydl:
                ydl.download([request.url])
        except yt_dlp.utils.DownloadError as e:
            raise DownloadFailedError(str(e)) from e

    def _extract_info(self, url:str) -> dict:
        try:
            with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
                return ydl.extract_info(url, download=False)
        except yt_dlp.utils.DownloadError as e:
            message = str(e).lower()
            if any(marker in message for marker in _UNAVAILABLE_MARKERS):
                raise VideoUnavailableError(
                     "Este video no está disponible en tu región, es privado o tiene restricción de edad. "
                    "Si usas VPN, verifica que esté activa e intenta de nuevo."
                ) from e
            raise VideoNotFoundError("No se pudo obtener información del video. Verifica la URL.") from e
        
    def _build_download_options(self, request: DownloadRequest) -> dict:
        return {
            "format": request.options.format_string,
            "merge_output_format": "mp4",
            "ffmpeg_location": str(Path("tools/ffmpeg")),
            "outtmpl": str(request.output_directory / "%(title)s.%(ext)s"),
            "noplaylist": True,
            "restrictfilenames": True,
            "socket_timeout": 15,
        }
        