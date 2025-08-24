import { combineProps } from "@solid-primitives/props"
import { JSX, ParentComponent, Show, mergeProps, splitProps } from "solid-js"
import { twMerge } from "tailwind-merge"

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    embellish?: boolean
    propagate?: boolean
}

const Button: ParentComponent<ButtonProps> = (_props) => {
    const [_ownProps, _forwardedProps] = splitProps(_props, ["embellish", "propagate"])
    const ownProps = mergeProps({ embellish: true, propagate: false }, _ownProps)

    const combinedProps = () =>
        combineProps(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Exception for type casting due to combineProps breaking in typescript (https://github.com/solidjs-community/solid-primitives/issues/554)
            _forwardedProps as any,
            !ownProps.propagate && {
                onClick: (e: MouseEvent) => {
                    e.stopPropagation()
                },
                onHover: (e: MouseEvent) => {
                    e.stopPropagation()
                },
                onMouseEnter: (e: MouseEvent) => {
                    e.stopPropagation()
                },
                onMouseLeave: (e: MouseEvent) => {
                    e.stopPropagation()
                },
            },
        ) as unknown as typeof _forwardedProps

    return (
        <button
            {...combinedProps()}
            class={twMerge(
                "group relative cursor-pointer appearance-none rounded-lg border border-dark-turquoise/30 bg-transparent px-3 py-5 font-medium uppercase tracking-wide text-dark-turquoise outline-none backdrop-blur-md transition-all duration-200 ease-in-out hover:rounded-ee-none hover:rounded-ss-none hover:border-medium-slate-blue hover:text-dark-turquoise hover:shadow-sm hover:shadow-dark-turquoise/30 hover:text-shadow focus-visible:rounded-ee-none focus-visible:rounded-ss-none focus-visible:border-medium-slate-blue focus-visible:text-dark-turquoise focus-visible:shadow-sm focus-visible:shadow-dark-turquoise/30 focus-visible:text-shadow",
                combinedProps().class,
            )}
        >
            <Show when={ownProps.embellish}>
                <span class="before:absolute before:left-1/10 before:top-0 before:h-px before:w-16 before:-translate-y-px before:bg-dark-turquoise before:transition-all before:duration-200 before:ease-in-out after:absolute after:bottom-0 after:right-1/10 after:h-px after:w-16 after:translate-y-px after:bg-dark-turquoise after:transition-all after:duration-200 after:ease-in-out group-hover:before:left-0 group-hover:before:w-5 group-hover:after:right-0 group-hover:after:w-5 group-focus-visible:before:left-0 group-focus-visible:before:w-5 group-focus-visible:after:right-0 group-focus-visible:after:w-5" />
                <span class="before:absolute before:bottom-1/3 before:right-0 before:h-5 before:w-px before:translate-x-px before:bg-dark-turquoise before:transition-all before:duration-200 before:ease-in-out after:absolute after:left-0 after:top-1/3 after:h-5 after:w-px after:-translate-x-px after:bg-dark-turquoise after:transition-all after:duration-200 after:ease-in-out group-hover:before:bottom-0 group-hover:after:top-0 group-focus-visible:before:bottom-0 group-focus-visible:after:top-0" />
            </Show>
            {combinedProps().children}
        </button>
    )
}

export default Button
