import { Group as TweenGroup } from "@tweenjs/tween.js"
import { createEffect, createMemo, createSignal, on, onMount } from "solid-js"
import { Object3D } from "three"
import { ExampleFS } from "@constants/sample"
import { CONTROLS, FLIP_Y_QUATERNION, OBJECTS } from "@constants/statics"
import { ViewType } from "@constants/types"
import { useInteraction } from "@providers/Interaction"
import { useScene } from "@providers/Scene"
import { useViewport } from "@providers/Viewport"
import { Sapling } from "../game/tree"
import createTree from "./createTree"

const TREE_OPACITY_TWEEN_RENDER_ID = "TREE_OPACITY_TWEEN"

const useGameFiber = () => {
    const { addDrawDirective } = useScene()
    const { viewport, setViewport } = useViewport()

    const trees = [
        {
            source: ExampleFS,
            colorSeed: 1,
            position: OBJECTS.SELF.position.clone(),
            quaternion: OBJECTS.SELF.quaternion.clone(),
        },
        {
            source: ExampleFS,
            colorSeed: 2,
            position: OBJECTS.OPPONENT.position.clone(),
            quaternion: OBJECTS.OPPONENT.quaternion.clone(),
        },
    ].map((treeInfo) => createTree(treeInfo))
    const tweenGroup = new TweenGroup()

    const [focussedTreeIndex, setFocussedTreeIndex] = createSignal<number>(0)
    const [focussedSaplings, setFocussedSaplings] = createSignal<Sapling[]>([])

    const focussingSelfTree = () => focussedTreeIndex() === 0

    const focussedTree = () => {
        if (viewport.birdsEye) {
            return undefined
        }

        return trees[focussedTreeIndex()]
    }

    // [Tree -> Interaction] Focussed tree as root of raycaster hit
    const { interaction } = useInteraction<Sapling>({
        root: focussedTree,
        filter: () => (meshes: Object3D[]) =>
            meshes
                .filter((mesh) => mesh.userData["ignoreRaycast"] !== true)
                .filter((mesh) => mesh.name === Sapling.MESH_NAME) as Sapling[],
    })

    const selectedSapling = () =>
        Boolean(interaction.selected.current) && focussedSaplings().length === 1 ? focussedSaplings()[0]! : undefined

    // [Tree -> Controls] Itinerary required for controls to work
    const controlsItinerary = createMemo(() => {
        if (viewport.birdsEye) {
            return [
                {
                    meshes: trees.flatMap((tree) => Object.values(tree.levels).flat()),
                    quaternion: CONTROLS.QUATERNION.ELEVATION.clone(),
                    // TODO: Rename to minimum distance
                    distance: CONTROLS.VIEWING_DISTANCE.BIRDS_EYE,
                },
            ]
        }

        switch (viewport.view) {
            case ViewType.PLAN:
                return Object.values(focussedTree()!.levels).map((meshes) => ({
                    meshes,
                    quaternion: focussedTree()!.quaternion.clone().multiply(FLIP_Y_QUATERNION),
                    distance: CONTROLS.VIEWING_DISTANCE.PLAN,
                }))
            case ViewType.ELEVATION:
                return [
                    {
                        meshes: Object.values(focussedTree()!.levels).flat(),
                        quaternion: CONTROLS.QUATERNION.ELEVATION.clone(),
                        distance: CONTROLS.VIEWING_DISTANCE.ELEVATION,
                    },
                ]
        }
    })

    const controlsUpdate = (location: Sapling[]) => {
        setFocussedSaplings(location)
    }

    // [Interaction -> Tree] Hovered tree sapling should glow
    createEffect(() => {
        interaction.hovered.last?.glow(false, tweenGroup)
        interaction.hovered.current?.glow(true, tweenGroup)
    })

    // [Viewport,Interaction -> Tree] Viewport and sapling selection should update opacity
    createEffect(() => {
        // Birds Eye View
        if (!focussedTree()) {
            trees.forEach((tree) => {
                tree.blur(tweenGroup)
            })
            return
        }

        // Selection
        if (interaction.selected.current) {
            focussedTree()!.focus(tweenGroup, focussedSaplings(), 0.5)
            return
        }

        // Views
        switch (viewport.view) {
            case ViewType.PLAN: {
                if (!focussedSaplings().length) {
                    return
                    // throw new Error("Found zero focussed saplings in PLAN mode.")
                }

                const currentDepth = focussedSaplings()[0]!.userData.depth

                focussedTree()!.focus(tweenGroup, (iterDepth) => {
                    if (currentDepth === iterDepth) {
                        return 1
                    }

                    if (currentDepth < iterDepth) {
                        return 0.2
                    }

                    return 0
                })
                return
            }
            case ViewType.ELEVATION: {
                focussedTree()!.blur(tweenGroup)
                return
            }
        }
    })

    // [Tree -> Viewport] Change view to elevation when focussed tree changes
    createEffect(
        on(focussedTreeIndex, () => {
            setViewport("view", ViewType.ELEVATION)
        }),
    )

    const switchFocussedTree = () => {
        setFocussedTreeIndex((idx) => (idx + 1) % trees.length)
    }

    onMount(() => {
        addDrawDirective(TREE_OPACITY_TWEEN_RENDER_ID, (time) => {
            tweenGroup.update(time)
        })
    })

    return { focussingSelfTree, switchFocussedTree, selectedSapling, controlsItinerary, controlsUpdate }
}

export default useGameFiber
