const DEFAULT_COOLDOWN_MS = 800;

export function createActionLock(DEFAULT_COOLDOWN_MS) {
    const locked = new Set();

    return {
        isLocked(key) {
            return locked.has(key);
        },
        async run(key, fn) {
            if (locked.has(key)) return;
            locked.add(key);
            try {
                await fn();
            } finally {
                setTimeout(() => locked.delete(key), cooldownMs);
            }
        },
    };
}