import { createResource, onCleanup, onMount } from "solid-js"
import { GetAppState } from "@wails/go/main/WailsApp"
import { main } from "@wails/go/models"
import { EventsOff, EventsOn } from "@wails/runtime/runtime"

const useGameState = () => {
    const [gameState, { refetch }] = createResource(GetAppState)

    onMount(() => {
        EventsOn(main.Event.STATE_CHANGE, refetch)
    })

    onCleanup(() => {
        EventsOff(main.Event.STATE_CHANGE)
    })

    return { gameState }
}

export default useGameState
