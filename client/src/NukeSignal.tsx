import { Component } from "solid-js"

// TODO: Add cloud video as mask for signal.

const NukeSignal: Component = () => {
    return (
        <section class="h-64 after:h-64 after:w-64 after:-translate-x-1/2 relative before:absolute before:h-64-25deg before:w-64-25deg before:-translate-x-1/2-25deg before:bg-floodlight before:[mask-image:radial-gradient(circle_at_1rem_8rem,transparent_0,black_100%)] after:absolute after:origin-top after:transform-gpu after:bg-signal after:bg-cover after:bg-center after:bg-no-repeat after:blur-signal after:drop-shadow-signal after:-rotate-x-signal after:rotate-y-signal" />
    )
}

export default NukeSignal
