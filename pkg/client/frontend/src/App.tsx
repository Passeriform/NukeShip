import { Route, Router } from "@solidjs/router"
import { VoidComponent, createEffect, createSignal, on } from "solid-js"
import toast, { Toaster } from "solid-toast"
import useConnection from "@hooks/useConnection"
import GameBoard from "@pages/GameBoard"
import Landing from "@pages/Landing"
import WaitingRoom from "@pages/WaitingRoom"

const App: VoidComponent = () => {
    const { connected } = useConnection()
    const [disconnectedToastId, setDisconnectedToastId] = createSignal<string | undefined>(undefined)

    createEffect(
        on(connected, () => {
            if (connected() === undefined) {
                return
            }

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
                <Route path="/game/:code" component={() => <GameBoard />} />
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
                        "gap-2 rounded-lg border border-neon-teal text-left bg-transparent px-3 py-5 ps-6 text-base/relaxed font-medium tracking-wide text-neon-teal shadow-sm shadow-neon-teal/20 text-shadow outline-none backdrop-blur-md",
                }}
                gutter={32}
            />
        </>
    )
}

export default App
