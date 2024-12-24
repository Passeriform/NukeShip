import { VoidComponent } from "solid-js"

interface ButtonProps {
    text?: string
    onClick?: (event: MouseEvent) => void
}

const Button: VoidComponent<ButtonProps> = ({ onClick = () => undefined, text = "" }) => {
    return (
        <button
            class="group relative min-h-20 min-w-56 cursor-pointer appearance-none rounded-lg border border-accent/30 bg-transparent px-3 py-5 text-base/relaxed font-medium uppercase tracking-wide text-accent/50 outline-none transition-all duration-200 ease-in-out before:absolute before:left-1/10 before:top-0 before:h-px before:w-16 before:-translate-y-px before:bg-accent before:transition-all before:duration-200 before:ease-in-out after:absolute after:bottom-0 after:right-1/10 after:h-px after:w-16 after:translate-y-px after:bg-accent after:transition-all after:duration-200 after:ease-in-out hover:border-accent-alt hover:text-accent hover:shadow-blue hover:text-shadow hover:before:left-0 hover:before:w-5 hover:after:right-0 hover:after:w-5"
            on:click={onClick}
        >
            <span class="before:absolute before:bottom-1/3 before:right-0 before:h-5 before:w-px before:translate-x-px before:bg-accent before:transition-all before:duration-200 before:ease-in-out after:absolute after:left-0 after:top-1/3 after:h-5 after:w-px after:-translate-x-px after:bg-accent after:transition-all after:duration-200 after:ease-in-out group-hover:before:bottom-0 group-hover:after:top-0" />
            {text}
        </button>
    )
}

export default Button
