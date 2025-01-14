import { GetAppState } from "../wailsjs/go/main/WailsApp"
import { main } from "../wailsjs/go/models"
import { EventsOn } from "../wailsjs/runtime/runtime"
import { createEffect, createSignal, onMount } from "solid-js"

const useGameState = () => {
    const [gameState, setGameState] = createSignal(main.AppState.INIT)

    createEffect(async () => {
        const state = await GetAppState()
        setGameState(state)
    })

    onMount(() => {
        EventsOn(main.WailsEvent.STATE_CHANGE, (state) => {
            setGameState(state)
        })
    })

    return { gameState }
}

export default useGameState
