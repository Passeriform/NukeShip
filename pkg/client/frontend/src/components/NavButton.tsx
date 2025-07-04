import { Component, ComponentProps, mergeProps, splitProps } from "solid-js"
import { twMerge } from "tailwind-merge"
import Button from "./Button"

type NavButtonProps = ComponentProps<typeof Button> & {
    position: "left" | "right"
}

const NavButton: Component<NavButtonProps> = (_props) => {
    const [ownProps, forwardedProps] = splitProps(mergeProps({ position: "left" }, _props), ["position"])

    return (
        <nav class={twMerge("absolute top-16", ownProps.position === "left" ? "left-16" : "right-16")}>
            <Button {...forwardedProps} class={twMerge("min-h-16 min-w-32 backdrop-blur-md", forwardedProps.class)} />
        </nav>
    )
}

export default NavButton
