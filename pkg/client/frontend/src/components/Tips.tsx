import { VoidComponent } from "solid-js"
import { RoomState } from "@bindings/internal/client/models"
import useGameState from "@hooks/useGameState"

// TODO: Add random tips about the game in this component.

const tipsMapping = {
    [RoomState.RoomStateAWAITINGOPPONENT]: "Share the above room code with an opponent.",
    [RoomState.RoomStateROOMFILLED]: "Click on ready to begin the game.",
    [RoomState.RoomStateAWAITINGREADY]: "You're all set. We'll begin when your opponent is ready.",
    [RoomState.RoomStateAWAITINGGAMESTART]: "Grab a coffee. Things are about to get interesting...",
} satisfies Partial<Record<RoomState, string>>

const getTipString = (state: RoomState | undefined) => tipsMapping[state as keyof typeof tipsMapping] || ""

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
