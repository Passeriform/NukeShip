import { flicker, glitchFont, glitchMovement, glitchOpacity, glitchPath, slowBlink } from "./src/animations"

/** @type {import("tailwindcss").Config} */
export default {
    mode: "jit",
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    purge: {
        enabled: process.env.NODE_ENV === "production",
        safeList: [],
        content: ["./index.html", "./src/**/*.{ts,tsx}"],
    },
    /* TODO: Add Light Theme */
    theme: {
        fontSize: {
            "xs": "0.75rem",
            "base": "1rem",
            "2xl": "1.5rem",
            "4xl": "2rem",
            "9xl": "8rem",
        },
        fontFamily: {
            title: ["Orbitron", "sans-serif"],
            default: ["Fugaz One", "sans-serif"],
        },
        dropShadow: {
            tilt: "0.2rem 0.2rem 3px",
            spinner: "0 1px 2px",
            default: "0 1px 3px",
        },
        textShadow: {
            default: "0 0 8px #00d6fc66",
        },
        letterSpacing: {
            normal: 0,
            wide: "0.1125rem",
        },
        rotate: {
            25: "25deg",
        },
        clipPath: {
            floodlight: "polygon(9rem 1.9rem, 100% 100%, 0 14.7rem)",
            pleat: "polygon(0 0, 5rem 0, 3rem 100%, 0 100%)",
        },
        extend: {
            width: {
                "64-25deg": "32rem",
                "full-extend": "110%",
            },
            height: {
                "64-25deg": "42rem",
            },
            inset: {
                "1/8": "12.5%",
            },
            lineHeight: {
                "tight": "0.125rem",
                "tight-symbol": "1.5rem",
            },
            backgroundImage: {
                city: "url(https://images.unsplash.com/photo-1551712766-817b7d0e8291?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80)",
                signal: "url(assets/radioactive.svg)",
                floodlight:
                    "conic-gradient(from -0.111turn at 100% 100%, #b4bbf425 0deg, transparent 12deg 351deg, #b4bbf425 360deg)",
                divider: "repeating-linear-gradient(-45deg, #00d6fc, #00d6fc 10px, transparent 10px, transparent 20px)",
            },
            boxShadow: {
                sm: "1px 1px 8px var(--tw-shadow-color)",
            },
            saturate: {
                lesser: 0.8,
            },
            hueRotate: {
                45: "45deg",
            },
            blur: {
                mist: "2px",
                px: "1px",
            },
            translate: {
                "1/2-25deg": "3rem",
            },
            spacing: {
                "1/10": "10%",
                "114": "28.5rem",
            },
            keyframes: {
                "flicker": flicker,
                "glitch-path": glitchPath,
                "glitch-opacity": glitchOpacity,
                "glitch-font": glitchFont,
                "glitch-movement": glitchMovement,
                "slow-blink": slowBlink,
            },
            animation: {
                "flicker": "flicker 2s linear alternate infinite",
                "glitch-base": "glitch-path 5s step-end infinite",
                "glitch-alpha":
                    "glitch-path 5s step-end infinite, glitch-opacity 5s step-end infinite, glitch-font 8s step-end infinite, glitch-movement 10s step-end infinite",
                "glitch-beta":
                    "glitch-path 5s step-end infinite, glitch-opacity 5s step-end infinite, glitch-font 7s step-end infinite, glitch-movement 8s step-end infinite",
                "slow-blink": "slow-blink 3s linear alternate infinite",
            },
            colors: {
                "dark-turquoise": "#00ced1",
                "medium-slate-blue": "#7b68ee",
                "black-blue": "#151e29",
                "midnight-blue": "#141b32",
                "black-russian": "#0a001c",
                "elderberry": "#17182b",
                "nile-blue": "#193751",
                "vivid-cerise": "#da1d81",
                "spiro-disco-ball": "#0fc0fc",
            },
        },
    },
    plugins: [
        require("@xpd/tailwind-3dtransforms"),
        require("tailwind-clip-path"),
        require("@pyncz/tailwind-mask-image"),
        require("tailwindcss-textshadow"),
    ],
}
