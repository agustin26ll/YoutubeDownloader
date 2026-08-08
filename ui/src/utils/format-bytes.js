const SECONDS_PER_MINUTE = 60;

export function formatMB(mb) {
    if (mb === null || mb === undefined) return "";
    return `${mb.toFixed(1)} MB`;
}

export function formatEta(seconds) {
    if (!seconds && seconds !== 0) return "";
    const m = Math.floor(seconds / SECONDS_PER_MINUTE);
    const s = seconds % SECONDS_PER_MINUTE;
    return `${m}:${String(s).padStart(2, "0")}`;
}