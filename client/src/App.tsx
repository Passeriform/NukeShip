import Splash from "./Splash"
import NukeSignal from "./NukeSignal"
import PlayPanel from "./PlayPanel"
import { VoidComponent } from "solid-js"

const App: VoidComponent = () => {
    return (
        <>
            <div class="absolute inset-0 -z-10 bg-city bg-cover bg-center bg-no-repeat opacity-50 blur" />
            <NukeSignal />
            <Splash />
            <PlayPanel />
        </>
    )
}

export default App
