import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Show, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js"
import { Object3D } from "three"
import PerspectivePanel from "@components/PerspectivePanel"
import { ExampleFS } from "@constants/sample"
import { CONTROLS, FLIP_Y_QUATERNION, OBJECTS } from "@constants/statics"
import { FocusType, PlacementPosition } from "@constants/types"
import ActionToolbar from "@game/ActionToolbar"
import NodeDetails from "@game/NodeDetails"
import PlannerPanel from "@game/PlannerPanel"
import ViewportToolbar from "@game/ViewportToolbar"
import Tree, { Sapling } from "@game/tree"
import { useControls } from "@hooks/useControls"
import { useInteraction } from "@providers/Interaction"
import PlannerProvider from "@providers/Planner"
import { useScene } from "@providers/Scene"
import { useViewport } from "@providers/Viewport"

const TREE_OPACITY_TWEEN_RENDER_ID = "TREE_OPACITY_TWEEN"

const Game = () => {
    const { addDrawDirective, addToScene } = useScene()
    const { viewport, setViewport } = useViewport()

    const selfFsTree = new Tree(ExampleFS, 1)
    const opponentFsTree = new Tree(ExampleFS, 2)
    const tweenGroup = new TweenGroup()

    const focussedTree = () => {
        if (viewport.birdsEye) {
            return undefined
        }

        switch (viewport.focus) {
            case "SELF":
                return selfFsTree
            case "OPPONENT":
                return opponentFsTree
        }
    }

    /* --- Interaction --- */
    const { interaction, setRoot: setSelectionRoot, setFilter: setSelectionFilter } = useInteraction<Sapling>()

    createEffect(() => {
        if (interaction.hovered.repeat) {
            return
        }

        interaction.hovered.last?.glow(false, tweenGroup)
        interaction.hovered.current?.glow(true, tweenGroup)

        document.body.style.cursor = interaction.hovered.current ? "pointer" : "default"
    })

    createEffect(() => {
        setSelectionRoot(focussedTree())
    })
    /* --- Interaction --- */

    /* --- Controls --- */
    const controlLocations = createMemo(() => {
        const distance = CONTROLS.VIEWING_DISTANCE[viewport.view]

        if (viewport.birdsEye) {
            return [
                {
                    meshes: [
                        Object.values(selfFsTree.levels).flat(),
                        Object.values(opponentFsTree.levels).flat(),
                    ].flat(),
                    quaternion: CONTROLS.QUATERNION.ELEVATION.clone(),
                    distance,
                },
            ]
        }

        switch (viewport.view) {
            case "PLAN":
                return Object.values(focussedTree()!.levels).map((meshes) => ({
                    meshes,
                    quaternion: focussedTree()!.quaternion.clone().multiply(FLIP_Y_QUATERNION),
                    distance,
                }))
            case "ELEVATION":
                return [
                    {
                        meshes: Object.values(focussedTree()!.levels).flat(),
                        quaternion: CONTROLS.QUATERNION.ELEVATION.clone(),
                        distance,
                    },
                ]
        }
    })

    const { activeLocation, transitioning: cameraTransitioning } = useControls<Sapling>({
        locations: controlLocations,
    })

    createEffect(() => {
        if (!activeLocation()?.length) {
            focussedTree()!.setOpacity(tweenGroup, 1)
            return
        }

        if (!focussedTree()) {
            return
        }

        // If visit is of selection
        if (interaction.selected.current) {
            focussedTree()!.setOpacity(tweenGroup, 0.8)
            activeLocation()!.forEach((mesh) => {
                mesh.setOpacity(tweenGroup, 1)
            })
            return
        }

        switch (viewport.view) {
            case "PLAN": {
                const drilledDepth = activeLocation()![0]!.userData.depth
                focussedTree()!.setOpacity(tweenGroup, (iterDepth) => {
                    if (drilledDepth === iterDepth) {
                        return 1
                    }

                    if (drilledDepth < iterDepth) {
                        return 0.2
                    }

                    return 0
                })
                return
            }
            case "ELEVATION": {
                focussedTree()!.setOpacity(tweenGroup, 1)
                return
            }
        }
    })
    /* --- Controls --- */

    /* --- Life Cycle --- */
    onMount(() => {
        // Node trees
        selfFsTree.position.copy(OBJECTS.SELF.position)
        selfFsTree.quaternion.copy(OBJECTS.SELF.quaternion)
        opponentFsTree.position.copy(OBJECTS.OPPONENT.position)
        opponentFsTree.quaternion.copy(OBJECTS.OPPONENT.quaternion)
        addToScene(selfFsTree)
        addToScene(opponentFsTree)

        // TODO: Refresh control locations declaratively instead of a hack.
        setViewport("focus", FocusType.OPPONENT)
        setViewport("focus", FocusType.SELF)

        setSelectionFilter(
            () => (meshes: Object3D[]) =>
                meshes
                    .filter((mesh) => mesh.userData["ignoreRaycast"] !== true)
                    .filter((mesh) => mesh.name === Sapling.MESH_NAME) as Sapling[],
        )

        addDrawDirective(TREE_OPACITY_TWEEN_RENDER_ID, (time) => {
            tweenGroup.update(time)
        })

        // Disable context menu
        window.addEventListener("contextmenu", (event) => {
            event.preventDefault()
        })
    })

    onCleanup(() => {
        selfFsTree.clear()
        opponentFsTree.clear()
    })
    /* --- Life Cycle --- */

    const showDetails = () =>
        Boolean(interaction.selected.current) && activeLocation()?.length === 1 && !cameraTransitioning()
    const [hoveringSelectionPanel, setHoveringSelectionPanel] = createSignal(false)

    return (
        <>
            <section class="absolute bottom-8 flex flex-row justify-evenly gap-8">
                <ViewportToolbar />
            </section>
            <PlannerProvider>
                <PerspectivePanel
                    class="pointer-events-auto"
                    position={viewport.focus === FocusType.SELF ? PlacementPosition.LEFT : PlacementPosition.RIGHT}
                    transitionTiming={100}
                    show={showDetails()}
                    seeThrough={hoveringSelectionPanel() && Boolean(interaction.hovered.current)}
                    onMouseEnter={() => setHoveringSelectionPanel(true)}
                    onMouseLeave={() => setHoveringSelectionPanel(false)}
                >
                    <NodeDetails data={activeLocation()![0]!.userData} />
                    {/* TODO: Make target attacks only available on leaf nodes. */}
                    <Show when={viewport.focus === FocusType.SELF}>
                        <ActionToolbar source={activeLocation()![0]!} destination={undefined as unknown as Sapling} />
                    </Show>
                </PerspectivePanel>
                <PlannerPanel />
            </PlannerProvider>
        </>
    )
}

export default Game
