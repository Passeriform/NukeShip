import { autoUpdate, offset } from "@floating-ui/dom"
import { useFloating } from "solid-floating-ui"
import { ComponentProps, JSX, VoidComponent, createSignal, splitProps } from "solid-js"
import { twMerge } from "tailwind-merge"
import Button from "./Button"

type InfoButtonProps = ComponentProps<typeof Button> & {
    hintTitle: string
    hintBody: JSX.Element
}

const InfoButton: VoidComponent<InfoButtonProps> = (props) => {
    const [infoProps, buttonProps] = splitProps(props, ["hintTitle", "hintBody"])

    // TODO: Merge ref for button with the one from buttonProps.

    const [tooltipReference, setTooltipReference] = createSignal<HTMLButtonElement>()
    const [tooltipFloating, setTooltipFloating] = createSignal<HTMLElement>()
    const [showTooltip, setShowTooltip] = createSignal(false)

    const floatingResult = useFloating(tooltipReference, tooltipFloating, {
        placement: "top",
        whileElementsMounted: autoUpdate,
        middleware: [offset(20)],
    })

    return (
        <>
            <Button
                {...buttonProps}
                class={twMerge("text-dark-turquoise", buttonProps.class)}
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
                    class="w-72 rounded-lg border border-dark-turquoise/30 bg-elderberry p-4 text-justify"
                >
                    <h3 class="mb-4 font-title text-2xl">{infoProps.hintTitle}</h3>
                    {/* Change the font of description text from Fugaz to something more legible. Make that the default font instead. */}
                    {infoProps.hintBody === "string" ? <p class="mb-8">{infoProps.hintBody}</p> : infoProps.hintBody}
                </div>
            )}
        </>
    )
}

export default InfoButton
