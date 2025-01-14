import { VoidComponent } from "solid-js"
import Button from "./Button"

interface NavButtonProps {
    text?: string
    class?: string
    onClick?: (event: MouseEvent) => void
    position: "left" | "right"
}

const NavButton: VoidComponent<NavButtonProps> = ({
    onClick = () => undefined,
    class: cls = "",
    text = "",
    position = "left",
}) => {
    return (
        <nav class={`absolute ${position === "left" ? "left-16" : "right-16"} top-16 ${cls}`}>
            <Button class="min-h-16 min-w-32" text={text} onClick={onClick} />
        </nav>
    )
}

export default NavButton
