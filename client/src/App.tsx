import Splash from "./Splash"
import NukeSignal from "./NukeSignal"
import PlayPanel from "./PlayPanel"
import styles from "./app.module.css"
import { Component } from "solid-js"

const App: Component = () => {
    return (
        <>
            <div class={styles.background} />
            <NukeSignal />
            <Splash />
            <PlayPanel />
        </>
    )
}

export default App
