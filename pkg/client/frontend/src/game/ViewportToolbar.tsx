import { Show, VoidComponent } from "solid-js"
import ActionButton from "@components/ActionButton"
import { ActionContent, CONTENT } from "@constants/content"
import { FocusType, ViewType } from "@constants/types"
import { useViewport } from "@providers/Viewport"

const contentToActionButtonProps = (content: ActionContent) => ({
    hintTitle: content.title,
    hintBody: content.description,
    shortcuts: content.shortcuts,
    children: content.icon,
})

const ViewportToolbar: VoidComponent = () => {
    const { viewport, setViewport } = useViewport()

    return (
        <Show
            when={!viewport.birdsEye}
            fallback={
                <ActionButton
                    {...contentToActionButtonProps(CONTENT.VIEWPORT_ACTIONS.BACK_FROM_BIRDS_EYE_VIEW)}
                    class="px-8 py-2 text-4xl"
                    hintClass="w-72"
                    onClick={() => {
                        setViewport("birdsEye", false)
                    }}
                />
            }
        >
            <ActionButton
                {...contentToActionButtonProps(CONTENT.VIEWPORT_ACTIONS.SWITCH_VIEWS)}
                class="px-8 py-2 text-4xl"
                hintClass="w-72"
                onClick={() => {
                    setViewport("view", viewport.view === ViewType.PLAN ? ViewType.ELEVATION : ViewType.PLAN)
                }}
            />
            <ActionButton
                {...contentToActionButtonProps(
                    viewport.focus === FocusType.SELF
                        ? CONTENT.VIEWPORT_ACTIONS.PEEK_AT_OPPONENT
                        : CONTENT.VIEWPORT_ACTIONS.BACK_FROM_PEEK_AT_OPPONENT,
                )}
                class="px-8 py-2 text-4xl"
                hintClass="w-72"
                onClick={() => {
                    setViewport("focus", viewport.focus === FocusType.SELF ? FocusType.OPPONENT : FocusType.SELF)
                }}
            />
            <ActionButton
                {...contentToActionButtonProps(CONTENT.VIEWPORT_ACTIONS.BIRDS_EYE_VIEW)}
                class="px-8 py-2 text-4xl"
                hintClass="w-72"
                onClick={() => {
                    setViewport("birdsEye", true)
                }}
            />
        </Show>
    )
}

export default ViewportToolbar
