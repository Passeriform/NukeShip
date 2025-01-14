import { VoidComponent, createSignal } from "solid-js"
import { Select } from "@thisbeyond/solid-select"
import Button from "./Button"
import { CreateRoom, JoinRoom } from "../wailsjs/go/client/WailsApp"
import { useNavigate } from "@solidjs/router"
import toast from "solid-toast"

const MAX_ROOM_CODE_LENGTH = 5

const GAME_TYPE = {
    REGULAR: "Regular",
    SIEGE: "Siege",
} as const

type GAME_TYPE = (typeof GAME_TYPE)[keyof typeof GAME_TYPE]

const gameOptions = Object.values(GAME_TYPE)

const PlayPanel: VoidComponent = () => {
    const [gameMode, setGameMode] = createSignal<GAME_TYPE>(GAME_TYPE.REGULAR)
    const [roomCode, setRoomCode] = createSignal("")
    const [inputRef, setInputRef] = createSignal<HTMLInputElement>()
    const navigate = useNavigate()

    const createRoom = async () => {
        const code = await toast.promise(
            CreateRoom().then((value) => (value ? Promise.resolve(value) : Promise.reject())),
            {
                loading: `Creating a new room.`,
                error: `Cannot create the room.`,
                success: `Created a new room.`,
            },
            {
                iconTheme: {
                    secondary: "#00d6fc",
                },
            },
        )

        if (code) {
            navigate(`/room/${code}`)
        }
    }

    const joinRoom = async () => {
        if (!roomCode()) {
            toast.error("Enter a room code to join.", {
                iconTheme: {
                    secondary: "#00d6fc",
                },
            })
            return
        }

        if (roomCode().length < MAX_ROOM_CODE_LENGTH) {
            toast.error(`Enter a ${MAX_ROOM_CODE_LENGTH} character room code to join.`, {
                iconTheme: {
                    secondary: "#00d6fc",
                },
            })
            return
        }

        const joined = await toast.promise(
            JoinRoom(roomCode()).then((value) => (value ? Promise.resolve(value) : Promise.reject())),
            {
                loading: `Joining room ${roomCode()}.`,
                error: `Cannot join room ${roomCode()}. Room doesn't exist.`,
                success: `Joined room ${roomCode()}.`,
            },
            {
                iconTheme: {
                    secondary: "#00d6fc",
                },
            },
        )

        if (joined) {
            navigate(`/room/${roomCode()}`)
        }
    }

    const setCaretToEnd = () => {
        inputRef()?.setSelectionRange(roomCode().length, roomCode().length)
    }

    return (
        <section class="relative flex flex-row items-center justify-evenly gap-8 rounded-lg border border-accent bg-background/75">
            <section class="flex flex-col items-center justify-evenly gap-16 p-24">
                <Select
                    class="after:text-lg-symbol/relaxed-symbol relative m-0 min-h-20 min-w-56 rounded-lg border border-accent/30 bg-transparent p-0 text-center text-lg/tight-symbol font-medium uppercase tracking-wide text-accent/50 transition-all duration-200 ease-in-out after:pointer-events-none after:absolute after:right-0 after:top-0 after:p-5 after:px-4 after:py-7 after:font-title after:text-accent/50 after:content-['˅'] focus-within:border-accent-alt focus-within:shadow-blue focus-within:after:text-shadow"
                    options={gameOptions}
                    initialValue={gameMode()}
                    onChange={setGameMode}
                />
                <Button class="min-h-20 min-w-56" text="Create Room" onClick={createRoom} />
            </section>
            <div class="h-96 w-8 bg-divider" />
            <section class="flex flex-col items-center justify-evenly gap-16 p-24">
                <input
                    class="relative m-0 min-h-20 w-48 min-w-48 appearance-none rounded-lg border border-accent/30 bg-transparent p-0 text-center text-lg/relaxed font-medium uppercase tracking-wide text-accent/50 caret-transparent outline-none transition-all duration-200 ease-in-out focus:border-accent-alt focus:text-accent focus:shadow-blue focus:text-shadow"
                    ref={setInputRef}
                    maxLength={MAX_ROOM_CODE_LENGTH}
                    placeholder="Code..."
                    value={roomCode()}
                    onInput={(e) => {
                        setRoomCode(e.currentTarget.value.toLocaleUpperCase())
                    }}
                    onkeydown={setCaretToEnd}
                    onmousedown={setCaretToEnd}
                />
                <Button class="min-h-20 min-w-56" text="Join Room" onClick={joinRoom} />
            </section>
        </section>
    )
}

export default PlayPanel
