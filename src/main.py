import sys, os
from pathlib import Path

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.download_request import DownloadRequest
from app.controllers.download_controller import DownloadController
from app.services.youtube_service import YoutubeService

def main():
    youtube_service = YoutubeService()
    download_controller = DownloadController(youtube_service)

    url = input("Pega la URL de YouTube: ").strip()
    video = download_controller.get_video(url)
    options = download_controller.get_download_options(video)

    print(f"\nTítulo : {video.title}")
    print(f"Canal  : {video.uploader}")
    print(f"Duración: {video.duration_seconds} segundos")

    for fmt in video.video_formats:
        print(fmt)

    for index, option in enumerate(options, start=1):
        print(f"{index}. {option.label}")
    
    selected = int(input("\nSeleccione una opción: ")) - 1

    selected_option = options[selected]

    request = DownloadRequest(url=url, output_directory=Path("downloads"), options=selected_option)

    download_controller.download(request)

if __name__ == "__main__":
    main()