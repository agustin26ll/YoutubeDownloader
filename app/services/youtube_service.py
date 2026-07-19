from pathlib import Path

import yt_dlp
from app.models.video import Video
from app.models.download_option import DownloadOption
from app.services.video_format_parser import VideoFormatParser
from app.services.format_selector import FormatSelector
from app.services.download_option_builder import DownloadOptionBuilder
from app.models.download_request import DownloadRequest


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
        options = self._build_download_options(request)
        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([request.url])

    def _extract_info(self, url:str) -> dict:
        with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
            return ydl.extract_info(url, download=False)
        
    def _build_download_options(self, request: DownloadRequest) -> dict:
        return {
            "format": request.options.format_string,
            "merge_output_format": "mp4",
            "ffmpeg_location": str(Path("tools/ffmpeg")),
            "outtmpl": str(request.output_directory / "%(title)s.%(ext)s"),
            "noplaylist": True,
        }
        