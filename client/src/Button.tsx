import { Component } from "solid-js"

interface ButtonProps {
    text?: string
    onClick?: (event: MouseEvent) => void
}

const Button: Component<ButtonProps> = ({ onClick = () => undefined, text = "" }) => {
    return (
        <button on:click={onClick}>
            <span />
            {text}
        </button>
    )
}

export default Button
