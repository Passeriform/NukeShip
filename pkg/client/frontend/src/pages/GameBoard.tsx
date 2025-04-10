import { useParams } from "@solidjs/router"
import { Show, Switch, VoidComponent, createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { Match } from "solid-js"
import toast from "solid-toast"
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import Button from "@components/Button"
import NavButton from "@components/NavButton"
import { ExampleFS } from "@constants/sample"
import { ELEVATION_FORWARD_QUATERNION, STATICS } from "@constants/statics"
import { FocusType } from "@constants/types"
import { ArchControls, DrillEvent, ViewType } from "@game/archControls"
import { boundsFromObjects } from "@game/bounds"
import { createOrthographicCamera, createPerspectiveCamera } from "@game/camera"
import { createLighting } from "@game/lighting"
import { createScene } from "@game/scene"
import { TargetControls } from "@game/targetControls"
import { Tree } from "@game/tree"
import { tweenOpacity } from "@game/tween"

// TODO: Cull whole node if it is being partially culled (https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633/5).
// TODO: Use actual FS data from native client.

const GameBoard: VoidComponent = () => {
    const { code } = useParams()

    const { scene, renderer, cleanup: sceneCleanup } = createScene()
    const { ambientLight, directionalLight, cleanup: lightingCleanup } = createLighting()

    const [isCameraPerspective, _setIsCameraPerspective] = createSignal(true)
    const camera = isCameraPerspective() ? createPerspectiveCamera() : createOrthographicCamera()
    const archControls = new ArchControls([], ViewType.ELEVATION, camera)
    const targetControls = new TargetControls([], camera)

    const selfFsTree = new Tree().setFromRawData(ExampleFS, 1)
    const opponentFsTree = new Tree().setFromRawData(ExampleFS, 2)

    const [view, setView] = createSignal<ViewType>(ViewType.ELEVATION)
    const [focus, setFocus] = createSignal<FocusType>(FocusType.NONE)

    const disableContextMenu = (event: MouseEvent) => {
        event.preventDefault()
    }

    const focusTransform = ({ targets: objects, historyIdx: focusIdx, tweenGroup }: Omit<DrillEvent, "type">) => {
        const opacityMatchMap: Record<number, number> = {
            [-1]: 0.2,
            [1]: 0,
            [0]: 1,
        }

        ;(objects as Tree[]).forEach((tree) => {
            tree.traverseLevelOrder((mesh, levelIdx) => {
                tweenOpacity(tweenGroup, mesh, focusIdx === -1 ? 1 : opacityMatchMap[Math.sign(focusIdx - levelIdx)])
            })
        })
    }

    const draw = (time: number = 0) => {
        archControls.update(time)
        targetControls.update(time)
        selfFsTree.update(time)
        opponentFsTree.update(time)
        renderer.render(scene, camera)
    }

    onMount(() => {
        if (!WebGL.isWebGL2Available()) {
            toast.error(`WebGL is not available ${WebGL.getWebGL2ErrorMessage()}`, { duration: -1 })
            return
        }

        // Renderer
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setAnimationLoop(draw)

        // Lighting
        directionalLight.position.copy(STATICS.DIRECTIONAL_LIGHT.position)
        scene.add(ambientLight)
        scene.add(directionalLight)

        // Node trees
        selfFsTree.position.copy(STATICS.SELF.position)
        selfFsTree.quaternion.copy(STATICS.SELF.rotation)
        opponentFsTree.position.copy(STATICS.OPPONENT.position)
        opponentFsTree.quaternion.copy(STATICS.OPPONENT.rotation)
        scene.add(selfFsTree)
        scene.add(opponentFsTree)
        selfFsTree.recomputeBounds()
        opponentFsTree.recomputeBounds()

        // Controls
        archControls.addEventListener("drillStart", (event) => focusTransform({ ...event, historyIdx: 0 }))
        archControls.addEventListener("drillEnd", (event) => focusTransform({ ...event, historyIdx: -1 }))
        archControls.addEventListener("drill", focusTransform)

        // Disable context menu
        window.addEventListener("contextmenu", disableContextMenu)

        // Resize handler
        window.addEventListener("resize", () => {
            renderer.setSize(window.innerWidth, window.innerHeight)
        })
    })

    createEffect(() => {
        // Set position and rotation for NONE focus.
        if (focus() === FocusType.NONE) {
            setView(ViewType.ELEVATION)
            archControls.setTargets([selfFsTree, opponentFsTree], ViewType.ELEVATION, [
                [boundsFromObjects(selfFsTree, opponentFsTree)],
                ELEVATION_FORWARD_QUATERNION,
            ])
            targetControls.enabled = false
            targetControls.setTargets([])
            return
        }

        const targetTree = focus() === FocusType.SELF ? selfFsTree : opponentFsTree

        targetControls.enabled = true
        targetControls.setTargets([targetTree])

        switch (view()) {
            case ViewType.ELEVATION: {
                archControls.setTargets([targetTree], ViewType.ELEVATION, [
                    [boundsFromObjects(targetTree)],
                    ELEVATION_FORWARD_QUATERNION,
                ])
                return
            }
            case ViewType.PLAN: {
                archControls.setTargets([targetTree], ViewType.PLAN, [
                    targetTree.levelBounds,
                    targetTree.quaternion.clone(),
                ])
                return
            }
        }
    })

    onCleanup(() => {
        selfFsTree.clear()
        opponentFsTree.clear()
        camera.clear()
        lightingCleanup()
        sceneCleanup()

        window.removeEventListener("contextmenu", disableContextMenu)
    })

    return (
        <>
            {renderer.domElement}
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
