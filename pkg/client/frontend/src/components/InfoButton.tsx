import { autoPlacement, autoUpdate, offset } from "@floating-ui/dom"
import { combineProps } from "@solid-primitives/props"
import { useFloating } from "solid-floating-ui"
import { ComponentProps, JSX, ParentComponent, createSignal, mergeProps, splitProps } from "solid-js"
import { Portal } from "solid-js/web"
import { twMerge } from "tailwind-merge"
import Button from "@components/Button"

type InfoButtonProps = ComponentProps<typeof Button> & {
    hintTitle: string
    hintBody: JSX.Element
    hintClass?: string
}

const InfoButton: ParentComponent<InfoButtonProps> = (_props) => {
    const _defaultedProps = mergeProps({ hintClass: "" }, _props)
    const [ownProps, _forwardedProps] = splitProps(_defaultedProps, ["hintTitle", "hintBody", "hintClass"])

    const [tooltipReference, setTooltipReference] = createSignal<HTMLButtonElement>()
    const [tooltipFloating, setTooltipFloating] = createSignal<HTMLElement>()
    const [showTooltip, setShowTooltip] = createSignal(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Exception for type casting due to combineProps breaking in typescript (https://github.com/solidjs-community/solid-primitives/issues/554)
    const combinedProps = combineProps(_forwardedProps as any, {
        ref: setTooltipReference,
        onMouseEnter: () => setShowTooltip(true),
        onMouseLeave: () => setShowTooltip(false),
    }) as unknown as typeof _forwardedProps

    const floatingResult = useFloating(tooltipReference, tooltipFloating, {
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(20),
            autoPlacement({
                allowedPlacements: ["top", "bottom"],
            }),
        ],
    })

    return (
        <>
            <Button {...combinedProps} />
            {showTooltip() && (
                <Portal>
                    <div
                        ref={setTooltipFloating}
                        style={{
                            position: floatingResult.strategy,
                            top: `${floatingResult.y ?? 0}px`,
                            left: `${floatingResult.x ?? 0}px`,
                        }}
                        class={twMerge(
                            "rounded-lg border border-dark-turquoise/30 bg-elderberry p-4 text-justify",
                            ownProps.hintClass,
                        )}
                    >
                        <h3 class="mb-4 font-title text-2xl">{ownProps.hintTitle}</h3>
                        {/* Change the font of description text from Fugaz to something more legible. Make that the default font instead. */}
                        {ownProps.hintBody === "string" ? <p class="mb-8">{ownProps.hintBody}</p> : ownProps.hintBody}
                    </div>
                </Portal>
            )}
        </>
    )
}

export default InfoButton
