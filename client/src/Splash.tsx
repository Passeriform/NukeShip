import { Component } from "solid-js"

const Splash: Component = () => {
    return (
        <section class="relative text-center">
            <h1
                class="drop-shadow-title text-title relative z-10 inline-block animate-glitch-base font-title text-xl font-bold before:absolute before:left-4 before:top-2 before:-z-10 before:w-full-extend before:animate-glitch-alpha before:text-glitch-red before:content-[attr(data-text)] after:absolute after:-left-2 after:top-1 after:-z-10 after:w-full-extend after:animate-glitch-beta after:text-glitch-blue after:content-[attr(data-text)]"
                data-text="NUKESHIP"
            >
                <span class="animate-glitch-base">NUKESHIP</span>
            </h1>
        </section>
    )
}

export default Splash
