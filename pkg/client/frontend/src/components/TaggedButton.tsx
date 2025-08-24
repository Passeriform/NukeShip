import { ComponentProps, ParentComponent, mergeProps, splitProps } from "solid-js"
import { twMerge } from "tailwind-merge"
import Button from "@components/Button"

type TaggedButtonProps = ComponentProps<typeof Button> & {
    accentText: string
    accentClass?: string
    accentHoverText?: string
    accentHoverClass?: string
    action: () => void
}

const TaggedButton: ParentComponent<TaggedButtonProps> = (_props) => {
    const _defaultedProps = mergeProps({ accentClass: "", accentHoverClass: "" }, _props)
    const [ownProps, forwardedProps] = splitProps(_defaultedProps, [
        "accentClass",
        "accentText",
        "accentHoverText",
        "accentHoverClass",
        "action",
    ])

    return (
        <Button
            {...forwardedProps}
            onClick={ownProps.action}
            class={twMerge("group flex flex-row gap-4 px-4 py-8 shadow-lg backdrop-blur-md", forwardedProps.class)}
        >
            <span
                class={twMerge(
                    "h-full before:absolute before:left-0 before:top-0 before:-z-10 before:inline-flex before:h-full before:w-20 before:items-center before:justify-center before:rounded-es-lg before:pr-4 before:transition before:duration-200 before:content-[attr(data-text)] before:clip-path-pleat hover:before:shadow-sm group-hover:before:bg-red-800 group-hover:before:content-[attr(data-hover-text)]",
                    ownProps.accentClass
                        .split(" ")
                        .map((cls) => `before:${cls}`)
                        .join(" "),
                    ownProps.accentHoverClass
                        .split(" ")
                        .map((cls) => `group-hover:before:${cls}`)
                        .join(" "),
                )}
                data-text={ownProps.accentText}
                data-hover-text={ownProps.accentHoverText}
            />
            {forwardedProps.children}
        </Button>
    )
}

export default TaggedButton
