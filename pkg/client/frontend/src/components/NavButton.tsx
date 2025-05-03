import { VoidComponent, mergeProps } from "solid-js"
import { twMerge } from "tailwind-merge"
import Button from "./Button"

interface NavButtonProps {
    text?: string
    class?: string
    onClick?: (event: MouseEvent) => void
    position: "left" | "right"
}

const NavButton: VoidComponent<NavButtonProps> = (_props) => {
    const props = mergeProps({ onClick: () => undefined }, _props)
    return (
        <nav
            class={twMerge(`absolute ${props.position === "left" ? "left-16" : "right-16"} top-16`, props.class ?? "")}
        >
            <Button class="min-h-16 min-w-32 backdrop-blur-md" text={props.text ?? ""} onClick={props.onClick} />
        </nav>
    )
}

export default NavButton
