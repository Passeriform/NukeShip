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
            "@constants": path.resolve(__dirname, "./src/constants"),
            "@game": path.resolve(__dirname, "./src/game"),
            "@hooks": path.resolve(__dirname, "./src/hooks"),
            "@pages": path.resolve(__dirname, "./src/pages"),
            "@utility": path.resolve(__dirname, "./src/utility"),
            "@wails": path.resolve(__dirname, "./wailsjs"),
        },
    },
})
