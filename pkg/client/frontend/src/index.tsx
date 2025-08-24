/* @refresh reload */
import "@thisbeyond/solid-select/style.css"
import { render } from "solid-js/web"
import "@assets/stylesheets/dropdown-overrides.css"
import App from "./App"
import "./index.css"

const root = document.getElementById("root")

render(() => <App />, root!)
