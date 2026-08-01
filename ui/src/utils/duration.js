export function formatDuration(totalSeconds) {
    if (totalSeconds === null || totalSeconds === undefined) return "";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const pad = (n) => String(n).padStart(2, "0");

    if (hours > 0) {
        return `${hours}:${pad(minutes)}:${pad(seconds)} H`;
    }
    return `${minutes}:${pad(seconds)} Min`;
}