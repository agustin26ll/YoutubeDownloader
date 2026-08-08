let readyPromise = null;

export function pywebviewReady() {
    if (readyPromise) return readyPromise;

    readyPromise = new Promise((resolve) => {
        if (window.pywebview?.api) {
            resolve();
            return;
        }
        window.addEventListener("pywebviewready", () => resolve(), { once: true });
    });

    return readyPromise;
}