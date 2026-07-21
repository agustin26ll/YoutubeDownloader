export async function getVideoInfo(url) {
    return await window.pywebview.api.get_video(url);
}