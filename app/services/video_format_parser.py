from app.models.video_format import VideoFormat

class VideoFormatParser:
    """Convierte los dict crudos de YTDLP en objetos VideoFormat."""

    def parse_formats(self, info: dict) -> list[VideoFormat]:
        return [self.parse_format(fmt) for fmt in info.get("formats", [])]
    
    def parse_format(self, fmt: dict) -> VideoFormat:
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