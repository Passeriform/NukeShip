import TourControls from "@passeriform/three-tour-controls"
import { useParams } from "@solidjs/router"
import { Group as TweenGroup } from "@tweenjs/tween.js"
import { VoidComponent, createEffect, createSignal, onCleanup, onMount } from "solid-js"
import toast from "solid-toast"
import { PerspectiveCamera } from "three"
import { getWebGL2ErrorMessage, isWebGL2Available } from "three-stdlib"
import NavButton from "@components/NavButton"
import NodeDetails from "@components/NodeDetails"
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
// TODO: RMB click to restore camera position, camera orientation, selected sapling, and drilled depth.

const TOUR_CONTROLS_BIRDS_EYE_OFFSET = 20
const TOUR_CONTROLS_ELEVATION_OFFSET = 4
const TOUR_CONTROLS_PLAN_OFFSET = 2
const TARGET_CONTROLS_OFFSET = 1

const GameBoard: VoidComponent = () => {
    const { code } = useParams()

    const { scene, renderer } = useScene()
    const { ambientLight, directionalLight } = useLighting()
    const { camera } = useCamera()

    const [hoveringSapling, setHoveringSapling] = createSignal<boolean>(false)
    const [selectedSapling, setSelectedSapling] = createSignal<Sapling | undefined>(undefined)
    const [drilledDepth, setDrilledDepth] = createSignal<number | undefined>(undefined)
    const [cameraTransitioning, setCameraTransitioning] = createSignal<boolean>(false)

    const tourControls = new TourControls(camera as PerspectiveCamera, [], window.document.body)
    const targetControls = new TargetControls(camera, window.document.body)

    const tweenGroup = new TweenGroup()

    const selfFsTree = new Tree(ExampleFS, 1)
    const opponentFsTree = new Tree(ExampleFS, 2)

    const { view, focus, isBirdsEye, domElement: viewportToolbar } = useViewportToolbar()

    const focussedTree = () =>
        (focus() === FocusType.SELF && selfFsTree) || (focus() === FocusType.OPPONENT && opponentFsTree) || undefined

    const showNodeDetails = () => Boolean(selectedSapling()) && !cameraTransitioning()

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
        tourControls.addEventListener("drill", ({ historyIdx }) => {
            setDrilledDepth(historyIdx + 1)
        })

        targetControls.addEventListener("select", ({ intersect }) => {
            setSelectedSapling(intersect as Sapling)
            setHoveringSapling(false)
        })
        targetControls.addEventListener("deselect", () => {
            setSelectedSapling(undefined)
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
        if (selectedSapling()) {
            focussedTree()?.traverse((obj) => {
                if (!obj.userData["depth"]) {
                    return
                }

                ;(obj as Sapling).setOpacity(tweenGroup, 0.8)
            })
            selectedSapling()!.setOpacity(tweenGroup, 1)
            return
        }

        if (view() === ViewType.PLAN && drilledDepth()) {
            focussedTree()!.traverse((obj) => {
                if (!obj.userData["depth"]) {
                    return
                }

                const opacity =
                    obj.userData["depth"] < drilledDepth()! ? 0 : obj.userData["depth"] > drilledDepth()! ? 0.2 : 1

                ;(obj as Sapling).setOpacity(tweenGroup, opacity)
            })
            return
        }

        selfFsTree.resetOpacity(tweenGroup)
        opponentFsTree.resetOpacity(tweenGroup)
    })

    // Mouse Cursor
    createEffect(() => {
        document.body.style.cursor = hoveringSapling() ? "pointer" : "default"
    })

    // Tour Controls
    createEffect(() => {
        const tourBoundPoses =
            // If birds eye view or no tree is focussed, single bound pose on both trees.
            ((isBirdsEye() || !focussedTree()) && [
                { bounds: boundsFromObjects(selfFsTree, opponentFsTree), quaternion: ELEVATION_FORWARD_QUATERNION },
            ]) ||
            // If elevation view, single bound pose on entire focussed tree.
            (view() === ViewType.ELEVATION && [
                { bounds: boundsFromObjects(focussedTree()!), quaternion: ELEVATION_FORWARD_QUATERNION },
            ]) ||
            // If plan view, bound poses for each level of the focussed tree.
            (view() === ViewType.PLAN &&
                focussedTree()!.levelBounds.map((bounds) => ({ bounds, quaternion: focussedTree()!.quaternion }))) ||
            []

        const tourCameraOffset =
            (isBirdsEye() && TOUR_CONTROLS_BIRDS_EYE_OFFSET) ||
            (view() === ViewType.ELEVATION && TOUR_CONTROLS_ELEVATION_OFFSET) ||
            (view() === ViewType.PLAN && TOUR_CONTROLS_PLAN_OFFSET) ||
            0

        tourControls.setBoundPoses(tourBoundPoses)
        tourControls.setCameraOffset(tourCameraOffset)
    })

    // Target Controls
    createEffect(() => {
        targetControls.setInteractables(focussedTree() ? [focussedTree()!] : [])
        targetControls.setCameraOffset(TARGET_CONTROLS_OFFSET)
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
                        setHoveringSapling(false)
                        lastNode?.glow(false, tweenGroup)
                        return
                    }

                    if (!repeat) {
                        lastNode?.glow(false, tweenGroup)
                    }

                    setHoveringSapling(true)
                    mesh.glow(true, tweenGroup)
                }}
            />
            <div class="pointer-events-none absolute flex h-full w-full items-center justify-center perspective-origin-center perspective-800">
                <NodeDetails
                    position={focus() === FocusType.SELF ? "left" : "right"}
                    show={showNodeDetails}
                    transitionTiming={100}
                    label={selectedSapling()?.userData["label"]}
                    sentinel={selectedSapling()?.userData["sentinel"]}
                    power={selectedSapling()?.userData["power"]}
                    shield={selectedSapling()?.userData["shield"]}
                    rechargeRate={selectedSapling()?.userData["rechargeRate"]}
                    revealBehind={(obstructingHover) => obstructingHover && hoveringSapling()}
                />
            </div>
            <NavButton nonInteractive position="right" text={code ?? ""} />
        </>
    )
}

export default GameBoard
