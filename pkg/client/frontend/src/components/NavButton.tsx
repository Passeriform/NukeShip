import { ComponentProps, VoidComponent, mergeProps, splitProps } from "solid-js"
import { twMerge } from "tailwind-merge"
import Button from "./Button"

type NavButtonProps = ComponentProps<typeof Button> & {
    position: "left" | "right"
}

const NavButton: VoidComponent<NavButtonProps> = (_props) => {
    const [navProps, buttonProps] = splitProps(mergeProps({ position: "left" }, _props), ["position"])

    return (
        <nav class={twMerge("absolute top-16", navProps.position === "left" ? "left-16" : "right-16")}>
            <Button {...buttonProps} class={twMerge("min-h-16 min-w-32 backdrop-blur-md", buttonProps.class)} />
        </nav>
    )
}

export default NavButton
