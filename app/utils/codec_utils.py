VIDEO_CODEC_PRIORITY = {
    "avc1": 0,
    "vp9": 1,
    "av1": 2,
    "h264": 3,
}

AUDIO_CODEC_PRIORITY = {
    "mp4a": 0,
    "opus": 1,
}

AUDIO_OUTPUT_FORMATS = [
    ("mp3", "MP3"),
    ("m4a", "M4A (AAC)"),
    ("wav", "WAV"),
    ("flac", "FLAC"),
    ("vorbis", "OGG"),
]

UNKNOWN_CODEC_PRIORITY = 99

def video_codec_name(codec: str) -> str:
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
    
def audio_codec_name(codec: str) -> str:
    codec = codec.lower()
    if codec.startswith("mp4a"):
        return "mp4a"
    if codec.startswith("opus"):
        return "opus"
    return codec