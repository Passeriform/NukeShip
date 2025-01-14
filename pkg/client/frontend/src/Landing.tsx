import { VoidComponent } from "solid-js"
import NukeSignal from "./NukeSignal"
import PlayPanel from "./PlayPanel"
import Splash from "./Splash"

const Landing: VoidComponent = () => {
    return (
        <>
            <div class="saturate-lesser absolute inset-0 -z-10 bg-city bg-cover bg-center bg-no-repeat opacity-50 blur" />
            <NukeSignal />
            <Splash />
            <PlayPanel />
        </>
    )
}

export default Landing
