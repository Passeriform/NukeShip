import { autoUpdate, offset } from "@floating-ui/dom"
import Mousetrap from "mousetrap"
import { useFloating } from "solid-floating-ui"
import {
    ComponentProps,
    For,
    JSX,
    Show,
    VoidComponent,
    createEffect,
    createSignal,
    onCleanup,
    splitProps,
} from "solid-js"
import Button from "./Button"
import Kbd from "./Kbd"

// TODO: Extend InfoButton instead of Button.

type ActionButtonProps = ComponentProps<typeof Button> & {
    hintTitle: string
    hintBody: JSX.Element
    shortcuts: string[]
}

const ActionButton: VoidComponent<ActionButtonProps> = (props) => {
    const [actionProps, buttonProps] = splitProps(props, ["hintTitle", "hintBody", "shortcuts"])

    // TODO: Merge ref for button with the one from buttonProps.

    const [tooltipReference, setTooltipReference] = createSignal<HTMLButtonElement>()
    const [tooltipFloating, setTooltipFloating] = createSignal<HTMLElement>()
    const [showTooltip, setShowTooltip] = createSignal(false)

    const floatingResult = useFloating(tooltipReference, tooltipFloating, {
        placement: "top",
        whileElementsMounted: autoUpdate,
        middleware: [offset(20)],
    })

    createEffect(() => {
        if (props.shortcuts.length) {
            Mousetrap.bind(props.shortcuts, () => tooltipReference()?.click())
        }

        onCleanup(() => {
            Mousetrap.unbind(props.shortcuts)
        })
    })

    return (
        <>
            <Button
                {...buttonProps}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                ref={setTooltipReference}
            />
            {showTooltip() && (
                <div
                    ref={setTooltipFloating}
                    style={{
                        position: floatingResult.strategy,
                        top: `${floatingResult.y ?? 0}px`,
                        left: `${floatingResult.x ?? 0}px`,
                    }}
                    class="w-72 rounded-lg border border-neon-teal bg-midnight-navy p-4 text-justify shadow-neon-teal/30"
                >
                    <h3 class="mb-4 font-title text-2xl">{actionProps.hintTitle}</h3>
                    {/* Change the font of description text from Fugaz to something more legible. Make that the default font instead. */}
                    {actionProps.hintBody === "string" ? (
                        <p class="mb-8">{actionProps.hintBody}</p>
                    ) : (
                        actionProps.hintBody
                    )}
                    <Show when={props.shortcuts.length}>
                        <p class="my-4 text-xs text-gray-500">
                            <For each={props.shortcuts}>
                                {(shortcut, shortcutIdx) => (
                                    <>
                                        <Kbd shortcut={shortcut} />
                                        {shortcutIdx() < props.shortcuts!.length - 1 && (
                                            <span class="mx-2 text-xs">or</span>
                                        )}
                                    </>
                                )}
                            </For>
                        </p>
                    </Show>
                </div>
            )}
        </>
    )
}

export default ActionButton
