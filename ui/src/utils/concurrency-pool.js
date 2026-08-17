export async function runWithConcurrency(items, worker, concurrency, delayMs= 0) {
    const queue = [...items];

    const runners = Array.from({ length: concurrency }, async () => {
        while (queue.length) {
            const item = queue.shift();
            await worker(item);
            if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    });
    await Promise.all(runners);
}

export function resolveConcurrency(totalItems) {
    if (totalItems <= 10) return 2;
    if (totalItems <= 50) return 3;
    if (totalItems <= 150) return 4;
    return 5;
}