import { createResource, createSignal, onMount } from "solid-js"
import toast from "solid-toast"
import { GetConnectionState } from "../wailsjs/go/main/WailsApp"
import { main } from "../wailsjs/go/models"
import { EventsOn } from "../wailsjs/runtime/runtime"

// TODO: Handle toasts in the caller instead.

const useConnection = () => {
    const [connected, { mutate }] = createResource(GetConnectionState)
    const [toastId, setToastId] = createSignal<string | undefined>(undefined)

    onMount(() => {
        EventsOn(main.WailsEvent.SERVER_CONNECTION_CHANGE, (connected) => {
            if (connected) {
                toast.dismiss(toastId())
                toast.success("Connection to the server established.")
            } else {
                setToastId(
                    toast.loading(`Connection to the server was broken. Attempting reconnection.`, {
                        duration: Infinity,
                    }),
                )
            }
            mutate(connected)
        })
    })

    return { connected }
}

export default useConnection
