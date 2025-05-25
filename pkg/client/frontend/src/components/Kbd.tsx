import { For, VoidComponent } from "solid-js"

interface KbdProps {
    shortcut: string
}

const Kbd: VoidComponent<KbdProps> = (props) => {
    const keystrokes = props.shortcut.split("+")

    return (
        <For each={keystrokes}>
            {(keystroke, keystrokeIdx) => (
                <>
                    <kbd class="whitespace-nowrap rounded-lg border border-b-2 bg-black-blue px-2 py-1 pb-2 text-base font-bold">
                        {keystroke}
                    </kbd>
                    {keystrokeIdx() < keystrokes.length - 1 && <span class="mx-2 text-xs">+</span>}
                </>
            )}
        </For>
    )
}

export default Kbd
