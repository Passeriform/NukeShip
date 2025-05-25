import TourControls from "@passeriform/three-tour-controls"
import { useParams } from "@solidjs/router"
import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Show, VoidComponent, createEffect, createMemo, createSignal, on, onCleanup, onMount } from "solid-js"
import toast from "solid-toast"
import { PerspectiveCamera, Raycaster, Vector2 } from "three"
import { getWebGL2ErrorMessage, isWebGL2Available } from "three-stdlib"
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

const TOUR_CONTROLS_BIRDS_EYE_OFFSET = 20
const TOUR_CONTROLS_FOCUSSED_OFFSET = {
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
    const [focus, setFocus] = createSignal<FocusType>(FocusType.SELF)
    const [isBirdsEye, setIsBirdsEye] = createSignal<boolean>(false)

    const focussedTree = createMemo(
        () =>
            (focus() === FocusType.SELF && selfFsTree) ||
            (focus() === FocusType.OPPONENT && opponentFsTree) ||
            undefined,
    )

    const disableContextMenu = (event: MouseEvent) => {
        event.preventDefault()
    }

    const getIntersectedMesh = (event: MouseEvent) => {
        raycaster.setFromCamera(
            new Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1),
            camera,
        )

        if (!focussedTree()) {
            return
        }

        const intersects = raycaster.intersectObjects([focussedTree()!], true)

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
        if (!isWebGL2Available()) {
            toast.error(`WebGL is not available ${getWebGL2ErrorMessage()}`, { duration: -1 })
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
        tourControls.addEventListener("drill", (event) => {
            if (!focussedTree()) {
                return
            }

            focussedTree()!.traverse((obj) => {
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
            focussedTree()?.traverse((obj) => {
                if (!obj.userData["depth"]) {
                    return
                }

                ;(obj as Sapling).setOpacity(tweenGroup, 0.8)
            })
            ;(event.intersect as Sapling).setOpacity(tweenGroup, 1)
        })
        targetControls.addEventListener("deselect", () => {
            focussedTree()?.resetOpacity(tweenGroup)
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

    // Align view on dependent state changes.
    createEffect(
        on([focus, isBirdsEye], () => {
            setView(ViewType.ELEVATION)
        }),
    )

    // Handle tree node opacity
    createEffect(() => {
        if (view() === ViewType.PLAN) {
            focussedTree()?.traverse((obj) => {
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
        if (isBirdsEye()) {
            tourControls.cameraOffset = TOUR_CONTROLS_BIRDS_EYE_OFFSET
            tourControls.setBoundPoses([
                { bounds: boundsFromObjects(selfFsTree, opponentFsTree), quaternion: ELEVATION_FORWARD_QUATERNION },
            ])
            return
        }

        tourControls.cameraOffset = TOUR_CONTROLS_FOCUSSED_OFFSET[view()]

        if (!focussedTree()) {
            return
        }

        // TODO: Preserve history for PLAN view when switching views.
        switch (view()) {
            case ViewType.ELEVATION: {
                tourControls.setBoundPoses([
                    { bounds: boundsFromObjects(focussedTree()!), quaternion: ELEVATION_FORWARD_QUATERNION },
                ])
                return
            }
            case ViewType.PLAN: {
                tourControls.setBoundPoses(
                    focussedTree()!.levelBounds.map((bounds) => ({
                        bounds,
                        quaternion: focussedTree()!.quaternion.clone(),
                    })),
                )
                return
            }
        }
    })

    // Handle target controls
    createEffect(() => {
        targetControls.setInteractables(focussedTree() ? [focussedTree()!] : [])
        targetControls.enabled = !isBirdsEye()
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
                <Show when={isBirdsEye()}>
                    <Button
                        class="p-8"
                        text="Focus Back"
                        onClick={() => {
                            setIsBirdsEye(false)
                        }}
                    />
                </Show>
                <Show when={!isBirdsEye()}>
                    <Button
                        class="p-8"
                        text="Switch View"
                        onClick={() => {
                            setView(view() === ViewType.PLAN ? ViewType.ELEVATION : ViewType.PLAN)
                        }}
                    />
                    <Button
                        class="p-8"
                        text={focus() === FocusType.SELF ? "Peek Opponent" : "Back to Self"}
                        onClick={() => {
                            setFocus(focus() === FocusType.SELF ? FocusType.OPPONENT : FocusType.SELF)
                        }}
                    />
                    <Button
                        class="p-8"
                        text="Bird's Eye"
                        onClick={() => {
                            setIsBirdsEye(true)
                        }}
                    />
                </Show>
            </section>
            <NavButton nonInteractive position="right" text={code ?? ""} />
        </>
    )
}

export default GameBoard
