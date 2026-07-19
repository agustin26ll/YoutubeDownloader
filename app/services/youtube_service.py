from pathlib import Path
from app.models.video import Video
from app.models.video_format import VideoFormat
from app.models.download_option import DownloadOption
from app.models.download_request import DownloadRequest

import yt_dlp

class YoutubeService:

    DOWNLOADS_FOLDER = Path("downloads")
    DOWNLOADS_FOLDER.mkdir(exist_ok=True)

    _CODEC_PRIORITY = {
        "avc1": 0,
        "vp9": 1,
        "av1": 2,   
        "h264": 3,
    }
    
    def get_video(self, url: str) -> Video:
        info = self._extract_info(url)

        all_formats = self._parse_formats(info)

        video_formats = self._select_available_formats(all_formats)
        audio_formats = self._select_available_audio_formats(all_formats)

        return self._parse_video(info, video_formats, audio_formats)

    def _extract_info(self, url: str) -> dict:
        with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
            return ydl.extract_info(url, download=False)
        
    def _parse_video(self, info: dict, video_formats: list[VideoFormat], audio_formats: list[VideoFormat]) -> Video:

        return Video(
            title=info.get("title"),
            uploader=info.get("uploader"),
            duration_seconds=info.get("duration"),
            thumbnail=info.get("thumbnail"),
            webpage_url=info.get("webpage_url"),
            video_formats=video_formats,
            audio_formats=audio_formats
        )

    def _parse_formats(self, info: dict) -> list[VideoFormat]:
        return [
            self._parse_format(fmt)
            for fmt in info.get("formats", [])
        ]


    def _parse_format(self, fmt: dict) -> VideoFormat:
        return VideoFormat(
            format_id=fmt.get("format_id", ""),
            extension=fmt.get("ext", ""),
            resolution=fmt.get("height"),
            fps=fmt.get("fps"),
            video_codec=fmt.get("vcodec", ""),
            audio_codec=fmt.get("acodec", ""),
            file_size=fmt.get("file_size"),
            is_video=fmt.get("vcodec") != "none",
            is_audio=fmt.get("acodec") != "none"
        )


    def _select_available_formats(self, formats: list[VideoFormat]) -> list[VideoFormat]:

        formats = self._filter_video_formats(formats)
        formats = self._remove_duplicate_resolutions(formats)

        return sorted(
            formats,
            key=lambda f: f.resolution
        )
    
    def _select_available_audio_formats(self, formats: list[VideoFormat]) -> list[VideoFormat]:
        return [fmt for fmt in formats if fmt.is_audio and not fmt.is_video]
    
    def _filter_video_formats(self, formats: list[VideoFormat])-> list[VideoFormat]:
        
        return [
            fmt 
            for fmt in formats
            if (
                fmt.is_video
                and fmt.resolution is not None
                and fmt.resolution >= 144
            )
        ]
    
    def _remove_duplicate_resolutions(self, formats: list[VideoFormat]) -> list[VideoFormat]:
        
        selected = {}
        
        for fmt in formats:
            codec = self._codec_name(fmt.video_codec)
            priority = self._CODEC_PRIORITY.get(codec, 99)
            current = selected.get(fmt.resolution)

            if current is None:
                selected[fmt.resolution] = (priority, fmt)
                continue

            if priority < current[0]:
                selected[fmt.resolution] = (priority, fmt)

            return [item[1] for item in selected.values()]
        
    def _codec_name(self, codec: str) -> str:
        if codec.startswith("avc1"):
            return "avc1"
        elif codec.startswith("vp9"):
            return "vp9"
        elif codec.startswith("av1"):
            return "av1"
        elif codec.startswith("h264"):
            return "h264"
        else:
            return codec
    
    def get_download_options(self, video: Video) -> list[DownloadOption]:

        best_audio = self._get_best_audio(
            video.audio_formats
        )
        
        return [
            self._create_download_option(fmt, best_audio)
            for fmt in video.video_formats
        ]
    
    def _create_download_option(self, video_format: VideoFormat,audio_format: VideoFormat | None) -> DownloadOption:

        codec = self._codec_name(video_format.video_codec).upper()

        extension = video_format.extension.upper()

        if audio_format:

            format_string = (
                f"{video_format.format_id}"
                f"+{audio_format.format_id}"
            )

        else:

            format_string = video_format.format_id

        return DownloadOption(

            label=(
                f"{video_format.resolution}p "
                f"({extension} - {codec})"
            ),

            format_string=format_string,

            video_format=video_format,

            audio_format=audio_format,

            is_audio=False
        )
    
    def _get_best_audio(self, formats: list[VideoFormat]) -> VideoFormat | None:

        audio_formats = [fmt
            for fmt in formats if fmt.is_audio
        ]

        if not audio_formats:
            return None

        priority = {
            "mp4a": 0,
            "opus": 1,
            "mp3": 2
        }

        audio_formats.sort(
            key=lambda fmt: (priority.get(self._audio_codec_name(fmt.audio_codec), 99), -(fmt.file_size or 0))
        )

        return audio_formats[0]
    
    def _audio_codec_name(self, codec: str) -> str:

        codec = codec.lower()

        if codec.startswith("mp3"):
            return "mp3"

        if codec.startswith("mp4a"):
            return "mp4a"

        if codec.startswith("opus"):
            return "opus"

        return codec
    
    def download(self, request: DownloadRequest):

        options = self._build_download_options(request)
        
        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([request.url])

    def _build_download_options(self, request: DownloadRequest) -> dict:
        
        options = {
            "format": request.options.format_string,
            "merge_output_format": "mp4",
            "ffmpeg_location": str(Path("tools/ffmpeg")),
            "outtmpl": str(
                request.output_directory /
                "%(title)s.%(ext)s"
            ),
            "noplaylist": True,
        }

        return options