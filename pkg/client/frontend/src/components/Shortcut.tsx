import { For, JSX, VoidComponent, createMemo, splitProps } from "solid-js"
import { twMerge } from "tailwind-merge"

type ShortcutProps = JSX.HTMLAttributes<HTMLElement> & {
    shortcut: string
}

const Shortcut: VoidComponent<ShortcutProps> = (_props) => {
    const [ownProps, forwardedProps] = splitProps(_props, ["shortcut"])

    const keystrokes = createMemo(() => ownProps.shortcut.split("+"))

    return (
        <For each={keystrokes()}>
            {(keystroke, keystrokeIdx) => (
                <>
                    <kbd
                        {...forwardedProps}
                        class={twMerge(
                            "whitespace-nowrap rounded-lg border border-b-2 bg-black-blue px-2 py-1 pb-2 text-base font-bold",
                            forwardedProps.class,
                        )}
                    >
                        {keystroke}
                    </kbd>
                    {keystrokeIdx() < keystrokes().length - 1 && <span class="mx-2 text-xs">+</span>}
                </>
            )}
        </For>
    )
}

export default Shortcut
