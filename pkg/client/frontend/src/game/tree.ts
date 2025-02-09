import {
    Box3,
    BufferGeometry,
    Group,
    Line,
    LineBasicMaterial,
    Mesh,
    MeshLambertMaterial,
    Object3D,
    Plane,
    SphereGeometry,
    Vector3,
} from "three"

export type PlaneDescriptor = {
    center: Vector3
    normal: Vector3
}

// TODO: Fixup according to client structure.
export type TreeRawData = {
    label: string
    children: TreeRawData[]
}

// TODO: Add Node as a renderable class.

const DEPTH_OFFSET = 4
const LATERAL_OFFSET = 2
const COLORS = [0x7b68ee, 0xda1d81, 0xcccccc, 0x193751] as const

export class Tree extends Object3D {
    private static NODE_MATERIALS = COLORS.map((color) => new MeshLambertMaterial({ color, transparent: true }))
    private static CONNECTOR_MATERIALS = COLORS.map((color) => new LineBasicMaterial({ color, transparent: true }))

    private levels: Mesh[][]
    public planes: PlaneDescriptor[]

    private static splitChildrenEvenly(itemCount: number) {
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

    constructor() {
        super()
        this.levels = []
        this.planes = []
    }

    private generateRenderNodes = (node: TreeRawData, depth: number, colorSeed: number) => {
        // Node mesh
        const nodeGeometry = new SphereGeometry(0.1, 64, 64)
        // const nodeGeometry = new BoxGeometry(2 / depth, 2 / depth, 2 / depth)
        const nodeMesh = new Mesh(nodeGeometry, Tree.NODE_MATERIALS[(colorSeed + depth - 1) % COLORS.length])

        // Add levels
        if (this.levels.length < depth) {
            this.levels.push([])
        }
        this.levels[depth - 1].push(nodeMesh)

        // Children meshes
        const childrenGroup = new Group()
        const childrenMeshes = node.children.map((node): Group => this.generateRenderNodes(node, depth + 1, colorSeed))

        if (childrenMeshes.length) {
            const positions = Tree.splitChildrenEvenly(childrenMeshes.length)
            childrenMeshes.forEach((node, idx) =>
                node.position.set(
                    (positions[idx][0] * LATERAL_OFFSET) / depth,
                    (positions[idx][1] * LATERAL_OFFSET) / depth,
                    DEPTH_OFFSET / depth,
                ),
            )
            childrenGroup.add(...childrenMeshes)
        }

        // Connector meshes
        const connectorGroup = new Group()
        const connectorMeshes = childrenMeshes.map((node) => {
            const connectorGeometry = new BufferGeometry().setFromPoints([nodeMesh.position, node.position])
            const line = new Line(connectorGeometry, Tree.CONNECTOR_MATERIALS[(colorSeed + depth - 1) % COLORS.length])
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

    getWorldPosition() {
        const pos = new Vector3()
        super.getWorldPosition(pos)
        return pos
    }

    get midpoint() {
        return new Vector3().addVectors(this.planes[0].center, this.planes.at(-1)!.center).divideScalar(2)
    }

    recomputePlanes() {
        const boundingBox = new Box3()
        const worldPosition = new Vector3()
        const plane = new Plane()
        this.planes = this.levels.map((level) => {
            const positions = level.map((mesh) => {
                mesh.getWorldPosition(worldPosition)
                return worldPosition.clone()
            })

            const center = new Vector3()
            boundingBox.setFromPoints(positions).getCenter(center)

            let normal = new Vector3(0, 0, 1).applyQuaternion(this.quaternion)

            if (positions.length >= 3) {
                plane.setFromCoplanarPoints(positions[0], positions[1], positions[2])
                normal = plane.normal.negate().clone()
            }

            return { center, normal }
        })
    }

    setFromRawData(data: TreeRawData, colorSeed = 0) {
        this.add(this.generateRenderNodes(data, 1, colorSeed))
        this.recomputePlanes()
        return this
    }
}
