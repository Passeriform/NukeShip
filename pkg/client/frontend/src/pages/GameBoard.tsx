import { useParams } from "@solidjs/router"
import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Show, Switch, VoidComponent, createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { Match } from "solid-js"
import toast from "solid-toast"
import Stats from "stats.js"
import { Mesh } from "three"
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import Button from "@components/Button"
import NavButton from "@components/NavButton"
import { ExampleFS } from "@constants/sample"
import { ELEVATION_FORWARD_QUATERNION, STATICS } from "@constants/statics"
import { FocusType, ViewType } from "@constants/types"
import { ArchControls } from "@game/archControls"
import { TargetControls } from "@game/targetControls"
import { Tree } from "@game/tree"
import { boundsFromObjects } from "@utility/bounds"
import { createOrthographicCamera, createPerspectiveCamera } from "@utility/camera"
import { createLighting } from "@utility/lighting"
import { createScene } from "@utility/scene"
import { tweenOpacity } from "@utility/tween"

// TODO: Cull whole node if it is being partially culled (https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633/5).
// TODO: Use actual FS data from native client.

const ARCH_CONTROLS_OFFSET = {
    [ViewType.ELEVATION]: 4,
    [ViewType.PLAN]: 2,
}

const PLAN_MATCH_OPACITY_MAP: Record<number, number> = {
    [-1]: 0.2,
    [1]: 0,
    [0]: 1,
}

const GameBoard: VoidComponent = () => {
    const { code } = useParams()

    const { scene, renderer, cleanup: sceneCleanup } = createScene()
    const { ambientLight, directionalLight, cleanup: lightingCleanup } = createLighting()

    const [isCameraPerspective, _setIsCameraPerspective] = createSignal(true)
    const camera = isCameraPerspective() ? createPerspectiveCamera() : createOrthographicCamera()

    const archControls = new ArchControls(camera)
    const targetControls = new TargetControls([], camera)

    const tweenGroup = new TweenGroup()

    const selfFsTree = new Tree().setFromRawData(ExampleFS, 1)
    const opponentFsTree = new Tree().setFromRawData(ExampleFS, 2)

    const [view, setView] = createSignal<ViewType>(ViewType.ELEVATION)
    const [focus, setFocus] = createSignal<FocusType>(FocusType.NONE)

    const disableContextMenu = (event: MouseEvent) => {
        event.preventDefault()
    }

    const draw = (time: number = 0) => {
        archControls.update(time)
        targetControls.update(time)
        tweenGroup.update(time)
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
        archControls.addEventListener("drill", (event) =>
            [selfFsTree, opponentFsTree].forEach((tree) => {
                tree.traverseLevelOrder((mesh, levelIdx) => {
                    tweenOpacity(
                        tweenGroup,
                        mesh,
                        event.historyIdx === -1 ? 1 : PLAN_MATCH_OPACITY_MAP[Math.sign(event.historyIdx - levelIdx)],
                    )
                })
            }),
        )


        // Disable context menu
        window.addEventListener("contextmenu", disableContextMenu)

        // Resize handler
        window.addEventListener("resize", () => {
            renderer.setSize(window.innerWidth, window.innerHeight)
        })
    })

    // Handle tree views
    createEffect(() => {
        // Set position and rotation for NONE focus.
        if (focus() === FocusType.NONE) {
            setView(ViewType.ELEVATION)
            selfFsTree.traverseLevelOrder((mesh) => tweenOpacity(tweenGroup, mesh, 1))
            opponentFsTree.traverseLevelOrder((mesh) => tweenOpacity(tweenGroup, mesh, 1))
            return
        }

        const targetTree = focus() === FocusType.SELF ? selfFsTree : opponentFsTree

        switch (view()) {
            case ViewType.ELEVATION: {
                targetTree.traverseLevelOrder((mesh) => tweenOpacity(tweenGroup, mesh, 1))
                return
            }
            case ViewType.PLAN: {
                targetTree.traverseLevelOrder((mesh, levelIdx) =>
                    tweenOpacity(tweenGroup, mesh, PLAN_MATCH_OPACITY_MAP[Math.sign(0 - levelIdx)]),
                )
                return
            }
        }
    })

    // Handle arch controls
    createEffect(() => {
        if (focus() === FocusType.NONE) {
            archControls.cameraOffset = ARCH_CONTROLS_OFFSET[ViewType.ELEVATION]
            archControls.setPoses([[boundsFromObjects(selfFsTree, opponentFsTree)], ELEVATION_FORWARD_QUATERNION])
            return
        }

        const targetTree = focus() === FocusType.SELF ? selfFsTree : opponentFsTree

        archControls.cameraOffset = ARCH_CONTROLS_OFFSET[view()]

        // TODO: Preserve history for PLAN view when switching views.
        switch (view()) {
            case ViewType.ELEVATION: {
                archControls.setPoses([[boundsFromObjects(targetTree)], ELEVATION_FORWARD_QUATERNION])
                return
            }
            case ViewType.PLAN: {
                archControls.setPoses([targetTree.levelBounds, targetTree.quaternion.clone()])
                return
            }
        }
    })

    // Handle target controls
    createEffect(() => {
        if (focus() === FocusType.NONE) {
            targetControls.enabled = false
            targetControls.setTargets([selfFsTree, opponentFsTree])
            return
        }

        const targetTree = focus() === FocusType.SELF ? selfFsTree : opponentFsTree

        targetControls.enabled = true
        targetControls.setTargets([targetTree])
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
