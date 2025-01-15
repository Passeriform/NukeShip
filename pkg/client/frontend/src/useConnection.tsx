import { createResource, onCleanup, onMount } from "solid-js"
import { GetConnectionState } from "../wailsjs/go/main/WailsApp"
import { main } from "../wailsjs/go/models"
import { EventsOff, EventsOn } from "../wailsjs/runtime/runtime"

const useConnection = () => {
    const [connected, { mutate }] = createResource(GetConnectionState)

    onMount(() => {
        EventsOn(main.WailsEvent.SERVER_CONNECTION_CHANGE, (connected) => {
            mutate(connected)
        })
    })

    onCleanup(() => {
        EventsOff(main.WailsEvent.SERVER_CONNECTION_CHANGE)
    })

    return { connected }
}

export default useConnection
