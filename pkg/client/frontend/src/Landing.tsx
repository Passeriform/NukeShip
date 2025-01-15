import { VoidComponent } from "solid-js"
import { Quit } from "../wailsjs/runtime/runtime"
import NavButton from "./NavButton"
import NukeSignal from "./NukeSignal"
import PlayPanel from "./PlayPanel"
import Splash from "./Splash"
import useConnection from "./useConnection"
import useGameState from "./useGameState"

const Landing: VoidComponent = () => {
    useConnection()
    useGameState()

    return (
        <>
            <div class="absolute inset-0 -z-10 bg-city bg-cover bg-center bg-no-repeat opacity-50 blur-sm brightness-50 -hue-rotate-15" />
            <NavButton position="right" text="⛌ Quit" onClick={Quit} />
            <NukeSignal />
            <Splash />
            <PlayPanel />
        </>
    )
}

export default Landing
