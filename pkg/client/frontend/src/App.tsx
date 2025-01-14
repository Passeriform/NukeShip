import { VoidComponent } from "solid-js"
import { Toaster } from "solid-toast"
import { Route, Router } from "@solidjs/router"
import Landing from "./Landing"
import WaitingRoom from "./WaitingRoom"

const App: VoidComponent = () => {
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
                        "gap-2 rounded-lg border border-accent-alt text-left bg-transparent px-3 py-5 ps-6 text-base/relaxed font-medium tracking-wide text-accent shadow-blue text-shadow outline-none",
                }}
                gutter={32}
            />
        </>
    )
}

export default App
