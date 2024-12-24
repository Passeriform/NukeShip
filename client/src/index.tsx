/* @refresh reload */
import { render } from "solid-js/web"
import "@thisbeyond/solid-select/style.css"
import "./index.css"
import "./assets/stylesheets/dropdown-overrides.css"
import "./wasm_exec.js"
import App from "./App"

const loadWasm = async () => {
    const go = new Go()
    const { instance } = await WebAssembly.instantiateStreaming(fetch("main.wasm"), go.importObject)
    go.run(instance)
    window.go = go
}

loadWasm()

const root = document.getElementById("root")

render(() => {
    if (window.go) {
        return <div>Loading WASM...</div>
    }
    return <App />
}, root!)
