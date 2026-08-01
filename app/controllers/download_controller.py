from app.models.video import Video
from app.models.download_option import DownloadOption
from app.models.download_request import DownloadRequest
from app.services.youtube_service import YoutubeService

class DownloadController:
    def __init__(self, youtube_service: YoutubeService):
        self.youtube_service = youtube_service

    def get_video(self, url: str) -> Video:
        video_info = self.youtube_service.get_video(url)
        return video_info
    
    def get_download_options(self, video: Video) -> list[DownloadOption]:
        return self.youtube_service.get_download_options(video)

    def get_audio_options(self, video: Video) -> list[DownloadOption]:
        return self.youtube_service.get_audio_options(video)
    
    def download(self, request: DownloadRequest, progress_callback=None) -> str:
        return self.youtube_service.download(request, progress_callback)