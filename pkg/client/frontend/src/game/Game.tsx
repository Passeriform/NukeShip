import { useInteraction } from "@passeriform/solid-fiber-interaction"
import { Show, createSignal } from "solid-js"
import PerspectivePanel from "@components/PerspectivePanel"
import { PlacementPosition } from "@constants/types"
import ActionToolbar from "@game/ActionToolbar"
import NodeDetails from "@game/NodeDetails"
import PlannerPanel from "@game/PlannerPanel"
import ViewportToolbar from "@game/ViewportToolbar"
import { Sapling } from "@game/tree"
import useControls from "@game/useControls"
import useGameFiber from "@game/useGameFiber"
import PlannerProvider from "@providers/Planner"

const Game = () => {
    const { focussingSelfTree, selectedSapling, switchFocussedTree, controlsItinerary, controlsUpdater } =
        useGameFiber()

    const { interaction } = useInteraction()
    const { transitioning: cameraTransitioning } = useControls({
        itinerary: controlsItinerary,
        onLocationChange: controlsUpdater,
    })

    const [hoveringSelectionPanel, setHoveringSelectionPanel] = createSignal(false)

    return (
        <>
            <section class="absolute bottom-8 flex flex-row justify-evenly gap-8">
                <ViewportToolbar focussingSelf={focussingSelfTree()} switchFocus={switchFocussedTree} />
            </section>
            <PlannerProvider>
                <PerspectivePanel
                    class="pointer-events-auto"
                    position={focussingSelfTree() ? PlacementPosition.LEFT : PlacementPosition.RIGHT}
                    transitionTiming={100}
                    show={Boolean(selectedSapling()) && !cameraTransitioning()}
                    seeThrough={hoveringSelectionPanel() && Boolean(interaction.hovered.current)}
                    onMouseEnter={() => setHoveringSelectionPanel(true)}
                    onMouseLeave={() => setHoveringSelectionPanel(false)}
                >
                    <Show when={Boolean(selectedSapling())}>
                        <NodeDetails data={selectedSapling()!.userData} />
                        {/* TODO: Make target attacks only available on leaf nodes. */}
                        <Show when={focussingSelfTree()}>
                            <ActionToolbar source={selectedSapling()!} destination={undefined as unknown as Sapling} />
                        </Show>
                    </Show>
                </PerspectivePanel>
                <PlannerPanel />
            </PlannerProvider>
        </>
    )
}

export default Game
