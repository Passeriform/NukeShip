import { createResource, onCleanup, onMount } from "solid-js"
import { GetConnectionState } from "@wails/go/main/WailsApp"
import { main } from "@wails/go/models"
import { EventsOff, EventsOn } from "@wails/runtime/runtime"

const useConnection = () => {
    const [connected, { refetch }] = createResource(GetConnectionState)

    onMount(() => {
        EventsOn(main.Event.SERVER_CONNECTION_CHANGE, refetch)
    })

    onCleanup(() => {
        EventsOff(main.Event.SERVER_CONNECTION_CHANGE)
    })

    return { connected }
}

export default useConnection
