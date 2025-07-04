import { Show, createEffect, createSignal, on } from "solid-js"
import ActionButton from "@components/ActionButton"
import { FocusType, ViewType } from "@constants/types"

const useViewportToolbar = () => {
    const [isBirdsEye, setIsBirdsEye] = createSignal(false)
    const [view, setView] = createSignal<ViewType>(ViewType.PLAN)
    const [focus, setFocus] = createSignal<FocusType>(FocusType.SELF)

    createEffect(
        on([focus, isBirdsEye], () => {
            setView(ViewType.ELEVATION)
        }),
    )

    const domElement = (
        <section class="absolute bottom-8 flex flex-row justify-evenly gap-8">
            <Show
                when={!isBirdsEye()}
                fallback={
                    <ActionButton
                        class="p-8 text-4xl/tight"
                        hintTitle="Back"
                        hintBody=""
                        shortcuts={["esc", "b"]}
                        onClick={() => {
                            setIsBirdsEye(false)
                        }}
                    >
                        ⮪
                    </ActionButton>
                }
            >
                <ActionButton
                    class="p-8 text-4xl/tight"
                    hintTitle="Switch Views"
                    hintBody="Switch between a side (elevation) view or top-down (plan) view"
                    shortcuts={["q"]}
                    onClick={() => {
                        setView(view() === ViewType.PLAN ? ViewType.ELEVATION : ViewType.PLAN)
                    }}
                >
                    🔄
                </ActionButton>
                <Show
                    when={focus() === FocusType.SELF}
                    fallback={
                        <ActionButton
                            class="p-8 text-4xl/tight"
                            hintTitle="Back"
                            hintBody="Get back to your board"
                            shortcuts={["esc", "r"]}
                            onClick={() => {
                                setFocus(FocusType.SELF)
                            }}
                        >
                            ⬅
                        </ActionButton>
                    }
                >
                    <ActionButton
                        class="p-8 text-4xl/tight"
                        hintTitle="Peek At Opponent"
                        hintBody="Peek at the opponent's board"
                        shortcuts={["r"]}
                        onClick={() => {
                            setFocus(FocusType.OPPONENT)
                        }}
                    >
                        👁
                    </ActionButton>
                </Show>
                <ActionButton
                    class="p-8 text-4xl/tight"
                    hintTitle="Bird's Eye View"
                    hintBody="Switch to a bird's eye view of the game board."
                    shortcuts={["b"]}
                    onClick={() => {
                        setIsBirdsEye(true)
                    }}
                >
                    🧿
                </ActionButton>
            </Show>
        </section>
    )

    return { domElement, isBirdsEye, view, focus }
}

export default useViewportToolbar
