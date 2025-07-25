import { VoidComponent } from "solid-js"

const Splash: VoidComponent = () => {
    return (
        <section class="relative text-center">
            <h1
                class="relative z-10 inline-block animate-glitch-base font-title text-9xl font-bold text-dark-turquoise drop-shadow-default before:absolute before:left-4 before:top-2 before:-z-10 before:w-full-extend before:animate-glitch-alpha before:text-vivid-cerise before:content-[attr(data-text)] after:absolute after:-left-2 after:top-1 after:-z-10 after:w-full-extend after:animate-glitch-beta after:text-spiro-disco-ball after:content-[attr(data-text)]"
                data-text="NUKESHIP"
            >
                <span class="animate-glitch-base">NUKESHIP</span>
            </h1>
        </section>
    )
}

export default Splash
