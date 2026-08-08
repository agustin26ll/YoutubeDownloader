from app.models.video_format import VideoFormat
from app.utils.codec_utils import (
    VIDEO_CODEC_PRIORITY,
    AUDIO_CODEC_PRIORITY,
    UNKNOWN_CODEC_PRIORITY,
    video_codec_name,
    audio_codec_name
)


class FormatSelector:
    """Filtra, deduplica y selecciona los mejores formatos de video/audio"""

    def select_available_video_formats(self, formats: list[VideoFormat]) -> list[VideoFormat]:
        formats = self._filter_video_formats(formats)
        formats = self._remove_duplicate_resolutions(formats)
        return sorted(formats, key=lambda f: f.resolution)
        
    def select_available_audio_formats(self, formats: list[VideoFormat]) -> list[VideoFormat]:
        return [fmt for fmt in formats if fmt.is_audio and not fmt.is_video]
    
    def get_best_audio(self, formats: list[VideoFormat]) -> VideoFormat | None:
        audio_formats = [fmt for fmt in formats if fmt.is_audio]
        
        if not audio_formats:
            return None
        
        audio_formats.sort(
            key=lambda fmt:(
                AUDIO_CODEC_PRIORITY.get(audio_codec_name(fmt.audio_codec), UNKNOWN_CODEC_PRIORITY),
                -(fmt.file_size or 0),
            )
        )
        
        return audio_formats[0]
        
    def _filter_video_formats(self, formats: list[VideoFormat]) -> list[VideoFormat]:
        return [fmt for fmt in formats if fmt.is_video and fmt.resolution is not None and fmt.resolution >= 144]
    
    def _remove_duplicate_resolutions(self, formats: list[VideoFormat]) -> list[VideoFormat]:
        selected: dict[int, tuple[int, VideoFormat]] = {}
    
        for fmt in formats:
            codec = video_codec_name(fmt.video_codec)
            priority = VIDEO_CODEC_PRIORITY.get(codec, UNKNOWN_CODEC_PRIORITY)
            current = selected.get(fmt.resolution)

            if current is None:
                selected[fmt.resolution] = (priority, fmt)
                continue

            if priority < current[0]:
                selected[fmt.resolution] = (priority, fmt)

        return [item[1] for item in selected.values()]