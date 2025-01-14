import { useNavigate, useParams } from "@solidjs/router"
import { VoidComponent } from "solid-js"
import gridBackground from "./assets/grid.mp4"
import { Grid } from "solid-spinner"
import Button from "./Button"

const WaitingRoom: VoidComponent = () => {
    const { code } = useParams()
    const navigate = useNavigate()

    const goBack = () => {
        navigate("/")
    }

    return (
        <>
            <div class="absolute inset-0 -z-10 h-full w-full overflow-hidden">
                <video preload="auto" autoplay loop muted class="-hue-rotate-45 w-full blur-sm brightness-50">
                    <source src={gridBackground} type="video/mp4" />
                </video>
            </div>
            <nav class="absolute left-16 top-16">
                <Button class="min-h-16 min-w-32" text="🡐 Back" onClick={goBack} />
            </nav>
            {/* TODO: Add different blocks based on game state. */}
            <section class="flex flex-col items-baseline justify-evenly gap-4">
                <h2 class="animate-glitch-base font-title text-xl font-bold text-title drop-shadow-title before:left-4 before:top-2 before:-z-10 before:w-full-extend before:animate-glitch-alpha before:text-glitch-red before:content-[attr(data-text)] after:absolute after:-left-2 after:top-1 after:-z-10 after:w-full-extend after:animate-glitch-beta after:text-glitch-blue after:content-[attr(data-text)]">
                    〔 {code} 〕
                </h2>
                <p class="flex flex-row items-center justify-center gap-8 ps-20">
                    <Grid color="#00d6fc98" class="blur-spinner drop-shadow-spinner h-8 w-8" />
                    <span class="px-8 text-base/relaxed font-medium uppercase tracking-wide text-accent text-shadow">
                        Waiting for opponent to join...
                    </span>
                </p>
            </section>
            <footer class="absolute bottom-1/10 left-1/2 -translate-x-1/2">
                <p class="text-base/relaxed font-medium uppercase tracking-wide text-accent text-shadow">
                    Share the above room code with an opponent
                </p>
            </footer>
        </>
    )
}

export default WaitingRoom
