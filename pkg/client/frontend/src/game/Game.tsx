import { TourControlsDrillEvent } from "@passeriform/three-tour-controls"
import { Group as TweenGroup } from "@tweenjs/tween.js"
import { VoidComponent, createEffect, extend, useFrame } from "solid-three"
import { Mesh, Object3D, Quaternion, QuaternionTuple, Vector3Tuple } from "three"
import { ExampleFS } from "@constants/sample"
import { FocusType, ViewType } from "@constants/types"
import { boundsFromObjects, boundsFromPoints } from "@utility/bounds"
import { tweenOpacity } from "@utility/tween"
import TourControls from "./TourControls"
import Tree from "./Tree"

const AMBIENT_LIGHT_COLOR = 0x193751
const AMBIENT_LIGHT_INTENSITY = 2
const DIRECTIONAL_LIGHT_COLOR = 0xffffff
const DIRECTIONAL_LIGHT_INTENSITY = 2
const DIRECTIONAL_LIGHT_POSITION = [5, 5, 5] as Vector3Tuple
const SELF_TREE_POSITION = [2, 0, 0] as Vector3Tuple
const SELF_TREE_ROTATION = [0, 1, 0, 1] as QuaternionTuple
const OPPONENT_TREE_POSITION = [-2, 0, 0] as Vector3Tuple
const OPPONENT_TREE_ROTATION = [0, -1, 0, 1] as QuaternionTuple
const ARCH_CONTROLS_ELEVATION_FORWARD_ROTATION = [0, 0, 0, 1] as QuaternionTuple
const ARCH_CONTROLS_OFFSET = {
    [ViewType.ELEVATION]: 4,
    [ViewType.PLAN]: 2,
}
const TARGET_CONTROLS_OFFSET = 1
const PLAN_MATCH_OPACITY_MAP: Record<number, number> = {
    [-1]: 0.2,
    [1]: 0,
    [0]: 1,
}

extend({ TourControls })

type GameProps = {
    view: ViewType
    focus: FocusType
    tweenGroup: TweenGroup
}

const Game: VoidComponent<GameProps> = (props) => {
    let selfTree: Object3D
    let opponentTree: Object3D
    let pushTarget: (target: Object3D) => void
    let getSelfTreeNodeMeshes: () => Mesh[][]
    let getSelfTreeNodePositions: () => Vector3Tuple[][]
    let getOpponentTreeNodeMeshes: () => Mesh[][]
    let getOpponentTreeNodePositions: () => Vector3Tuple[][]

    const getFocussedTree = () => {
        if (!selfTree! || !opponentTree!) {
            return undefined
        }

        return (
            (props.focus === FocusType.SELF && selfTree!) ||
            (props.focus === FocusType.OPPONENT && opponentTree!) ||
            undefined
        )
    }

    const getFocussedTreeNodeMeshes = () => {
        if (!getSelfTreeNodeMeshes! || !getOpponentTreeNodeMeshes!) {
            return undefined
        }

        return (
            (props.focus === FocusType.SELF && getSelfTreeNodeMeshes!()) ||
            (props.focus === FocusType.OPPONENT && getOpponentTreeNodeMeshes!()) ||
            undefined
        )
    }

    const getFocussedTreeNodePositions = () => {
        if (!getSelfTreeNodePositions! || !getOpponentTreeNodePositions!) {
            return undefined
        }

        return (
            (props.focus === FocusType.SELF && getSelfTreeNodePositions!()) ||
            (props.focus === FocusType.OPPONENT && getOpponentTreeNodePositions!()) ||
            undefined
        )
    }

    const getInteractables = () => {
        const focusedTree = getFocussedTree()
        return focusedTree ? [focusedTree] : []
    }

    const getBoundPoses = () => {
        if (!selfTree! || !opponentTree! || !getSelfTreeNodeMeshes! || !getOpponentTreeNodeMeshes!) {
            return
        }

        const focusedTree = getFocussedTree()

        if (!focusedTree) {
            return [
                {
                    bounds: boundsFromObjects(selfTree, opponentTree),
                    quaternion: new Quaternion(...ARCH_CONTROLS_ELEVATION_FORWARD_ROTATION),
                },
            ]
        }

        const targetTreeNodePositions = getFocussedTreeNodePositions()

        if (!targetTreeNodePositions) {
            return
        }

        return props.view === ViewType.ELEVATION
            ? [
                  {
                      bounds: boundsFromObjects(focusedTree),
                      quaternion: new Quaternion(...ARCH_CONTROLS_ELEVATION_FORWARD_ROTATION),
                  },
              ]
            : targetTreeNodePositions.map((level) => ({
                  bounds: boundsFromPoints(...level),
                  quaternion: focusedTree.quaternion.clone(),
              }))
    }

    const resetOpacities = () => {
        if (!getSelfTreeNodeMeshes! || !getOpponentTreeNodeMeshes!) {
            return
        }

        getSelfTreeNodeMeshes().forEach((level) => level.forEach((mesh) => tweenOpacity(props.tweenGroup, mesh, 1)))
        getOpponentTreeNodeMeshes().forEach((level) => level.forEach((mesh) => tweenOpacity(props.tweenGroup, mesh, 1)))
    }

    useFrame(() => {
        props.tweenGroup.update()
    }, -1)

    createEffect(() => {
        if (props.focus === FocusType.NONE) {
            resetOpacities()
            return
        }

        if (props.view === ViewType.ELEVATION) {
            resetOpacities()
            return
        }
    })

    return (
        <>
            <ambientLight color={AMBIENT_LIGHT_COLOR} intensity={AMBIENT_LIGHT_INTENSITY} />
            <directionalLight
                color={DIRECTIONAL_LIGHT_COLOR}
                intensity={DIRECTIONAL_LIGHT_INTENSITY}
                position={DIRECTIONAL_LIGHT_POSITION}
            />
            <tourControls
                cameraOffset={ARCH_CONTROLS_OFFSET[props.focus === FocusType.NONE ? ViewType.ELEVATION : props.view]}
                boundPoses={getBoundPoses() ?? []}
                onDrill={(event: TourControlsDrillEvent) =>
                    getFocussedTreeNodeMeshes()?.forEach((level, levelIdx) =>
                        level.forEach((mesh) =>
                            tweenOpacity(
                                props.tweenGroup,
                                mesh,
                                event.historyIdx === -1
                                    ? 1
                                    : PLAN_MATCH_OPACITY_MAP[Math.sign(event.historyIdx - levelIdx)]!,
                            ),
                        ),
                    )
                }
            />
            {/* <TargetControls
                cameraOffset={TARGET_CONTROLS_OFFSET}
                enabled={props.focus !== FocusType.NONE}
                interactables={getInteractables()}
                pushTargetRef={pushTarget!}
                onSelect={(event) => {
                    resetOpacities()
                    tweenOpacity(event.tweenGroup, event.intersect as any, 1)
                }}
            /> */}
            <Tree
                dataStream={ExampleFS}
                colorSeed={1}
                position={SELF_TREE_POSITION}
                rotation={SELF_TREE_ROTATION}
                ref={selfTree!}
                getNodeMeshesRef={getSelfTreeNodeMeshes!}
                getNodePositionsRef={getSelfTreeNodePositions!}
                onClick={(event) => props.focus === FocusType.SELF && pushTarget!(event.object as any)}
                onPointerOver={() => undefined}
                onPointerOut={() => undefined}
                onPointerMissed={() => undefined}
            />
            <Tree
                dataStream={ExampleFS}
                colorSeed={2}
                position={OPPONENT_TREE_POSITION}
                rotation={OPPONENT_TREE_ROTATION}
                ref={opponentTree!}
                getNodeMeshesRef={getOpponentTreeNodeMeshes!}
                getNodePositionsRef={getOpponentTreeNodePositions!}
                onClick={(event) => props.focus === FocusType.OPPONENT && pushTarget!(event.object as any)}
                onPointerOver={() => undefined}
                onPointerOut={() => undefined}
                onPointerMissed={() => undefined}
            />
        </>
    )
}

export default Game
