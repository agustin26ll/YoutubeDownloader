from pathlib import Path
import time
import yt_dlp
from app.models.video import Video
from app.models.settings import Settings
from app.models.download_option import DownloadOption
from app.models.download_request import DownloadRequest
from app.services.format_selector import FormatSelector
from app.services.settings_service import SettingsService
from app.services.video_format_parser import VideoFormatParser
from app.services.download_option_builder import DownloadOptionBuilder
from app.services.filename_formatter import FilenameFormatter
from app.utils.text_cleaner import sanitize_filename
from app.utils.yt_dlp_options import base_ydl_options
from app.i18n.translator import t

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

_MAX_RETRIES = 2
_RETRY_BACKOFF_S = 3

class YoutubeService:

    DOWNLOADS_FOLDER = Path("downloads")
    DOWNLOADS_FOLDER.mkdir(exist_ok=True)

    def __init__(
            self,
            parser: VideoFormatParser | None = None,
            selector: FormatSelector | None = None,
            builder: DownloadOptionBuilder | None = None,
            settings_service: SettingsService | None = None,
            filename_formatter: FilenameFormatter | None = None,
        ):
        self.parser = parser or VideoFormatParser()
        self.selector = selector or FormatSelector()
        self.builder = builder or DownloadOptionBuilder()
        self.settings_service = settings_service or SettingsService()
        self.filename_formatter = filename_formatter or FilenameFormatter()

    def _extract_info(self, url: str) -> dict:
        last_error = None

        for attempt in range(_MAX_RETRIES + 1):
            try:
                options = {**base_ydl_options(), "quiet": True, "socket_timeout": 15 }
                with yt_dlp.YoutubeDL(options) as ydl:
                    return ydl.extract_info(url, download=False)
            except yt_dlp.utils.DownloadError as e:
                message = str(e).lower()

                if "429" in message or "too many requests" in message:
                    last_error = e
                    if attempt < _MAX_RETRIES:
                        time.sleep(_RETRY_BACKOFF_S * (attempt + 1))
                        continue

                if "sign in to confirm" in message or "not a bot" in message:
                    raise VideoUnavailableError(t("errors.bot_verification_required")) from e

                if any(marker in message for marker in _UNAVAILABLE_MARKERS):
                    raise VideoUnavailableError(t("errors.video_unavailable")) from e

                raise VideoNotFoundError(t("errors.video_not_found")) from e

        raise VideoUnavailableError(t("errors.rate_limited")) from last_error
            
    def _build_download_options(self, request: DownloadRequest, settings: Settings, filename: str) -> dict:
        base = {
            **base_ydl_options(),
            "ffmpeg_location": str(settings.ffmpeg_path),
            "outtmpl": str(request.output_directory / f"{filename}.%(ext)s"),
            "noplaylist": True,
            "socket_timeout": 15,
        }
    
        if request.options.is_audio:
            base.update({
                "format": "bestaudio/best",
                "postprocessors": [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": request.options.audio_codec,
                    "preferredquality": "192",
                }],
            })
        else:
            base.update({
                "format": request.options.format_string,
                "merge_output_format": "mp4",
            })
    
        return base
    
    def get_video(self, url: str) -> Video:
        if not is_youtube_url(url):
            raise VideoNotFoundError(t("errors.invalid_url"))

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
            artist=info.get("artist") or info.get("creator"),
            video_formats=video_formats,
            audio_formats=audio_formats,
        )

    def get_download_options(self, video: Video) -> list[DownloadOption]:
        best_audio = self.selector.get_best_audio(video.audio_formats)

        return self.builder.build_options(video.video_formats, best_audio)

    def get_audio_options(self, video: Video) -> list[DownloadOption]:
        best_audio = self.selector.get_best_audio(video.audio_formats)

        return self.builder.build_audio_options(best_audio)

    def download(self, request: DownloadRequest, progress_callback=None, custom_filename: str | None = None) -> str:
        settings = self.settings_service.load()
        ffmpeg_exe = settings.ffmpeg_path / "ffmpeg.exe"

        if not ffmpeg_exe.exists():
            raise FFmpegNotFoundError(t("errors.ffmpeg_missing"))

        video = self.get_video(request.url)
        filename = sanitize_filename(custom_filename) if custom_filename else self.filename_formatter.build(video, settings.naming_expression)

        output_directory = request.output_directory
        if settings.create_subfolder:
            subfolder_name = self.filename_formatter.build(video, settings.naming_expression)
            output_directory = output_directory / subfolder_name
            output_directory.mkdir(parents=True, exist_ok=True)

        effective_request = DownloadRequest(url=request.url, output_directory=output_directory, options=request.options)

        options = self._build_download_options(effective_request, settings, filename)
        if progress_callback:
            options["progress_hooks"] = [progress_callback]

        try:
            with yt_dlp.YoutubeDL(options) as ydl:
                ydl.download([request.url])
        except yt_dlp.utils.DownloadError as e:
            raise DownloadFailedError(str(e)) from e

        return filename, output_directory