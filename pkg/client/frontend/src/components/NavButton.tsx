import { ComponentProps, ParentComponent, mergeProps, splitProps } from "solid-js"
import { twMerge } from "tailwind-merge"
import Button from "@components/Button"
import { PlacementPosition } from "@constants/types"

type NavButtonProps = ComponentProps<typeof Button> & {
    position: PlacementPosition
}

const NavButton: ParentComponent<NavButtonProps> = (_props) => {
    const _defaultedProps = mergeProps({ position: PlacementPosition.LEFT }, _props)
    const [ownProps, forwardedProps] = splitProps(_defaultedProps, ["position"])

    return (
        <nav class={twMerge("absolute top-16", ownProps.position === PlacementPosition.LEFT ? "left-16" : "right-16")}>
            <Button {...forwardedProps} class={twMerge("min-h-16 min-w-32 backdrop-blur-md", forwardedProps.class)} />
        </nav>
    )
}

export default NavButton
