import { useNavigate } from "@solidjs/router"
import { Select } from "@thisbeyond/solid-select"
import { VoidComponent, createSignal } from "solid-js"
import toast from "solid-toast"
import Button from "@components/Button"
import { CreateRoom, JoinRoom } from "@wails/go/main/WailsApp"
import { pb } from "@wails/go/models"

// TODO: Get GAME_TYPE and MAX_ROOM_CODE_LENGTH from go app instead

const MAX_ROOM_CODE_LENGTH = 5

const promisifyValue = <T,>(value: T) => (value ? Promise.resolve(value) : Promise.reject(Error()))

const roomTypeValues = Object.keys(pb.RoomType).filter((key) => isNaN(Number(key))) as (keyof typeof pb.RoomType)[]

const PlayPanel: VoidComponent = () => {
    const [gameMode, setGameMode] = createSignal<keyof typeof pb.RoomType>(
        pb.RoomType[pb.RoomType.REGULAR] as keyof typeof pb.RoomType,
    )
    const [roomCode, setRoomCode] = createSignal("")
    const [inputRef, setInputRef] = createSignal<HTMLInputElement>()
    const navigate = useNavigate()

    const createRoom = async () => {
        const code = await toast.promise(
            CreateRoom(pb.RoomType[gameMode()]).then(promisifyValue),
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
            JoinRoom(roomCode()).then(promisifyValue),
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
        <section class="relative flex flex-row items-center justify-evenly gap-8 rounded-lg border border-dark-turquoise backdrop-blur-md">
            <section class="flex flex-col items-center justify-evenly gap-16 p-24">
                <Select
                    class="after:text-2xl/relaxed-symbol relative m-0 min-h-20 min-w-56 rounded-lg border border-dark-turquoise/30 bg-transparent p-0 text-center text-4xl/tight-symbol font-medium uppercase tracking-wide text-dark-turquoise/50 transition-all duration-200 ease-in-out after:pointer-events-none after:absolute after:right-0 after:top-0 after:p-5 after:px-4 after:py-7 after:font-title after:text-dark-turquoise/50 after:content-['˅'] focus-within:border-medium-slate-blue focus-within:shadow-sm focus-within:shadow-dark-turquoise/30 focus-within:after:text-shadow"
                    options={roomTypeValues}
                    initialValue={gameMode()}
                    onChange={setGameMode}
                />
                <Button class="min-h-20 min-w-56" onClick={createRoom}>
                    Create Room
                </Button>
            </section>
            <div class="h-96 w-8 bg-divider" />
            <section class="flex flex-col items-center justify-evenly gap-16 p-24">
                <input
                    class="relative m-0 min-h-20 w-48 min-w-48 appearance-none rounded-lg border border-dark-turquoise/30 bg-transparent p-0 text-center text-4xl/relaxed font-medium uppercase tracking-wide text-dark-turquoise/50 caret-transparent outline-none transition-all duration-200 ease-in-out focus-visible:border-medium-slate-blue focus-visible:text-dark-turquoise focus-visible:shadow-sm focus-visible:shadow-dark-turquoise/30 focus-visible:text-shadow"
                    ref={setInputRef}
                    maxLength={MAX_ROOM_CODE_LENGTH}
                    placeholder="Code..."
                    value={roomCode()}
                    onInput={(e) => {
                        setRoomCode(e.currentTarget.value.toLocaleUpperCase())
                    }}
                    onKeyDown={setCaretToEnd}
                    onMouseDown={setCaretToEnd}
                />
                <Button class="min-h-20 min-w-56" onClick={joinRoom}>
                    Join Room
                </Button>
            </section>
        </section>
    )
}

export default PlayPanel
