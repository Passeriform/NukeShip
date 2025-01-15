import { createResource, onCleanup, onMount } from "solid-js"
import { GetAppState } from "@wails/go/main/WailsApp"
import { main } from "@wails/go/models"
import { EventsOff, EventsOn } from "@wails/runtime/runtime"

const useGameState = () => {
    const [gameState, { mutate }] = createResource(GetAppState)

    onMount(() => {
        EventsOn(main.WailsEvent.STATE_CHANGE, (state) => {
            mutate(state)
        })
    })

    onCleanup(() => {
        EventsOff(main.WailsEvent.STATE_CHANGE)
    })

    return { gameState }
}

export default useGameState
