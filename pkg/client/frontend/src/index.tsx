/* @refresh reload */
import { render } from "solid-js/web"
import "@thisbeyond/solid-select/style.css"
import "./index.css"
import "./assets/stylesheets/dropdown-overrides.css"
import App from "./App"

const root = document.getElementById("root")

render(() => <App />, root!)
