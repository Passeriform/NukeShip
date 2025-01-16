import path from "path"
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"

export default defineConfig({
    build: {
        target: "esnext",
    },
    plugins: [solid()],
    resolve: {
        alias: {
            "@animations": path.resolve(__dirname, "./src/animations"),
            "@assets": path.resolve(__dirname, "./src/assets"),
            "@components": path.resolve(__dirname, "./src/components"),
            "@hooks": path.resolve(__dirname, "./src/hooks"),
            "@pages": path.resolve(__dirname, "./src/pages"),
            "@wails": path.resolve(__dirname, "./wailsjs"),
        },
    },
})
