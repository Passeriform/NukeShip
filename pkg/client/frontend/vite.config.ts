import path from "path"
import { defineConfig } from "vite"
import glsl from "vite-plugin-glsl"
import solid from "vite-plugin-solid"

const GAME_DIR_MATCHER = /src\/game\/.*\.[tj]sx?$/

export default defineConfig({
    build: {
        target: "esnext",
    },
    plugins: [
        solid({
            include: GAME_DIR_MATCHER,
            solid: { moduleName: "solid-three", generate: "universal" },
        }),
        solid({
            exclude: GAME_DIR_MATCHER,
            solid: { generate: "dom" },
        }),
        glsl(),
    ],
    resolve: {
        alias: {
            "@animations": path.resolve(__dirname, "./src/animations"),
            "@assets": path.resolve(__dirname, "./src/assets"),
            "@components": path.resolve(__dirname, "./src/components"),
            "@constants": path.resolve(__dirname, "./src/constants"),
            "@game": path.resolve(__dirname, "./src/game"),
            "@hooks": path.resolve(__dirname, "./src/hooks"),
            "@pages": path.resolve(__dirname, "./src/pages"),
            "@shaders": path.resolve(__dirname, "./src/shaders"),
            "@utility": path.resolve(__dirname, "./src/utility"),
            "@wails": path.resolve(__dirname, "./wailsjs"),
        },
    },
})
