import { VoidComponent } from "solid-js"

// TODO: Add cloud video as mask for signal.
// TODO: Add periodic flickering animation for signal.

const NukeSignal: VoidComponent = () => {
    return (
        <section class="relative h-64 before:absolute before:h-64-25deg before:w-64-25deg before:-translate-x-1/2-25deg before:bg-floodlight before:[mask-image:radial-gradient(circle_at_1rem_8rem,transparent_0,black_100%)] after:absolute after:h-64 after:w-64 after:origin-top after:-translate-x-1/2 after:transform-gpu after:bg-signal after:bg-cover after:bg-center after:bg-no-repeat after:blur-mist after:drop-shadow-tilt after:-rotate-x-25 after:rotate-y-25" />
    )
}

export default NukeSignal
