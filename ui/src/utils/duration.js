const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;

export function formatDuration(totalSeconds) {
    if (totalSeconds === null || totalSeconds === undefined) return "";

    const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
    const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const seconds = Math.floor(totalSeconds % SECONDS_PER_MINUTE);
    const pad = (n) => String(n).padStart(2, "0");

    if (hours > 0) {
        return `${hours}:${pad(minutes)}:${pad(seconds)} H`;
    }
    return `${minutes}:${pad(seconds)} Min`;
}