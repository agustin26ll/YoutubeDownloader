const CHECK_INTERVAL_MS = 30000;
const CHECK_URL = "https://www.google.com/generate_204";

export function startConnectionMonitor(onStatusChange) {
    let isOnline = navigator.onLine;

    onStatusChange(isOnline)

    window.addEventListener("online", () => {
        isOnline = true;
        onStatusChange(true);
    })

    window.addEventListener("offline", () => {
        isOnline = false;
        onStatusChange(false);
    });

    const activeCheck = async () => {
        try {
            await fetch(CHECK_URL, { mode: "no-cors", cache: "no-store" });

            if (!isOnline) {
                isOnline = true;
                onStatusChange(true);

            }
        } catch {
            if (isOnline) {
                isOnline = false;
                onStatusChange(false);
            }
        }
    };

    const intervalId = setInterval(activeCheck, CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
}