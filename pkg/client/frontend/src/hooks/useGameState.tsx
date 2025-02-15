import { Events } from "@wailsio/runtime"
import { createResource, onCleanup, onMount } from "solid-js"
import { RoomState } from "@bindings/internal/client"
import { Event } from "@bindings/pkg/client/models"
import { GetRoomState } from "@bindings/pkg/client/wailsroomservice"

const useGameState = () => {
    const [gameState, { refetch }] = createResource(GetAppState)

    onMount(() => {
        EventsOn(main.Event.STATE_CHANGE, refetch)
    })

    onCleanup(() => {
        Events.Off(Event.EventSrvRoomStateChange)
    })

    return { gameState }
}

export default useGameState
