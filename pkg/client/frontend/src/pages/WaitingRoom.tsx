import { useNavigate, useParams } from "@solidjs/router"
import { Show, VoidComponent, createEffect } from "solid-js"
import { Grid } from "solid-spinner"
import { twMerge } from "tailwind-merge"
import waitingRoomVideo from "@assets/waiting_room.mp4"
import Button from "@components/Button"
import NavButton from "@components/NavButton"
import Tips from "@components/Tips"
import VideoBackground from "@components/VideoBackground"
import useGameState from "@hooks/useGameState"
import { LeaveRoom, UpdateReady } from "@wails/go/main/WailsApp"
import { client } from "@wails/go/models"

// TODO: Disable all controls when server is disconnected.

const messageMapping = {
    [client.RoomState.AWAITING_OPPONENT]: "Waiting for an opponent to join...",
    [client.RoomState.ROOM_FILLED]: "The playground is set!",
    [client.RoomState.AWAITING_READY]: "Waiting for your opponent to get ready...",
    [client.RoomState.AWAITING_GAME_START]: "Let the show begin!",
} satisfies Partial<Record<client.RoomState, string>>

const getMessageString = (state: client.RoomState | undefined) =>
    messageMapping[state as keyof typeof messageMapping] || ""

const WaitingRoom: VoidComponent = () => {
    const { code } = useParams()
    const navigate = useNavigate()
    const { gameState } = useGameState()

    const showLoader = () =>
        [client.RoomState.AWAITING_OPPONENT, client.RoomState.AWAITING_READY, client.RoomState].includes(
            gameState() as client.RoomState,
        )
    const showReadyButton = () =>
        [client.RoomState.ROOM_FILLED, client.RoomState.AWAITING_READY].includes(gameState() as client.RoomState)
    const isReady = () => gameState() === client.RoomState.AWAITING_READY

    const goBack = () => {
        LeaveRoom()
        navigate("/")
    }

    createEffect(() => {
        if (gameState() == client.RoomState.IN_GAME) {
            navigate(`/game/${code}`)
        }
    })

    return (
        <>
            <VideoBackground src={waitingRoomVideo} />
            <NavButton position="left" text="🡐 Back" onClick={goBack} />
            <section class="flex flex-col items-center justify-evenly gap-4">
                <h2 class="animate-glitch-base font-title text-9xl font-bold text-dark-turquoise drop-shadow-default before:absolute before:left-4 before:top-2 before:-z-10 before:w-full-extend before:animate-glitch-alpha before:text-vivid-cerise before:content-[attr(data-text)] after:absolute after:-left-2 after:top-1 after:-z-10 after:w-full-extend after:animate-glitch-beta after:text-spiro-disco-ball after:content-[attr(data-text)]">
                    〔 {code} 〕
                </h2>
                <p class="flex flex-row items-center justify-center gap-8 self-start ps-20">
                    <Show when={showLoader()}>
                        <Grid color="#00d6fc98" class="h-8 w-8 blur-px drop-shadow-spinner" />
                    </Show>
                    <span
                        class={twMerge(
                            "px-8 text-base/relaxed font-medium uppercase tracking-wide text-dark-turquoise text-shadow",
                            showLoader() ? "animate-slow-blink" : "",
                        )}
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
