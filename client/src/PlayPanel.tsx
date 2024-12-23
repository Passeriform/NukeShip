import { Component, createSignal } from "solid-js"
import { Select } from "@thisbeyond/solid-select"
import Button from "./Button"

const MAX_ROOM_CODE_LENGTH = 5

const GAME_TYPE = {
    REGULAR: "Regular",
    SIEGE: "Siege",
} as const

type GAME_TYPE = (typeof GAME_TYPE)[keyof typeof GAME_TYPE]

const gameOptions = Object.values(GAME_TYPE)

const PlayPanel: Component = () => {
    const [gameMode, setGameMode] = createSignal<GAME_TYPE>(GAME_TYPE.REGULAR)
    const [roomCode, setRoomCode] = createSignal("")
    const [inputRef, setInputRef] = createSignal<HTMLInputElement>()

    const createRoom = () => {
        console.log(gameMode())
    }

    const joinRoom = () => {
        console.log(roomCode())
    }

    const setCaretToEnd = () => {
        inputRef()?.setSelectionRange(roomCode().length, roomCode().length)
    }

    return (
        <section class="bg-background/75 relative flex flex-row items-center justify-evenly gap-8 rounded-lg border border-accent">
            <section class="flex flex-col items-center justify-evenly gap-16 p-24">
                <Select
                    class="bg-transparent focus-within:after:text-shadow after:text-lg-symbol/relaxed-symbol relative m-0 min-h-20 min-w-56 rounded-lg border border-accent/30 p-0 text-center text-lg/relaxed font-medium uppercase tracking-wide text-accent/50 transition-all duration-200 ease-in-out after:pointer-events-none after:absolute after:right-0 after:top-0 after:p-5 after:px-4 after:py-7 after:font-title after:text-accent/50 after:content-['˅'] focus-within:border-accent-alt focus-within:shadow-blue"
                    options={gameOptions}
                    initialValue={gameMode()}
                    onChange={setGameMode}
                />
                <Button text="Create Room" onClick={createRoom} />
            </section>
            <div class="h-96 w-8 bg-divider" />
            <section class="flex flex-col items-center justify-evenly gap-16 p-24">
                <input
                    class="bg-transparent focus:text-shadow caret-transparent w-48 relative m-0 min-h-20 min-w-48 appearance-none rounded-lg border border-accent/30 p-0 text-center text-lg/relaxed font-medium uppercase tracking-wide text-accent/50 outline-none transition-all duration-200 ease-in-out focus:border-accent-alt focus:text-accent focus:shadow-blue"
                    ref={setInputRef}
                    maxLength={MAX_ROOM_CODE_LENGTH}
                    placeholder="Code..."
                    value={roomCode()}
                    onInput={(e) => {
                        setRoomCode(e.currentTarget.value)
                    }}
                    onkeydown={setCaretToEnd}
                    onmousedown={setCaretToEnd}
                />
                <Button text="Join Room" onClick={joinRoom} />
            </section>
        </section>
    )
}

export default PlayPanel
