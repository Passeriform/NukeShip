import { useNavigate, useParams } from "@solidjs/router"
import { Show, VoidComponent, createEffect } from "solid-js"
import { Grid } from "solid-spinner"
import waitingRoomVideo from "@assets/waiting_room.mp4"
import { RoomState } from "@bindings/internal/client"
import { LeaveRoom, UpdateReady } from "@bindings/pkg/client/wailsroomservice"
import Button from "@components/Button"
import NavButton from "@components/NavButton"
import Tips from "@components/Tips"
import VideoBackground from "@components/VideoBackground"
import useGameState from "@hooks/useGameState"

// TODO: Disable all controls when server is disconnected.

const messageMapping = {
    [RoomState.RoomStateAWAITINGOPPONENT]: "Waiting for an opponent to join...",
    [RoomState.RoomStateROOMFILLED]: "The playground is set!",
    [RoomState.RoomStateAWAITINGREADY]: "Waiting for your opponent to get ready...",
    [RoomState.RoomStateAWAITINGGAMESTART]: "Let the show begin!",
} satisfies Partial<Record<RoomState, string>>

const getMessageString = (state: RoomState | undefined) => messageMapping[state as keyof typeof messageMapping] || ""

const WaitingRoom: VoidComponent = () => {
    const { code } = useParams()
    const navigate = useNavigate()
    const { gameState } = useGameState()

    const showLoader = () =>
        [RoomState.RoomStateAWAITINGOPPONENT, RoomState.RoomStateAWAITINGREADY, RoomState].includes(
            gameState() as RoomState,
        )
    const showReadyButton = () =>
        [RoomState.RoomStateROOMFILLED, RoomState.RoomStateAWAITINGREADY].includes(gameState() as RoomState)
    const isReady = () => gameState() === RoomState.RoomStateAWAITINGREADY

    const goBack = () => {
        LeaveRoom()
        navigate("/")
    }

    createEffect(() => {
        if (gameState() == RoomState.RoomStateINGAME) {
            navigate(`/game/${code}`)
        }
    })

    return (
        <>
            <VideoBackground src={waitingRoomVideo} />
            <NavButton position="left" text="🡐 Back" onClick={goBack} />
            <section class="flex flex-col items-center justify-evenly gap-4">
                <h2 class="animate-glitch-base font-title text-xl font-bold text-dark-turquoise drop-shadow-default before:absolute before:left-4 before:top-2 before:-z-10 before:w-full-extend before:animate-glitch-alpha before:text-vivid-cerise before:content-[attr(data-text)] after:absolute after:-left-2 after:top-1 after:-z-10 after:w-full-extend after:animate-glitch-beta after:text-spiro-disco-ball after:content-[attr(data-text)]">
                    〔 {code} 〕
                </h2>
                <p class="flex flex-row items-center justify-center gap-8 self-start ps-20">
                    <Show when={showLoader()}>
                        <Grid color="#00d6fc98" class="h-8 w-8 blur-px drop-shadow-spinner" />
                    </Show>
                    <span
                        class={`px-8 text-base/relaxed font-medium uppercase tracking-wide text-dark-turquoise text-shadow ${showLoader() ? "animate-slow-blink" : ""}`}
                    >
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
