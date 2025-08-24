import { combineProps } from "@solid-primitives/props"
import Mousetrap from "mousetrap"
import { ComponentProps, For, ParentComponent, Show, createEffect, createSignal, onCleanup, splitProps } from "solid-js"
import InfoButton from "@components/InfoButton"
import Shortcut from "@components/Shortcut"

type ActionButtonProps = ComponentProps<typeof InfoButton> & {
    shortcuts: string[]
}

const ActionButton: ParentComponent<ActionButtonProps> = (_props) => {
    const [ownProps, _forwardedProps] = splitProps(_props, ["shortcuts"])

    const [infoButtonReference, setInfoButtonReference] = createSignal<HTMLButtonElement>()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Exception for type casting due to combineProps breaking in typescript (https://github.com/solidjs-community/solid-primitives/issues/554)
    const combinedProps = combineProps(_forwardedProps as any, {
        ref: setInfoButtonReference,
    }) as unknown as typeof _forwardedProps

    createEffect(() => {
        if (ownProps.shortcuts.length) {
            const clickHandler = () => infoButtonReference()?.click()
            Mousetrap.bind(ownProps.shortcuts, clickHandler)
        }

        onCleanup(() => {
            Mousetrap.unbind(ownProps.shortcuts)
        })
    })

    return (
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
                                        {shortcutIdx() < ownProps.shortcuts.length - 1 && (
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
    )
}

export default ActionButton
