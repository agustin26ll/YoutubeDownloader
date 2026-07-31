import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, "../", "");

    return {
        root: ".",
        base: "./",
        envDir: "../",
        build: {
            outDir: "dist",
            emptyOutDir: true,
        },
        server: {
            port: parseInt(env.VITE_DEV_PORT || "5173"),
            strictPort: true,
        },
    };
});