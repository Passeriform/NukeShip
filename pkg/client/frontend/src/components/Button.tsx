import { JSX, Ref, VoidComponent, mergeProps } from "solid-js"
import { twMerge } from "tailwind-merge"

interface ButtonProps {
    text: JSX.Element
    nonInteractive?: boolean
    class?: string
    ref?: Ref<HTMLButtonElement>
    onMouseEnter?: (event: MouseEvent) => void
    onMouseLeave?: (event: MouseEvent) => void
    onClick?: (event: MouseEvent) => void
}

const Button: VoidComponent<ButtonProps> = (_props) => {
    const props = mergeProps({ nonInteractive: false }, _props)

    return (
        <button
            class={twMerge(
                "group relative cursor-pointer appearance-none rounded-lg border border-dark-turquoise/30 bg-transparent px-3 py-5 text-base/tight font-medium uppercase tracking-wide text-dark-turquoise/50 outline-none transition-all duration-200 ease-in-out before:absolute before:left-1/10 before:top-0 before:h-px before:w-16 before:-translate-y-px before:bg-dark-turquoise before:transition-all before:duration-200 before:ease-in-out after:absolute after:bottom-0 after:right-1/10 after:h-px after:w-16 after:translate-y-px after:bg-dark-turquoise after:transition-all after:duration-200 after:ease-in-out hover:rounded-ee-none hover:rounded-ss-none hover:border-medium-slate-blue hover:text-dark-turquoise hover:shadow-sm hover:shadow-dark-turquoise/30 hover:text-shadow hover:before:left-0 hover:before:w-5 hover:after:right-0 hover:after:w-5 focus:rounded-ee-none focus:rounded-ss-none focus:border-medium-slate-blue focus:text-dark-turquoise focus:shadow-sm focus:shadow-dark-turquoise/30 focus:text-shadow focus:before:left-0 focus:before:w-5 focus:after:right-0 focus:after:w-5",
                props.nonInteractive ? "pointer-events-none cursor-default" : "",
                props.class ?? "",
            )}
            tabIndex={props.nonInteractive ? -1 : 0}
            ref={props.ref}
            onClick={props.onClick}
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
        >
            <span class="before:absolute before:bottom-1/3 before:right-0 before:h-5 before:w-px before:translate-x-px before:bg-dark-turquoise before:transition-all before:duration-200 before:ease-in-out after:absolute after:left-0 after:top-1/3 after:h-5 after:w-px after:-translate-x-px after:bg-dark-turquoise after:transition-all after:duration-200 after:ease-in-out group-hover:before:bottom-0 group-hover:after:top-0" />
            {props.text ?? ""}
        </button>
    )
}

export default Button
