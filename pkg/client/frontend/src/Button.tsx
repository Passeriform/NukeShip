import { VoidComponent } from "solid-js"

interface ButtonProps {
    text?: string
    class?: string
    onClick?: (event: MouseEvent) => void
}

const Button: VoidComponent<ButtonProps> = ({ onClick = () => undefined, class: cls = "", text = "" }) => {
    return (
        <button
            class={`${cls} group relative cursor-pointer appearance-none rounded-lg border border-dark-turquoise/30 bg-transparent px-3 py-5 text-base/tight font-medium uppercase tracking-wide text-dark-turquoise/50 outline-none transition-all duration-200 ease-in-out before:absolute before:left-1/10 before:top-0 before:h-px before:w-16 before:-translate-y-px before:bg-dark-turquoise before:transition-all before:duration-200 before:ease-in-out after:absolute after:bottom-0 after:right-1/10 after:h-px after:w-16 after:translate-y-px after:bg-dark-turquoise after:transition-all after:duration-200 after:ease-in-out hover:border-medium-slate-blue hover:text-dark-turquoise hover:shadow-sm hover:shadow-dark-turquoise/30 hover:text-shadow hover:before:left-0 hover:before:w-5 hover:after:right-0 hover:after:w-5`}
            on:click={onClick}
        >
            <span class="before:absolute before:bottom-1/3 before:right-0 before:h-5 before:w-px before:translate-x-px before:bg-dark-turquoise before:transition-all before:duration-200 before:ease-in-out after:absolute after:left-0 after:top-1/3 after:h-5 after:w-px after:-translate-x-px after:bg-dark-turquoise after:transition-all after:duration-200 after:ease-in-out group-hover:before:bottom-0 group-hover:after:top-0" />
            {text}
        </button>
    )
}

export default Button
