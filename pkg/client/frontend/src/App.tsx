import { Route, Router } from "@solidjs/router"
import { createEffect, createSignal, on, VoidComponent } from "solid-js"
import toast, { Toaster } from "solid-toast"
import Landing from "./Landing"
import WaitingRoom from "./WaitingRoom"
import useConnection from "./useConnection"

// TODO: Move components into pages, components and hooks directories.

const App: VoidComponent = () => {
    const { connected } = useConnection()
    const [disconnectedToastId, setDisconnectedToastId] = createSignal<string | undefined>(undefined)

    createEffect(
        on(connected, () => {
            if (connected()) {
                if (disconnectedToastId()) {
                    toast.dismiss(disconnectedToastId())
                    toast.success("Connection to the server established.")
                }
                setDisconnectedToastId(undefined)
                return
            }

            setDisconnectedToastId(
                toast.loading(`Connection to the server was broken. Attempting reconnection.`, {
                    duration: Infinity,
                }),
            )
        }),
    )

    return (
        <>
            <Router url="/">
                <Route path="/" component={() => <Landing />} />
                <Route path="/room/:code" component={() => <WaitingRoom />} />
            </Router>
            <Toaster
                toastOptions={{
                    style: {
                        "color": "revert-layer",
                        "background": "revert-layer",
                        "box-shadow": "revert-layer",
                        "padding": "revert-layer",
                        "border-radius": "revert-layer",
                        "line-height": "revert-layer",
                    },
                    className:
                        "gap-2 rounded-lg border border-medium-slate-blue text-left bg-transparent px-3 py-5 ps-6 text-base/relaxed font-medium tracking-wide text-dark-turquoise shadow-sm shadow-dark-turquoise/30 text-shadow outline-none backdrop-blur-md",
                }}
                gutter={32}
            />
        </>
    )
}

export default App
