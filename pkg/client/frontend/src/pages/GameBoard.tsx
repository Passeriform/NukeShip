import TourControls from "@passeriform/three-tour-controls"
import { useParams } from "@solidjs/router"
import { Group as TweenGroup } from "@tweenjs/tween.js"
import { VoidComponent, createEffect, createSignal, onCleanup, onMount } from "solid-js"
import toast from "solid-toast"
import { PerspectiveCamera } from "three"
import { getWebGL2ErrorMessage, isWebGL2Available } from "three-stdlib"
import DetailsPane from "@components/DetailsPane"
import NavButton from "@components/NavButton"
import { ExampleFS } from "@constants/sample"
import { ELEVATION_FORWARD_QUATERNION, STATICS } from "@constants/statics"
import { FocusType, ViewType } from "@constants/types"
import RaycastSelector from "@game/RaycastSelector"
import TargetControls from "@game/targetControls"
import Sapling, { Tree } from "@game/tree"
import useCamera from "@game/useCamera"
import useLighting from "@game/useLighting"
import useScene from "@game/useScene"
import useViewportToolbar from "@game/useViewportToolbar"
import { boundsFromObjects } from "@utility/bounds"

// TODO: Cull whole node if it is being partially culled (https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633/5).
// TODO: Use actual FS data from native client.
// TODO: Fix regression of resizing the window not updating the renderer size.
// TODO: Target controls node change should also dispatch the changed node to the event handlers.

const TOUR_CONTROLS_BIRDS_EYE_OFFSET = 20
const TOUR_CONTROLS_ELEVATION_OFFSET = 4
const TOUR_CONTROLS_PLAN_OFFSET = 2
const TARGET_CONTROLS_OFFSET = 1

const PLAN_MATCH_OPACITY_MAP: Record<number, number> = {
    [-1]: 0.2,
    [1]: 0,
    [0]: 1,
}

const GameBoard: VoidComponent = () => {
    const { code } = useParams()

    const { scene, renderer } = useScene()
    const { ambientLight, directionalLight } = useLighting()
    const { camera } = useCamera()

    const [selectedSapling, setSelectedSapling] = createSignal<Sapling | undefined>(undefined)
    const [cameraTransitioning, setCameraTransitioning] = createSignal<boolean>(false)

    const tourControls = new TourControls(camera as PerspectiveCamera, [], window.document.body)
    const targetControls = new TargetControls(camera, window.document.body)

    const tweenGroup = new TweenGroup()

    const selfFsTree = new Tree(ExampleFS, 1)
    const opponentFsTree = new Tree(ExampleFS, 2)

    const { view, focus, isBirdsEye, domElement: viewportToolbar } = useViewportToolbar()

    const focussedTree = () =>
        (focus() === FocusType.SELF && selfFsTree) || (focus() === FocusType.OPPONENT && opponentFsTree) || undefined

    const tourBoundPoses = () =>
        (isBirdsEye() && [
            { bounds: boundsFromObjects(selfFsTree, opponentFsTree), quaternion: ELEVATION_FORWARD_QUATERNION },
        ]) ||
        (view() === ViewType.ELEVATION && [
            { bounds: boundsFromObjects(focussedTree()!), quaternion: ELEVATION_FORWARD_QUATERNION },
        ]) ||
        (view() === ViewType.PLAN &&
            focussedTree()!.levelBounds.map((bounds) => ({ bounds, quaternion: focussedTree()!.quaternion }))) ||
        undefined

    const tourCameraOffset = () =>
        (isBirdsEye() && TOUR_CONTROLS_BIRDS_EYE_OFFSET) ||
        (view() === ViewType.ELEVATION && TOUR_CONTROLS_ELEVATION_OFFSET) ||
        (view() === ViewType.PLAN && TOUR_CONTROLS_PLAN_OFFSET) ||
        undefined

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

        targetControls.addEventListener("select", ({ intersect }) => {
            setSelectedSapling(intersect as Sapling)
            focussedTree()?.traverse((obj) => {
                if (!obj.userData["depth"]) {
                    return
                }

                ;(obj as Sapling).setOpacity(tweenGroup, 0.8)
            })
            ;(intersect as Sapling).setOpacity(tweenGroup, 1)
        })
        targetControls.addEventListener("deselect", () => {
            setSelectedSapling(undefined)
            focussedTree()?.resetOpacity(tweenGroup)
        })
        targetControls.addEventListener("transitionChange", ({ transitioning }) => {
            setCameraTransitioning(transitioning)
        })

        // Disable context menu
        window.addEventListener("contextmenu", (event) => {
            event.preventDefault()
        })
    })

    // Opacity
    createEffect(() => {
        if (view() === ViewType.PLAN) {
            return focussedTree()?.traverse((obj) => {
                if (!obj.userData["depth"]) {
                    return
                }

                ;(obj as Sapling).setOpacity(tweenGroup, PLAN_MATCH_OPACITY_MAP[Math.sign(1 - obj.userData["depth"])]!)
            })
        }

        selfFsTree.resetOpacity(tweenGroup)
        opponentFsTree.resetOpacity(tweenGroup)
    })

    // Tour Controls
    createEffect(() => {
        tourControls.setBoundPoses(tourBoundPoses() ?? [])
        tourControls.cameraOffset = tourCameraOffset() ?? 0
    })

    // Target Controls
    createEffect(() => {
        targetControls.setInteractables(focussedTree() ? [focussedTree()!] : [])
        targetControls.cameraOffset = TARGET_CONTROLS_OFFSET
        targetControls.enabled = !isBirdsEye() && view() === ViewType.ELEVATION
        setSelectedSapling(undefined)
    })

    onCleanup(() => {
        selfFsTree.clear()
        opponentFsTree.clear()
        camera.clear()
    })

    return (
        <>
            {renderer.domElement}
            {viewportToolbar}
            <RaycastSelector
                camera={camera}
                filter={(matchedMeshes) =>
                    matchedMeshes
                        .filter((mesh) => mesh.userData["ignoreRaycast"] !== true)
                        .filter((mesh) => mesh.name === Sapling.MESH_NAME) as Sapling[]
                }
                root={focussedTree()}
                onClick={(mesh) => {
                    mesh && targetControls.pushTarget(mesh)
                }}
                onHover={(mesh, repeat, lastNode) => {
                    if (!mesh) {
                        lastNode?.glow(false, tweenGroup)
                        return
                    }

                    if (!repeat) {
                        lastNode?.glow(false, tweenGroup)
                    }

                    mesh.glow(true, tweenGroup)
                }}
            />
            <DetailsPane
                position={focus() === FocusType.SELF ? "left" : "right"}
                show={Boolean(selectedSapling()) && !cameraTransitioning()}
                title={selectedSapling()?.userData["label"]}
                content={selectedSapling()?.userData["content"]}
            />
            <NavButton nonInteractive position="right" text={code ?? ""} />
        </>
    )
}

export default GameBoard
