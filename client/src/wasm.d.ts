declare class Go {
    argv: string[]
    env: { [envKey: string]: string }
    exit: (code: number) => void
    importObject: WebAssembly.Imports
    exited: boolean
    mem: DataView
    run(instance: WebAssembly.Instance): Promise<void>

    // NOTE: Specific to go client implementation. Generate using typegen instead.
    createRoom(): boolean
    joinRoom(roomCode: string): boolean
}

declare var go: Go
