import { ComponentProps, ParentComponent, Show, VoidComponent, mergeProps } from "solid-js"
import ActionButton from "@components/ActionButton"
import { FocusType, ViewType } from "@constants/types"
import useViewport from "@game/useViewport"

interface ViewportToolbarProps extends ReturnType<typeof useViewport> {
    renderSlot?: ParentComponent<ComponentProps<typeof ActionButton>>
}

const ViewportToolbar: VoidComponent<ViewportToolbarProps> = (_props) => {
    const props = mergeProps({ renderSlot: ActionButton }, _props)

    return (
        <Show
            when={!props.birdsEye()}
            fallback={
                <props.renderSlot
                    hintTitle="Back"
                    hintBody=""
                    shortcuts={["esc", "b"]}
                    onClick={() => {
                        props.actions.setBirdsEye(false)
                    }}
                >
                    ⮪
                </props.renderSlot>
            }
        >
            <props.renderSlot
                hintTitle="Switch Views"
                hintBody="Switch between a side (elevation) view or top-down (plan) view"
                shortcuts={["q"]}
                onClick={() => {
                    props.actions.setView(props.view() === ViewType.PLAN ? ViewType.ELEVATION : ViewType.PLAN)
                }}
            >
                🔄
            </props.renderSlot>
            <Show
                when={props.focus() === FocusType.SELF}
                fallback={
                    <props.renderSlot
                        hintTitle="Back"
                        hintBody="Get back to your board"
                        shortcuts={["esc", "r"]}
                        onClick={() => {
                            props.actions.setFocus(FocusType.SELF)
                        }}
                    >
                        ⬅
                    </props.renderSlot>
                }
            >
                <props.renderSlot
                    hintTitle="Peek At Opponent"
                    hintBody="Peek at the opponent's board"
                    shortcuts={["r"]}
                    onClick={() => {
                        props.actions.setFocus(FocusType.OPPONENT)
                    }}
                >
                    👁
                </props.renderSlot>
            </Show>
            <props.renderSlot
                hintTitle="Bird's Eye View"
                hintBody="Switch to a bird's eye view of the game board."
                shortcuts={["b"]}
                onClick={() => {
                    props.actions.setBirdsEye(true)
                }}
            >
                🧿
            </props.renderSlot>
        </Show>
    )
}

export default ViewportToolbar
