export async function runWithConcurrency(items, worker, concurrency) {
    const queue = [...items];

    const runners = Array.from({ length: concurrency }, async () => {
        while (queue.length) {
            const item = queue.shift();
            await worker(item);
        }
    });
    await Promise.all(runners);
}

export function resolveConcurrency(totalItems) {
    if (totalItems <= 10) return 2;
    if (totalItems <= 50) return 4;
    if (totalItems <= 150) return 6;
    return 8;
}