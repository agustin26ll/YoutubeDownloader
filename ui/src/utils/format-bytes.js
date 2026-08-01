export function formatMB(mb) {
    if (mb === null || mb === undefined) return "";
    return `${mb.toFixed(1)} MB`;
}

export function formatEta(seconds) {
    if (!seconds && seconds !== 0) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}