import { Match, Show, Switch, VoidComponent, createEffect, createSignal } from "solid-js"
import toast from "solid-toast"
import Button from "@components/Button"
import NavButton from "@components/NavButton"
import { FocusType, ViewType } from "@constants/types"
import GameRenderer, { CameraType } from "@game/GameRenderer"

// TODO: Cull whole node if it is being partially culled (https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633/5).
// TODO: Use actual FS data from native client.

const GameBoard: VoidComponent = () => {
    const code = "WRXCB"

    const [cameraType, setCameraType] = createSignal<CameraType>(CameraType.PERSPECTIVE)

    const [view, setView] = createSignal<ViewType>(ViewType.ELEVATION)
    const [focus, setFocus] = createSignal<FocusType>(FocusType.NONE)

    createEffect(() => {
        if (focus() === FocusType.NONE) {
            setView(ViewType.ELEVATION)
        }
    })

    return (
        <>
            <GameRenderer
                cameraType={cameraType()}
                onIncompatible={(renderableError) => toast.error(renderableError, { duration: -1 })}
                focus={focus()}
                view={view()}
            />
            <section class="absolute bottom-8 flex flex-row justify-evenly gap-8">
                <Switch>
                    <Match when={focus() === FocusType.NONE}>
                        <Button
                            class="p-8"
                            text="Focus Self"
                            onClick={() => {
                                setFocus(FocusType.SELF)
                            }}
                        />
                        <Button
                            class="p-8"
                            text="Focus Opponent"
                            onClick={() => {
                                setFocus(FocusType.OPPONENT)
                            }}
                        />
                    </Match>
                </Switch>
                <Show when={focus() !== FocusType.NONE}>
                    <Button
                        class="p-8"
                        text="Switch View"
                        onClick={() => {
                            setView(view() === ViewType.PLAN ? ViewType.ELEVATION : ViewType.PLAN)
                        }}
                    />
                    <Button
                        class="p-8"
                        text="Focus Back"
                        onClick={() => {
                            setFocus(FocusType.NONE)
                        }}
                    />
                </Show>
            </section>
            <NavButton class="pointer-events-none cursor-default" position="right" text={code} />
        </>
    )
}

export default GameBoard
