import TourControls from "@passeriform/three-tour-controls"
import { useParams } from "@solidjs/router"
import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Show, Switch, VoidComponent, createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { Match } from "solid-js"
import toast from "solid-toast"
import { PerspectiveCamera, Raycaster, Vector2 } from "three"
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import Button from "@components/Button"
import NavButton from "@components/NavButton"
import { ExampleFS } from "@constants/sample"
import { ELEVATION_FORWARD_QUATERNION, STATICS } from "@constants/statics"
import { FocusType, ViewType } from "@constants/types"
import { TargetControls } from "@game/targetControls"
import { Sapling, Tree } from "@game/tree"
import { boundsFromObjects } from "@utility/bounds"
import { createOrthographicCamera, createPerspectiveCamera } from "@utility/camera"
import { createLighting } from "@utility/lighting"
import { createScene } from "@utility/scene"

// TODO: Cull whole node if it is being partially culled (https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633/5).
// TODO: Use actual FS data from native client.

const TOUR_CONTROLS_OFFSET = {
    [ViewType.ELEVATION]: 4,
    [ViewType.PLAN]: 2,
}
const TARGET_CONTROLS_OFFSET = 1

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

    const tourControls = new TourControls(camera as PerspectiveCamera, [], renderer.domElement)
    const targetControls = new TargetControls(camera, renderer.domElement)

    const tweenGroup = new TweenGroup()

    const selfFsTree = new Tree(ExampleFS, 1)
    const opponentFsTree = new Tree(ExampleFS, 2)

    const raycaster = new Raycaster()
    let lastHoveredNode: Sapling | undefined

    const [view, setView] = createSignal<ViewType>(ViewType.ELEVATION)
    const [focus, setFocus] = createSignal<FocusType>(FocusType.NONE)

    const getFocussedTree = () =>
        (focus() === FocusType.SELF && selfFsTree) || (focus() === FocusType.OPPONENT && opponentFsTree) || undefined

    const disableContextMenu = (event: MouseEvent) => {
        event.preventDefault()
    }

    const getIntersectedMesh = (event: MouseEvent) => {
        raycaster.setFromCamera(
            new Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1),
            camera,
        )

        const targetTree = getFocussedTree()
        if (!targetTree) {
            return
        }

        const intersects = raycaster.intersectObjects([targetTree], true)

        const [matched] = intersects
            .map((intersection) => intersection.object)
            .filter((mesh) => mesh.userData["ignoreRaycast"] !== true)
            .filter((mesh) => mesh.name === Sapling.MESH_NAME)
            .map((obj) => obj as unknown as Sapling)

        return matched
    }

    const handleNodeHover = (event: MouseEvent) => {
        const matched = getIntersectedMesh(event)

        if (!matched) {
            if (lastHoveredNode) {
                lastHoveredNode.glow(false, tweenGroup)
                lastHoveredNode = undefined
            }
            return
        }

        if (matched !== lastHoveredNode) {
            if (lastHoveredNode) {
                lastHoveredNode.glow(false, tweenGroup)
            }
            lastHoveredNode = matched
        }

        matched.glow(true, tweenGroup)
    }

    const handleNodeClick = (event: MouseEvent) => {
        const matched = getIntersectedMesh(event)

        if (!matched) {
            return
        }

        targetControls.pushTarget(matched)
    }

    const draw = (time: number = 0) => {
        tourControls.update(time)
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

        // Controls
        tourControls.cameraOffset = TOUR_CONTROLS_OFFSET[view()]
        tourControls.addEventListener("drill", (event) => {
            const targetTree = getFocussedTree()

            if (!targetTree) {
                return
            }

            targetTree.traverse((obj) => {
                if (!obj.userData["depth"]) {
                    return
                }

                ;(obj as Sapling).setOpacity(
                    tweenGroup,
                    PLAN_MATCH_OPACITY_MAP[Math.sign(event.historyIdx - obj.userData["depth"] + 1)]!,
                )
            })
        })

        targetControls.cameraOffset = TARGET_CONTROLS_OFFSET
        targetControls.addEventListener("select", (event) => {
            const targetTree = getFocussedTree()

            targetTree?.traverse((obj) => {
                if (!obj.userData["depth"]) {
                    return
                }

                ;(obj as Sapling).setOpacity(tweenGroup, 0.8)
            })
            ;(event.intersect as Sapling).setOpacity(tweenGroup, 1)
        })
        targetControls.addEventListener("deselect", () => {
            const targetTree = getFocussedTree()

            targetTree?.resetOpacity(tweenGroup)
        })

        // Node hover
        window.addEventListener("mousemove", handleNodeHover)

        // Node selection
        window.addEventListener("click", handleNodeClick)

        // Disable context menu
        window.addEventListener("contextmenu", disableContextMenu)

        // Resize handler
        window.addEventListener("resize", () => {
            renderer.setSize(window.innerWidth, window.innerHeight)
        })
    })

    // Handle view setting for NONE focus.
    createEffect(() => {
        // Set position and rotation for NONE focus.
        if (focus() === FocusType.NONE) {
            setView(ViewType.ELEVATION)
            return
        }
    })

    // Handle tree node opacity
    createEffect(() => {
        if (view() === ViewType.PLAN) {
            getFocussedTree()?.traverse((obj) => {
                if (!obj.userData["depth"]) {
                    return
                }

                ;(obj as Sapling).setOpacity(tweenGroup, PLAN_MATCH_OPACITY_MAP[Math.sign(1 - obj.userData["depth"])]!)
            })
        } else {
            selfFsTree.resetOpacity(tweenGroup)
            opponentFsTree.resetOpacity(tweenGroup)
        }
    })

    // Handle tour controls
    createEffect(() => {
        if (focus() === FocusType.NONE) {
            tourControls.cameraOffset = TOUR_CONTROLS_OFFSET[ViewType.ELEVATION]
            tourControls.setBoundPoses([
                { bounds: boundsFromObjects(selfFsTree, opponentFsTree), quaternion: ELEVATION_FORWARD_QUATERNION },
            ])
            return
        }

        tourControls.cameraOffset = TOUR_CONTROLS_OFFSET[view()]

        const targetTree = getFocussedTree()
        if (!targetTree) {
            return
        }

        // TODO: Preserve history for PLAN view when switching views.
        switch (view()) {
            case ViewType.ELEVATION: {
                tourControls.setBoundPoses([
                    { bounds: boundsFromObjects(targetTree), quaternion: ELEVATION_FORWARD_QUATERNION },
                ])
                return
            }
            case ViewType.PLAN: {
                tourControls.setBoundPoses(
                    targetTree.levelBounds.map((bounds) => ({ bounds, quaternion: targetTree.quaternion.clone() })),
                )
                return
            }
        }
    })

    // Handle target controls
    createEffect(() => {
        const targetTree = getFocussedTree()
        targetControls.setInteractables(targetTree ? [targetTree] : [])
        targetControls.enabled = focus() !== FocusType.NONE
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
