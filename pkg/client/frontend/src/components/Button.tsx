import { JSX, Ref, Show, VoidComponent, mergeProps } from "solid-js"
import { twMerge } from "tailwind-merge"

interface ButtonProps {
    text: JSX.Element
    embellish?: boolean
    nonInteractive?: boolean
    class?: string
    ref?: Ref<HTMLButtonElement>
    onMouseEnter?: (event: MouseEvent) => void
    onMouseLeave?: (event: MouseEvent) => void
    onClick?: (event: MouseEvent) => void
}

const Button: VoidComponent<ButtonProps> = (_props) => {
    const props = mergeProps({ embellish: true, nonInteractive: false }, _props)

    return (
        <button
            class={twMerge(
                "group relative cursor-pointer appearance-none rounded-lg border border-neon-magenta bg-dark-purple bg-transparent px-3 py-5 text-base/tight font-medium uppercase tracking-wide outline-none transition-all duration-200 ease-in-out hover:rounded-ee-none hover:rounded-ss-none hover:border-neon-teal hover:text-cyber-yellow hover:shadow-sm hover:shadow-neon-teal/40 hover:text-shadow focus:rounded-ee-none focus:rounded-ss-none focus:border-neon-teal focus:text-cyber-yellow focus:shadow-sm focus:shadow-neon-teal/40 focus:text-shadow",
                props.nonInteractive ? "pointer-events-none cursor-default" : "",
                props.class ?? "",
            )}
            tabIndex={props.nonInteractive ? -1 : 0}
            ref={props.ref}
            onClick={props.onClick}
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
        >
            <Show when={props.embellish}>
                <span class="before:absolute before:left-1/10 before:top-0 before:h-px before:w-16 before:-translate-y-px before:bg-neon-teal before:transition-all before:duration-200 before:ease-in-out after:absolute after:bottom-0 after:right-1/10 after:h-px after:w-16 after:translate-y-px after:bg-neon-teal after:transition-all after:duration-200 after:ease-in-out group-hover:before:left-0 group-hover:before:w-5 group-hover:before:bg-electric-purple group-hover:after:right-0 group-hover:after:w-5 group-hover:after:bg-electric-purple group-focus:before:left-0 group-focus:before:w-5 group-focus:after:right-0 group-focus:after:w-5" />
                <span class="before:absolute before:bottom-1/3 before:right-0 before:h-5 before:w-px before:translate-x-px before:bg-neon-teal before:transition-all before:duration-200 before:ease-in-out after:absolute after:left-0 after:top-1/3 after:h-5 after:w-px after:-translate-x-px after:bg-neon-teal after:transition-all after:duration-200 after:ease-in-out group-hover:before:bottom-0 group-hover:before:bg-electric-purple group-hover:after:top-0 group-hover:after:bg-electric-purple group-focus:before:bottom-0 group-focus:after:top-0" />
            </Show>
            {props.text ?? ""}
        </button>
    )
}

export default Button
