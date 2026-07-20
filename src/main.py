import sys, os
from pathlib import Path

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.download_request import DownloadRequest
from app.controllers.download_controller import DownloadController
from app.services.youtube_service import YoutubeService
from app.exceptions.video_download_exceptions import VideoDownloadError

def main():
    youtube_service = YoutubeService()
    download_controller = DownloadController(youtube_service)

    while True:
        url = input("Pega la URL de YouTube (o 'salir'): ").strip()
        if url.lower() == "salir":
            return
        
        try:
            video = download_controller.get_video(url)
        except VideoDownloadError as e:
            print(f"\n⚠ {e}\n")
            continue
        
        options = download_controller.get_download_options(video)

        print(f"\nTítulo : {video.title}")
        print(f"Canal  : {video.uploader}")
        print(f"Duración: {video.duration_seconds} segundos")

        for index, option in enumerate(options, start=1):
            print(f"{index}. {option.label}")

        try:
            selected = int(input("\nSeleccione una opción: ")) - 1
            selected_option = options[selected]
        except (ValueError, IndexError):
            print("\n⚠ Opción inválida.\n")
            continue

        request = DownloadRequest(url=url, output_directory=Path("downloads"), options=selected_option)

        try:
            download_controller.download(request)
            print("\n✔ Descarga completada.\n")
        except VideoDownloadError as e:
            print(f"\n⚠ {e}\n")

        break

if __name__ == "__main__":
    main()