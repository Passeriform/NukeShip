import { createResource, onCleanup, onMount } from "solid-js"
import { GetAppState } from "../wailsjs/go/main/WailsApp"
import { main } from "../wailsjs/go/models"
import { EventsOff, EventsOn } from "../wailsjs/runtime/runtime"

// TODO: Handle toasts in the caller instead.

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
