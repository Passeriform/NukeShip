import { Component } from "solid-js"

interface ButtonProps {
    text?: string
    onClick?: (event: MouseEvent) => void
}

const Button: Component<ButtonProps> = ({ onClick = () => undefined, text = "" }) => {
    return (
        <button
            class="bg-transparent before:h-px before:w-16 after:h-px after:w-16 hover:before:w-5 hover:after:w-5 before:-translate-y-px after:translate-y-px before:left-1/10 after:right-1/10 hover:text-shadow group relative min-h-20 min-w-56 cursor-pointer appearance-none rounded-lg border border-accent/30 px-3 py-5 text-base/relaxed font-medium uppercase tracking-wide text-accent/50 outline-none transition-all duration-200 ease-in-out before:absolute before:top-0 before:bg-accent before:transition-all before:duration-200 before:ease-in-out after:absolute after:bottom-0 after:bg-accent after:transition-all after:duration-200 after:ease-in-out hover:border-accent-alt hover:text-accent hover:shadow-blue hover:before:left-0 hover:after:right-0"
            on:click={onClick}
        >
            <span class="before:h-5 before:w-px after:h-5 after:w-px before:translate-x-px after:-translate-x-px before:absolute before:bottom-1/3 before:right-0 before:bg-accent before:transition-all before:duration-200 before:ease-in-out after:absolute after:left-0 after:top-1/3 after:bg-accent after:transition-all after:duration-200 after:ease-in-out group-hover:before:bottom-0 group-hover:after:top-0" />
            {text}
        </button>
    )
}

export default Button
