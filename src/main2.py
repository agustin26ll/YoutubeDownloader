from pathlib import Path
import yt_dlp


# ==========================================================
# CONFIGURACIÓN
# ==========================================================

FFMPEG_PATH = Path("tools/ffmpeg")



DOWNLOAD_FOLDER = Path("downloads")
DOWNLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

YDL_OPTIONS = {
    "format": (
        "bestvideo[vcodec^=avc1][height<=1080]+bestaudio[acodec^=mp4a]/"
        "best[vcodec^=avc1][height<=1080]/"
        "best[height<=1080]"
    ),
    "merge_output_format": "mp4",
    "ffmpeg_location": str(FFMPEG_PATH),
    "outtmpl": str(DOWNLOAD_FOLDER / "%(title)s.%(ext)s"),
    "noplaylist": True,
}

try:
    video_url = input("Pega la URL de YouTube: ").strip()

    print("\nObteniendo información del video...\n")

    with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
        info = ydl.extract_info(video_url, download=False)

    print(f"Título : {info.get('title')}")
    print(f"Canal  : {info.get('uploader')}")
    print(f"Duración: {info.get('duration')} segundos")
    
    for fmt in info["formats"]:
        print(fmt)

    respuesta = input("\n¿Deseas descargar este video? (s/n): ").lower()

    if respuesta != "s":
        print("Operación cancelada.")
        exit()

    print("\nIniciando descarga...\n")

    with yt_dlp.YoutubeDL(YDL_OPTIONS) as ydl:
        ydl.download([video_url])


    print("\nDescarga completada correctamente.")
    print(f"Archivo guardado en: {DOWNLOAD_FOLDER.resolve()}")

except Exception as e:
    print("\nHa ocurrido un error:")
    print(e)