from app.models.video_format import VideoFormat
from app.models.download_option import DownloadOption
from app.utils.codec_utils import video_codec_name

class DownloadOptionBuilder:
    """Construye DownloadOption a partir de VideoFormat ya seleccionados."""

    def build_options(self, video_formats: list[VideoFormat], best_audio: VideoFormat | None) -> list[DownloadOption]:
        return [self._build_option(fmt, best_audio) for fmt in video_formats]
    
    def _build_option(self, video_format: VideoFormat, audio_format: VideoFormat | None) -> DownloadOption:
        codec = video_codec_name(video_format.video_codec).upper()
        extension = video_format.extension.upper()

        format_string = (
            f"{video_format.format_id} + {audio_format.format_id}"
            if audio_format
            else video_format.format_id
        )

        return DownloadOption(
            label=f"{video_format.resolution}p ({extension} - {codec})",
            format_string=format_string,
            video_format=video_format,
            audio_format=audio_format,
            is_audio=False
        )

    def build_audio_options(self, best_audio: VideoFormat | None) -> list[DownloadOption]:
        if not best_audio:
            return []

        return [
            DownloadOption(
                label="MP3 (Audio)",
                format_string=best_audio.format_id,
                video_format=None,
                audio_format=best_audio,
                is_audio=True,
            )
        ]