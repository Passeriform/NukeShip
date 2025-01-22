import { Events } from "@wailsio/runtime"
import { createResource, onCleanup, onMount } from "solid-js"
import { RoomState } from "@bindings/internal/client"
import { Event } from "@bindings/pkg/client/models"
import { GetRoomState } from "@bindings/pkg/client/wailsroomservice"

const useGameState = () => {
    const [gameState, { mutate }] = createResource(GetRoomState)

    onMount(() => {
        Events.On(Event.EventSrvRoomStateChange, (state: RoomState) => {
            mutate(state)
        })
    })

    onCleanup(() => {
        Events.Off(Event.EventSrvRoomStateChange)
    })

    return { gameState }
}

export default useGameState
