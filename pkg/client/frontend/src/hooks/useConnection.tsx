import { Events } from "@wailsio/runtime"
import { createResource, onCleanup, onMount } from "solid-js"
import { Event } from "@bindings/pkg/client/models"
import { GetConnectionState } from "@bindings/pkg/client/wailsroomservice"

const useConnection = () => {
    const [connected, { mutate }] = createResource(GetConnectionState)

    onMount(() => {
        Events.On(Event.EventSrvServerConnectionChange, (connected: boolean) => {
            mutate(connected)
        })
    })

    onCleanup(() => {
        Events.Off(Event.EventSrvServerConnectionChange)
    })

    return { connected }
}

export default useConnection
