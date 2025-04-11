import nodeFragmentShader from "@shaders/node.frag.glsl?raw"
import nodeVertexShader from "@shaders/node.vert.glsl?raw"
import { Group as TweenGroup } from "@tweenjs/tween.js"
import {
    Box3,
    BufferGeometry,
    Color,
    Line,
    LineBasicMaterial,
    Mesh,
    Group as ObjectGroup,
    ShaderMaterial,
    SphereGeometry,
    Vector3,
} from "three"
import { Z_AXIS } from "@constants/statics"

// TODO: Fixup according to client structure.
export type TreeRawData = {
    label: string
    children: TreeRawData[]
}

// TODO: Add Node as a renderable class.

const DEPTH_OFFSET = 4
const LATERAL_OFFSET = 2
const COLORS = [0x7b68ee, 0xda1d81, 0xcccccc, 0x193751] as const

export class TreeNode extends Mesh<SphereGeometry, ShaderMaterial> {
    private static NODE_GEOMETRY = new SphereGeometry(0.1, 64, 64)
    public static MESH_NAME = "TREE_NODE"

    override name = TreeNode.MESH_NAME

    constructor(color: Color) {
        const geometry = TreeNode.NODE_GEOMETRY.clone()
        const material = new ShaderMaterial({
            vertexShader: nodeVertexShader,
            fragmentShader: nodeFragmentShader,
            uniforms: {
                uBaseColor: { value: color },
                uGlowColor: { value: new Color(0xffffff) },
                uGlowIntensity: { value: 1.0 },
                uGlowFalloff: { value: 4.0 },
                uFresnelPower: { value: 2.0 },
            },
        })

        super(geometry, material)
    }

    glow(value: boolean, tweenGroup: TweenGroup) {
        this.material.uniforms.uGlowIntensity.value = value ? 1.0 : 0.0
        // Modify uniforms for glow
    }
}

export class Tree extends Mesh {
    private static CONNECTOR_MATERIALS = COLORS.map((color) => new LineBasicMaterial({ color, transparent: true }))

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

    constructor(
        private connectorLevels: Line[][] = [],
        public levels: TreeNode[][] = [],
        public levelBounds: Box3[] = [],
    ) {
        super()
    }

    private generateRenderNodes(node: TreeRawData, depth: number, colorSeed: number) {
        // TODO: Use InstancedMesh with changing instanceColor instead of new meshes
        const nodeMesh = new TreeNode(new Color(COLORS[(colorSeed + depth - 1) % COLORS.length]))

        // Add level collection
        if (this.levels.length < depth) {
            this.levels.push([])
        }
        if (this.connectorLevels.length < depth) {
            this.connectorLevels.push([])
        }

        // Add level meshes
        this.levels[depth - 1].push(nodeMesh)

        // Children meshes
        const childrenGroup = new ObjectGroup()
        const childrenMeshes = node.children.map(
            (node): ObjectGroup => this.generateRenderNodes(node, depth + 1, colorSeed),
        )

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
        const connectorGroup = new ObjectGroup()
        const connectorMaterial = Tree.CONNECTOR_MATERIALS[(colorSeed + depth - 1) % COLORS.length].clone()
        const connectorMeshes = childrenMeshes.map((node) => {
            const connectorGeometry = new BufferGeometry().setFromPoints([nodeMesh.position, node.position])
            const line = new Line(connectorGeometry, connectorMaterial)
            return line
        })
        if (connectorMeshes.length) {
            connectorGroup.add(...connectorMeshes)
        }

        // Add connector level meshes
        this.connectorLevels[depth - 1].push(...connectorMeshes)

        // Parent group
        const parent = new ObjectGroup()
        parent.add(nodeMesh, childrenGroup, connectorGroup)

        return parent
    }

    get normal() {
        return Z_AXIS.clone().applyQuaternion(this.quaternion)
    }

    get levelCount() {
        return this.levels.length
    }

    traverseLevelOrder(levelTransform: (mesh: TreeNode | Line, levelIdx: number) => void) {
        this.levels.forEach((level, idx) =>
            level.forEach((node) => {
                levelTransform(node, idx)
            }),
        )

        this.connectorLevels.forEach((level, idx) =>
            level.forEach((line) => {
                levelTransform(line, idx)
            }),
        )
    }

    recomputeBounds() {
        this.levelBounds = this.levels.map((level) => {
            const boundingBox = new Box3()

            const meshCenters = level.map((mesh) => {
                const worldPosition = new Vector3()
                mesh.getWorldPosition(worldPosition)
                return worldPosition
            })

            boundingBox.setFromPoints(meshCenters)

            return boundingBox
        })
    }

    setFromRawData(data: TreeRawData, colorSeed = 0) {
        this.add(this.generateRenderNodes(data, 1, colorSeed))
        this.recomputeBounds()
        return this
    }
}
