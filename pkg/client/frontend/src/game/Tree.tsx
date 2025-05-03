import { For, IntersectionEvent, Show, VoidComponent, createEffect, createSignal, mergeProps } from "solid-three"
import { Mesh, Object3D, QuaternionTuple, Vector3Tuple } from "three"

const COLORS = [0x7b68ee, 0xda1d81, 0xcccccc, 0x193751] as const

// TODO: Fixup according to client structure.
export type RawDataStream = {
    label: string
    children: RawDataStream[]
}

export type TreeProps = {
    dataStream: RawDataStream
    colorSeed?: number
    position?: Vector3Tuple
    rotation?: QuaternionTuple
    ref?: Object3D | ((instance: Object3D) => void)
    getNodeMeshesRef?: () => Mesh[][]
    getNodePositionsRef?: () => Vector3Tuple[][]
    onClick?: (event: IntersectionEvent<MouseEvent>) => void
    onPointerOver?: (event: IntersectionEvent<MouseEvent>) => void
    onPointerOut?: (event: IntersectionEvent<MouseEvent>) => void
    onPointerMissed?: (event: MouseEvent) => void
}

type SaplingProps = {
    root: RawDataStream
    depth: number
    colorSeed?: number
    position?: Vector3Tuple
    quaternion?: QuaternionTuple
    setLevelNodeMeshes?: (level: number, idx: number, mesh: Mesh) => void
    setLevelNodePositions?: (level: number, positions: Vector3Tuple[]) => void
    onClick?: (event: IntersectionEvent<MouseEvent>) => void
    onPointerOver?: (event: IntersectionEvent<MouseEvent>) => void
    onPointerOut?: (event: IntersectionEvent<MouseEvent>) => void
    onPointerMissed?: (event: MouseEvent) => void
}

const DEPTH_OFFSET = 4
const LATERAL_OFFSET = 2

const getColor = (seed: number) => {
    const color = COLORS[seed % COLORS.length]!
    return color
}

const getPositions = (childCount: number, radius: number, depthModifier: number) => {
    const angle = (2 * Math.PI) / childCount

    return new Array(childCount).fill(0).map((_, idx) => {
        const unitX = radius * Math.cos(angle * idx)
        const unitY = radius * Math.sin(angle * idx)

        const x = (unitX * LATERAL_OFFSET) / depthModifier
        const y = (unitY * LATERAL_OFFSET) / depthModifier
        const z = DEPTH_OFFSET / depthModifier

        return [x, y, z] as Vector3Tuple
    })
}

const Sapling: VoidComponent<SaplingProps> = (_props) => {
    const props = mergeProps(
        {
            colorSeed: 0,
            position: [0, 0, 0] as Vector3Tuple,
            rotation: [0, 0, 0, 1] as QuaternionTuple,
        },
        _props,
    ) as Required<SaplingProps>

    let nodeMeshRef: Mesh

    const childPositions = getPositions(props.root.children.length, 1, props.depth)

    createEffect(() => {
        if (!nodeMeshRef!) {
            return
        }
        props.setLevelNodeMeshes?.(props.depth - 1, 0, nodeMeshRef)
    })

    createEffect(() => {
        props.setLevelNodePositions?.(props.depth, childPositions)
    })

    return (
        <>
            <mesh
                name="TREE_NODE"
                position={props.position}
                scale={0.1}
                onClick={props.onClick}
                onPointerOver={props.onPointerOver}
                onPointerOut={props.onPointerOut}
                onPointerMissed={props.onPointerMissed}
                ref={nodeMeshRef! as any}
            >
                <sphereGeometry />
                <meshLambertMaterial color={getColor(props.colorSeed)} emissiveIntensity={20} transparent={true} />
            </mesh>
            <group>
                <For each={props.root.children}>
                    {(child, idx) => (
                        <Sapling
                            colorSeed={props.colorSeed + 1}
                            root={child}
                            position={childPositions[idx()]!}
                            depth={props.depth + 1}
                            setLevelNodePositions={props.setLevelNodePositions}
                        />
                    )}
                </For>
            </group>
            <group>
                <Show when={props.root.children.length}>
                    <For each={props.root.children}>
                        {(_, idx) => (
                            <line3
                                start={props.position}
                                end={childPositions[idx()]!}
                                color={getColor(props.colorSeed)}
                            />
                        )}
                    </For>
                </Show>
            </group>
        </>
    )
}

// TODO: Convert to an explicit intrinsic element returning a primitive. Apply other options on top of primitive
const Tree: VoidComponent<TreeProps> = (_props) => {
    const props = mergeProps(
        {
            colorSeed: 0,
            position: [0, 0, 0] as Vector3Tuple,
            rotation: [0, 0, 0, 1] as QuaternionTuple,
        },
        _props,
    ) as Required<TreeProps>

    const [nodeMeshes, setNodeMeshes] = createSignal<Mesh[][]>([])
    const [nodePositions, setNodePositions] = createSignal<Vector3Tuple[][]>([])

    props.getNodeMeshesRef = nodeMeshes
    props.getNodePositionsRef = nodePositions

    const setLevelNodeMeshes = (level: number, idx: number, nodeMesh: Mesh) => {
        setNodeMeshes((prev) => {
            if (!prev[level]) {
                prev[level] = []
            }
            prev[level][idx] = nodeMesh
            return [...prev]
        })
    }

    const setLevelNodePositions = (level: number, nodePositions: Vector3Tuple[]) => {
        setNodePositions((prev) => {
            prev[level] = nodePositions
            return [...prev]
        })
    }

    createEffect(() => {
        setLevelNodePositions(0, [props.position])
    })

    return (
        <mesh position={props.position} quaternion={props.rotation} ref={props.ref as any}>
            <Sapling
                root={props.dataStream}
                colorSeed={props.colorSeed}
                depth={1}
                setLevelNodeMeshes={setLevelNodeMeshes}
                setLevelNodePositions={setLevelNodePositions}
                onClick={props.onClick}
                onPointerOver={props.onPointerOver}
                onPointerOut={props.onPointerOut}
                onPointerMissed={props.onPointerMissed}
            />
        </mesh>
    )
}

export default Tree
