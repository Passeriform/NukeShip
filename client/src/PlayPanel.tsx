import { Component, createSignal } from "solid-js"
import { Select } from "@thisbeyond/solid-select"
import styles from "./play-panel.module.css"
import Button from "./Button"
import "@thisbeyond/solid-select/style.css"

const MAX_ROOM_CODE_LENGTH = 5

const GAME_TYPE = {
    REGULAR: "Regular",
    SIEGE: "Siege",
} as const

type GAME_TYPE = typeof GAME_TYPE[keyof typeof GAME_TYPE]

const gameOptions = Object.values(GAME_TYPE)

const PlayPanel: Component = () => {
    const [gameMode, setGameMode] = createSignal<GAME_TYPE>(GAME_TYPE.REGULAR)
    const [roomCode, setRoomCode] = createSignal("")

    const createRoom = () => {
        console.log(gameMode())
    }

    const joinRoom = () => {
        console.log(roomCode())
    }

    return (
        <section class={styles.container}>
            <section class={`${styles.panel} ${styles.left}`}>
                <Select class="dropdown" options={gameOptions} initialValue={gameMode()} onChange={setGameMode} />
                <Button text="Create Room" onClick={createRoom} />
            </section>
            <div class={styles.divider} />
            <section class={`${styles.panel} ${styles.left}`}>
                <input maxLength={MAX_ROOM_CODE_LENGTH} value={roomCode()} onInput={(e) => { setRoomCode(e.currentTarget.value) }} placeholder="Code..." />
                <Button text="Join Room" onClick={joinRoom} />
            </section>
        </section>
    )
}

export default PlayPanel
