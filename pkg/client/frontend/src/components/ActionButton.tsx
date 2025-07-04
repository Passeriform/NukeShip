import { combineProps } from "@solid-primitives/props"
import Mousetrap from "mousetrap"
import { Component, ComponentProps, For, Show, createEffect, createSignal, onCleanup, splitProps } from "solid-js"
import InfoButton from "./InfoButton"
import Shortcut from "./Shortcut"

type ActionButtonProps = ComponentProps<typeof InfoButton> & {
    shortcuts: string[]
}

const ActionButton: Component<ActionButtonProps> = (_props) => {
    const [ownProps, forwardedProps] = splitProps(_props, ["shortcuts"])

    const [infoButtonReference, setInfoButtonReference] = createSignal<HTMLButtonElement>()

    // NOTE: Exception for any typing due to combineProps breaking in typescript (https://github.com/solidjs-community/solid-primitives/issues/554)
    const combinedProps = combineProps(forwardedProps as any, {
        ref: setInfoButtonReference,
    }) as unknown as typeof forwardedProps

    createEffect(() => {
        if (ownProps.shortcuts.length) {
            Mousetrap.bind(ownProps.shortcuts, () => infoButtonReference()?.click())
        }

        onCleanup(() => {
            Mousetrap.unbind(ownProps.shortcuts)
        })
    })

    return (
        <>
            <InfoButton
                {...combinedProps}
                hintBody={
                    <>
                        {combinedProps.hintBody}
                        <Show when={ownProps.shortcuts.length}>
                            <p class="my-4 text-xs text-gray-500">
                                <For each={ownProps.shortcuts}>
                                    {(shortcut, shortcutIdx) => (
                                        <>
                                            <Shortcut shortcut={shortcut} />
                                            {shortcutIdx() < ownProps.shortcuts!.length - 1 && (
                                                <span class="mx-2 text-xs">or</span>
                                            )}
                                        </>
                                    )}
                                </For>
                            </p>
                        </Show>
                    </>
                }
            />
        </>
    )
}

export default ActionButton
