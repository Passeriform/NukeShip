// import { createSignal } from "solid-js"
import Splash from "./Splash"
import NukeSignal from "./NukeSignal"
import PlayPanel from "./PlayPanel"
import styles from "./app.module.css"

const App = () => {
    // const [count, setCount] = createSignal(0)

    return (
        <>
            <div class={styles.background}/>
            <NukeSignal />
            <Splash />
            <PlayPanel />
        </>
    )
}

export default App
