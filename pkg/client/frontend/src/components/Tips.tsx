import { VoidComponent } from "solid-js"
import useGameState from "@hooks/useGameState"
import { client } from "@wails/go/models"

// TODO: Add random tips about the game in this component.

const tipsMapping = {
    [client.RoomState.AWAITING_OPPONENT]: "Share the above room code with an opponent.",
    [client.RoomState.ROOM_FILLED]: "Click on ready to begin the game.",
    [client.RoomState.AWAITING_READY]: "You're all set. We'll begin when your opponent is ready.",
    [client.RoomState.AWAITING_GAME_START]: "Grab a coffee. Things are about to get interesting...",
} satisfies Partial<Record<client.RoomState, string>>

const getTipString = (state: client.RoomState | undefined) => tipsMapping[state as keyof typeof tipsMapping] || ""

const Tips: VoidComponent = () => {
    const { gameState } = useGameState()

    return (
        <section class="absolute bottom-1/10 left-1/2 -translate-x-1/2">
            <p class="text-base/relaxed font-medium uppercase italic tracking-wide text-shadow">
                {getTipString(gameState())}
            </p>
        </section>
    )
}

export default Tips
