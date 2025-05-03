/* @refresh reload */
import "@thisbeyond/solid-select/style.css"
import { render } from "solid-js/web"
import GameBoard from "@pages/GameBoard"
import "./assets/stylesheets/dropdown-overrides.css"
import "./index.css"

const root = document.getElementById("root")

render(() => <GameBoard />, root!)
