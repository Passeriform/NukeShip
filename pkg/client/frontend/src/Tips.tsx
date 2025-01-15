import { VoidComponent } from "solid-js"
import { main } from "../wailsjs/go/models"
import useGameState from "./useGameState"

// TODO: Add random tips about the game in this component.

const tipsMapping = {
    [main.AppState.AWAITING_OPPONENT]: "Share the above room code with an opponent.",
    [main.AppState.ROOM_FILLED]: "Click on ready to begin the game.",
    [main.AppState.AWAITING_READY]: "You're all set. We'll begin when your opponent is ready.",
    [main.AppState.AWAITING_GAME_START]: "Grab a coffee. Things are about to get interesting...",
} satisfies Partial<Record<main.AppState, string>>

const getTipString = (state: main.AppState | undefined) => tipsMapping[state as keyof typeof tipsMapping] || ""

const Tips: VoidComponent = () => {
    const { gameState } = useGameState()

    return (
        <section class="absolute bottom-1/10 left-1/2 -translate-x-1/2">
            <p class="text-base/relaxed font-medium uppercase italic tracking-wide text-dark-turquoise text-shadow">
                {getTipString(gameState())}
            </p>
        </section>
    )
}

export default Tips
