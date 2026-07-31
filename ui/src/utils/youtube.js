export function extractYoutubeId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{11})/);
    return match ? match[1] : null;
}