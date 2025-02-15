import { Application } from "@wailsio/runtime"
import { VoidComponent } from "solid-js"
import NavButton from "@components/NavButton"
import NukeSignal from "@components/NukeSignal"
import PlayPanel from "@components/PlayPanel"
import Splash from "@components/Splash"

const Landing: VoidComponent = () => {
    return (
        <>
            <div class="absolute inset-0 -z-10 bg-city bg-cover bg-center bg-no-repeat opacity-50 blur-sm brightness-50 -hue-rotate-15" />
            <NavButton position="right" text="⛌ Quit" onClick={Application.Quit} />
            <NukeSignal />
            <Splash />
            <PlayPanel />
        </>
    )
}

export default Landing
