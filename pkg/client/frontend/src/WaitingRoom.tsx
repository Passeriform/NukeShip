import { useNavigate, useParams } from "@solidjs/router"
import { Match, Switch, VoidComponent } from "solid-js"
import grid from "./assets/grid.mp4"
import { Grid } from "solid-spinner"
import useGameState from "./useGameState"
import { main } from "../wailsjs/go/models"
import VideoBackground from "./VideoBackground"
import NavButton from "./NavButton"

const WaitingRoom: VoidComponent = () => {
    const { code } = useParams()
    const navigate = useNavigate()
    const { gameState } = useGameState()

    const goBack = () => {
        // TODO: Use LeaveRoom method here.
        navigate("/")
    }

    return (
        <>
            <VideoBackground src={grid} />
            <NavButton position="left" text="🡐 Back" onClick={goBack} />
            <section class="flex flex-col items-baseline justify-evenly gap-4">
                <h2 class="animate-glitch-base font-title text-xl font-bold text-dark-turquoise drop-shadow-default before:absolute before:left-4 before:top-2 before:-z-10 before:w-full-extend before:animate-glitch-alpha before:text-vivid-cerise before:content-[attr(data-text)] after:absolute after:-left-2 after:top-1 after:-z-10 after:w-full-extend after:animate-glitch-beta after:text-spiro-disco-ball after:content-[attr(data-text)]">
                    〔 {code} 〕
                </h2>
                <p class="flex flex-row items-center justify-center gap-8 ps-20">
                    <Grid color="#00d6fc98" class="h-8 w-8 blur-px drop-shadow-spinner" />
                    <span class="px-8 text-base/relaxed font-medium uppercase tracking-wide text-dark-turquoise text-shadow">
                        <Switch>
                            <Match when={gameState() === main.AppState.AWAITING_OPPONENT}>
                                Waiting for opponent to join...
                            </Match>
                            <Match when={gameState() === main.AppState.AWAITING_READY}>
                                Waiting for opponent to get ready...
                            </Match>
                        </Switch>
                    </span>
                </p>
            </section>
            <footer class="absolute bottom-1/10 left-1/2 -translate-x-1/2">
                <p class="text-base/relaxed font-medium uppercase tracking-wide text-dark-turquoise text-shadow">
                    <Switch>
                        <Match when={gameState() === main.AppState.AWAITING_OPPONENT}>
                            Share the above room code with an opponent
                        </Match>
                        <Match when={gameState() === main.AppState.AWAITING_READY}>
                            Grab a coffee. Things are about to get interesting...
                        </Match>
                    </Switch>
                </p>
            </footer>
        </>
    )
}

export default WaitingRoom
