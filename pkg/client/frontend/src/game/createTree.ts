import { onCleanup, onMount } from "solid-js"
import { Quaternion, Vector3 } from "three"
import Tree, { RawDataStream } from "@game/tree"
import { useScene } from "@providers/Scene"

type CreateTreeProps = {
    source: RawDataStream
    colorSeed: number
    position: Vector3
    quaternion: Quaternion
}

const createTree = (props: CreateTreeProps) => {
    const { addToScene } = useScene()

    // eslint-disable-next-line solid/reactivity -- Only used for one-time initialization in hook.
    const tree = new Tree(props.source, props.colorSeed)

    onMount(() => {
        tree.position.copy(props.position)
        tree.quaternion.copy(props.quaternion)
        addToScene(tree)
    })

    onCleanup(() => {
        tree.clear()
    })

    return tree
}

export default createTree
