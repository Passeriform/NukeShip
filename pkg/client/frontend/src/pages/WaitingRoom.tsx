import { useNavigate, useParams } from "@solidjs/router"
import { Show, VoidComponent, createEffect, createSignal } from "solid-js"
import { Grid } from "solid-spinner"
import { twMerge } from "tailwind-merge"
import waitingRoomVideo from "@assets/waiting_room.mp4"
import Button from "@components/Button"
import NavButton from "@components/NavButton"
import VideoBackground from "@components/VideoBackground"
import useGameState from "@hooks/useGameState"
import { LeaveRoom, UpdateReady } from "@wails/go/main/WailsApp"
import { pb } from "@wails/go/models"

// TODO: Disable all controls when server is disconnected.

const WaitingRoom: VoidComponent = () => {
    const { code } = useParams()
    const navigate = useNavigate()
    const { gameState } = useGameState()

    const [ready, setReady] = createSignal(false)

    const messageString = () =>
        (gameState() === undefined && "Waiting for an opponent to join...") ||
        (gameState() === pb.RoomState.AWAITING_PLAYERS && "The playground is set!") ||
        (gameState() === pb.RoomState.AWAITING_READY && ready() && "Waiting for an opponent to ready...") ||
        (gameState() === pb.RoomState.AWAITING_READY && !ready() && "The playground is set!") ||
        (gameState() === pb.RoomState.IN_GAME && "Let the show begin!")

    const tipString = () =>
        (gameState() === undefined && "Share the above room code with an opponent.") ||
        (gameState() === pb.RoomState.AWAITING_PLAYERS && "Click on ready to begin the game.") ||
        (gameState() === pb.RoomState.AWAITING_READY &&
            ready() &&
            "Grab a coffee. Things are about to get interesting...") ||
        (gameState() === pb.RoomState.AWAITING_READY && !ready() && "Click on ready to begin the game.") ||
        (gameState() === pb.RoomState.IN_GAME && "The game has started! Good luck!")

    const showLoader = () => gameState() === undefined || gameState() === pb.RoomState.AWAITING_READY

    const goBack = () => {
        LeaveRoom()
        navigate("/")
    }

    createEffect(() => {
        if (gameState() == pb.RoomState.IN_GAME) {
            navigate(`/game/${code}`)
        }
    })

    return (
        <>
            <VideoBackground src={waitingRoomVideo} />
            <NavButton position="left" onClick={goBack}>
                🡐 Back
            </NavButton>
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
                            showLoader() && "animate-slow-blink",
                        )}
                    >
                        {messageString()}
                    </span>
                </p>
            </section>
            <Show when={[pb.RoomState.AWAITING_PLAYERS, pb.RoomState.AWAITING_READY].includes(gameState()!)}>
                <Button
                    class="h-20 w-56"
                    onClick={async () => {
                        const succeeded = await UpdateReady(!ready())
                        if (succeeded) {
                            setReady(!ready())
                        }
                    }}
                >
                    {ready() ? "⛌ Unready" : "✓ Ready"}
                </Button>
            </Show>
            <section class="absolute bottom-1/10 left-1/2 -translate-x-1/2">
                <p class="text-base/relaxed font-medium uppercase italic tracking-wide text-dark-turquoise text-shadow">
                    {tipString()}
                </p>
            </section>
        </>
    )
}

export default WaitingRoom
