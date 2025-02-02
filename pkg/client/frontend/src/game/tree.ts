import {
    BufferGeometry,
    Group,
    Line,
    LineBasicMaterial,
    Mesh,
    MeshLambertMaterial,
    Object3D,
    SphereGeometry,
} from "three"

export const CHILDREN_GROUP_NAME = "children"
export const CONNECTOR_GROUP_NAME = "connectors"

const DEPTH_OFFSET = 4
const LATERAL_OFFSET = 2
const COLORS = [0x7b68ee, 0xda1d81, 0xcccccc, 0x193751] as const
const NODE_GEOMETRY = new SphereGeometry(0.1, 64, 64)
const NODE_MESHES = COLORS.map((color) => new MeshLambertMaterial({ color })).map(
    (material) => new Mesh(NODE_GEOMETRY, material),
)
const CONNECTOR_MATERIALS = COLORS.map((color) => new LineBasicMaterial({ color }))

export type FSNode = {
    label: string
    children: FSNode[]
}

const splitChildrenEvenly = (itemCount: number) => {
    if (itemCount === 1) {
        return [[0, 0]] as const
    } else if (itemCount === 2) {
        return [
            [-1, -1],
            [1, 1],
        ] as const
    } else if (itemCount <= 4) {
        return [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
        ] as const
    } else if (itemCount <= 9) {
        return [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
            [-1, 0],
            [0, -1],
            [0, 1],
            [1, 0],
            [0, 0],
        ] as const
    } else {
        return [[0, 0]] as const
    }
}

const updateChildrenWorldPositions = (children: Object3D[], depth: number) => {
    const positions = splitChildrenEvenly(children.length)

    children.forEach((node, idx) =>
        node.position.set(
            (positions[idx][0] * LATERAL_OFFSET) / depth,
            (positions[idx][1] * LATERAL_OFFSET) / depth,
            DEPTH_OFFSET / depth,
        ),
    )
}

export const generateObjectTree = (node: FSNode, depth = 1, colorSeed = 0) => {
    // Node mesh
    const nodeMesh = NODE_MESHES[(colorSeed + depth - 1) % COLORS.length].clone()

    // Children meshes
    const childrenGroup = new Group()
    childrenGroup.name = CHILDREN_GROUP_NAME
    const childrenMeshes = node.children.map((node): Group => generateObjectTree(node, depth + 1, colorSeed))

    if (childrenMeshes.length) {
        updateChildrenWorldPositions(childrenMeshes, depth)
        childrenGroup.add(...childrenMeshes)
    }

    // Connector meshes
    const connectorGroup = new Group()
    connectorGroup.name = CONNECTOR_GROUP_NAME
    const connectorMeshes = childrenMeshes.map((node) => {
        const connectorGeometry = new BufferGeometry().setFromPoints([nodeMesh.position, node.position])
        const line = new Line(connectorGeometry, CONNECTOR_MATERIALS[(colorSeed + depth - 1) % COLORS.length])
        return line
    })
    if (connectorMeshes.length) {
        connectorGroup.add(...connectorMeshes)
    }

    // Parent group
    const parent = new Group()
    parent.add(nodeMesh, childrenGroup, connectorGroup)

    return parent
}
