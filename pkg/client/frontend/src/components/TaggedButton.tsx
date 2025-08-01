import { Component, ComponentProps, splitProps } from "solid-js"
import { twMerge } from "tailwind-merge"
import Button from "./Button"

type TaggedButtonProps = ComponentProps<typeof Button> & {
    // TODO: Flatten to attributes
    accent: {
        text: string
        class?: string
    }
    hoverAccent: {
        text: string
        class?: string
    }
    action: () => void
}

const TaggedButton: Component<TaggedButtonProps> = (_props) => {
    const [ownProps, forwardedProps] = splitProps(_props, ["accent", "action", "hoverAccent"])

    const accentClass = `before:${ownProps.accent.class}`
    const hoverAccentClass = `group-hover:before:${ownProps.hoverAccent.class}`

    return (
        <>
            <Button
                {...forwardedProps}
                onClick={ownProps.action}
                class={twMerge("group flex flex-row gap-4 px-4 py-8 shadow-lg backdrop-blur-md", forwardedProps.class)}
            >
                <span
                    class={twMerge(
                        "h-full before:absolute before:left-0 before:top-0 before:-z-10 before:inline-flex before:h-full before:w-20 before:items-center before:justify-center before:rounded-es-lg before:pr-4 before:transition before:duration-200 before:content-[attr(data-text)] before:clip-path-pleat hover:before:shadow-sm group-hover:before:bg-red-800 group-hover:before:content-[attr(data-hover-text)]",
                        accentClass,
                        hoverAccentClass,
                    )}
                    data-text={ownProps.accent.text}
                    data-hover-text={ownProps.hoverAccent.text}
                />
                {forwardedProps.children}
            </Button>
        </>
    )
}

export default TaggedButton
