import { createResource, onCleanup, onMount } from "solid-js"
import { GetRoomState } from "@wails/go/main/WailsApp"
import { main, pb } from "@wails/go/models"
import { EventsOff, EventsOn } from "@wails/runtime/runtime"

const useGameState = () => {
    const [gameState, { refetch }] = createResource<pb.RoomState | undefined>(GetRoomState)

    onMount(() => {
        EventsOn(main.Event.STATE_CHANGE, refetch)
    })

    onCleanup(() => {
        EventsOff(main.Event.STATE_CHANGE)
    })

    return { gameState }
}

export default useGameState
