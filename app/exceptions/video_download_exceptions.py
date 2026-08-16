class VideoDownloadError(Exception):
    """Excepción base del dominio de descarga."""


class VideoNotFoundError(VideoDownloadError):
    """URL inválida o el video no existe."""


class VideoUnavailableError(VideoDownloadError):
    """Video privado, restringido por edad o bloqueado en la región."""


class FFmpegNotFoundError(VideoDownloadError):
    """No se encontró el ejecutable de ffmpeg en tools/ffmpeg."""


class DownloadFailedError(VideoDownloadError):
    """Falla genérica durante la descarga/merge."""

class PlaylistUnavailableError(VideoDownloadError):
    """Playlist privada, eliminada o no accesible públicamente."""