import { createResource, onMount } from "solid-js"
import toast from "solid-toast"
import { GetAppState } from "../wailsjs/go/main/WailsApp"
import { main } from "../wailsjs/go/models"
import { EventsOn } from "../wailsjs/runtime/runtime"

// TODO: Handle toasts in the caller instead.

const useGameState = () => {
    const [gameState, { mutate }] = createResource(GetAppState)

    onMount(() => {
        EventsOn(main.WailsEvent.STATE_CHANGE, (state) => {
            toast.success(`Received state update: ${state}`)
            mutate(state)
        })
    })

    return { gameState }
}

export default useGameState
