import Splash from "./Splash"
import NukeSignal from "./NukeSignal"
import PlayPanel from "./PlayPanel"
import { Component } from "solid-js"

const App: Component = () => {
    return (
        <>
            <div class="blur absolute inset-0 -z-10 bg-city bg-cover bg-center bg-no-repeat opacity-50" />
            <NukeSignal />
            <Splash />
            <PlayPanel />
        </>
    )
}

export default App
