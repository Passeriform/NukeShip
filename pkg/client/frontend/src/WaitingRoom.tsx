import { useNavigate, useParams } from "@solidjs/router"
import { createEffect, Show, VoidComponent } from "solid-js"
import grid from "./assets/grid.mp4"
import NavButton from "./NavButton"
import Tips from "./Tips"
import useConnection from "./useConnection"
import VideoBackground from "./VideoBackground"
import useGameState from "./useGameState"
import { main } from "../wailsjs/go/models"
import { Grid } from "solid-spinner"
import { UpdateReady } from "../wailsjs/go/main/WailsApp"
import Button from "./Button"

// TODO: Leave room on back navigation.
// TODO: Disable all controls when server is disconnected.
// TODO: Slow blink animation for loading text.

const messageMapping = {
    [main.AppState.AWAITING_OPPONENT]: "Waiting for an opponent to join...",
    [main.AppState.ROOM_FILLED]: "The playground is set!",
    [main.AppState.AWAITING_READY]: "Waiting for your opponent to get ready...",
    [main.AppState.AWAITING_GAME_START]: "Let the show begin!",
} satisfies Partial<Record<main.AppState, string>>

const getMessageString = (state: main.AppState | undefined) =>
    messageMapping[state as keyof typeof messageMapping] || ""

const WaitingRoom: VoidComponent = () => {
    const { code } = useParams()
    const navigate = useNavigate()
    const { gameState } = useGameState()
    useConnection()

    const showLoader = () =>
        [main.AppState.AWAITING_OPPONENT, main.AppState.AWAITING_READY, main.AppState].includes(
            gameState() as main.AppState,
        )
    const showReadyButton = () =>
        [main.AppState.ROOM_FILLED, main.AppState.AWAITING_READY].includes(gameState() as main.AppState)
    const isReady = () => gameState() === main.AppState.AWAITING_READY

    const goBack = () => {
        navigate("/")
    }

    createEffect(() => {
        if (gameState() == main.AppState.IN_GAME) {
            navigate(`/game/${code}`)
        }
    })

    return (
        <>
            <VideoBackground src={grid} />
            <NavButton position="left" text="🡐 Back" onClick={goBack} />
            <section class="flex flex-col items-center justify-evenly gap-4">
                <h2 class="animate-glitch-base font-title text-xl font-bold text-dark-turquoise drop-shadow-default before:absolute before:left-4 before:top-2 before:-z-10 before:w-full-extend before:animate-glitch-alpha before:text-vivid-cerise before:content-[attr(data-text)] after:absolute after:-left-2 after:top-1 after:-z-10 after:w-full-extend after:animate-glitch-beta after:text-spiro-disco-ball after:content-[attr(data-text)]">
                    〔 {code} 〕
                </h2>
                <p class="flex flex-row items-center justify-center gap-8 self-start ps-20">
                    <Show when={showLoader()}>
                        <Grid color="#00d6fc98" class="h-8 w-8 blur-px drop-shadow-spinner" />
                    </Show>
                    <span class="px-8 text-base/relaxed font-medium uppercase tracking-wide text-dark-turquoise text-shadow">
                        {getMessageString(gameState())}
                    </span>
                </p>
            </section>
            <Show when={showReadyButton()}>
                <Button
                    class="h-20 w-56"
                    text={isReady() ? "⛌ Unready" : "✓ Ready"}
                    onClick={() => UpdateReady(!isReady())}
                />
            </Show>
            <Tips />
        </>
    )
}

export default WaitingRoom
