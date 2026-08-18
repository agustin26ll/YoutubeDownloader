export async function runSequential(items, worker, delayMs = 300) {
    for (const item of items) {
        await worker(item);
        if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
}