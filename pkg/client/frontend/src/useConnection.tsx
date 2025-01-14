import { createSignal } from "solid-js/types/server/reactive.js"
import { main } from "../wailsjs/go/models"
import { EventsOn } from "../wailsjs/runtime/runtime"
import { onMount } from "solid-js"

const useConnection = () => {
    const [connected, setConnected] = createSignal(false)

    onMount(() => {
        EventsOn(main.WailsEvent.SERVER_CONNECTION_CHANGE, (connected) => {
            setConnected(connected)
        })
    })

    return { connected }
}

export default useConnection
