import { Easing, Tween, Group as TweenGroup } from "@tweenjs/tween.js"
import {
    BufferGeometry,
    Line,
    LineBasicMaterial,
    Material,
    Mesh,
    MeshLambertMaterial,
    SphereGeometry,
    Vector3,
    Vector3Tuple,
} from "three"
import { boundsFromMeshGeometries } from "@utility/bounds"

// TODO: Fixup according to client structure.
export type RawDataStream = SaplingMetadata & {
    children: RawDataStream[]
}

const NODE_RADIUS = 0.1
const BASE_APOTHEM_RADIUS = 8
const DEPTH_OFFSET = 4
const COLORS = [0x7b68ee, 0xda1d81, 0xcccccc, 0x193751] as const

// TODO: Build the positions bottom-up instead, so that nodes and connectors don't overlap.

const getPositions = (childCount: number, depth: number) => {
    if (childCount === 1) {
        return [[0, 0, DEPTH_OFFSET / depth] as Vector3Tuple]
    }

    const radius = BASE_APOTHEM_RADIUS / Math.pow(1.5, depth)
    const angle = (2 * Math.PI) / childCount
    const offset = -Math.PI / 4

    return new Array(childCount).fill(0).map((_, idx) => {
        const unitX = (radius * Math.cos(offset + angle * idx)) / (1 + Math.sin(angle / 2))
        const unitY = (radius * Math.sin(offset + angle * idx)) / (1 + Math.sin(angle / 2))
        const unitZ = DEPTH_OFFSET / depth

        return [unitX, unitY, unitZ] as Vector3Tuple
    })
}

type SaplingCtorOptions = Partial<{
    depth: number
    colorSeed: number
    position: Vector3Tuple
    collector: Sapling[][]
}>

type AddChildSaplingOptions = Required<Pick<SaplingCtorOptions, "depth" | "colorSeed">> & {
    withConnectors?: boolean
    collector?: Sapling[][]
}

export type SaplingMetadata = {
    label: string
    sentinel: boolean
    power: number
    shield: number
    rechargeRate: number
}

type SaplingInternalData = {
    root: boolean
    depth: number
    ignoreRaycast: boolean
}

class Sapling extends Mesh {
    declare userData: SaplingMetadata & SaplingInternalData

    private static NODE_GEOMETRY = new SphereGeometry(NODE_RADIUS, 64, 64)
    private static NODE_MATERIALS = COLORS.map(
        (color) => new MeshLambertMaterial({ color, emissiveIntensity: 20, transparent: true }),
    )
    private static CONNECTOR_MATERIALS = COLORS.map((color) => new LineBasicMaterial({ color, transparent: true }))
    public static MESH_NAME = "TREE_NODE" as const

    public connectors: Line[] = []

    private populateChildSaplings(
        root: RawDataStream,
        { depth, colorSeed, withConnectors = false, collector = [] }: AddChildSaplingOptions,
    ) {
        if (!root.children.length) {
            return
        }

        const childPositions = getPositions(root.children.length, depth)

        if (withConnectors) {
            const connectorMaterial = Sapling.CONNECTOR_MATERIALS.at(colorSeed)?.clone()

            this.connectors = childPositions.map((end) => {
                const connectorGeometry = new BufferGeometry().setFromPoints([new Vector3(), new Vector3(...end)])
                return new Line(connectorGeometry, connectorMaterial)
            })

            this.add(...this.connectors)
        }

        const subSaplings = root.children.map(
            (child, idx) =>
                new Sapling(child, {
                    colorSeed: (colorSeed + 1) % COLORS.length,
                    depth: depth + 1,
                    position: childPositions[idx]!,
                    collector,
                }),
        )

        this.add(...subSaplings)
    }

    constructor(
        root: RawDataStream,
        { depth = 1, colorSeed = 0, position = [0, 0, 0], collector = [] }: SaplingCtorOptions,
    ) {
        super(Sapling.NODE_GEOMETRY, Sapling.NODE_MATERIALS.at(colorSeed % COLORS.length)?.clone())

        this.name = Sapling.MESH_NAME
        this.position.fromArray(position)
        this.userData["label"] = root.label
        this.userData["power"] = root.power
        this.userData["shield"] = root.shield
        this.userData["rechargeRate"] = root.rechargeRate
        this.userData["sentinel"] = root.sentinel
        this.userData["depth"] = depth

        if (collector.length < depth) {
            collector?.push([this])
        } else {
            collector[depth - 1]!.push(this)
        }

        if (!root.children.length) {
            return
        }

        this.populateChildSaplings(root, { depth, colorSeed, withConnectors: true, collector })
    }

    glow(_value: boolean, _tweenGroup: TweenGroup) {}

    setOpacity(group: TweenGroup, to: number) {
        ;[this.material, ...this.connectors.map((line) => line.material)]
            .map((material) => material as Material)
            .forEach((material) =>
                group.add(
                    new Tween({ opacity: (this.material as Material).opacity })
                        .to({ opacity: to }, 400)
                        .easing(Easing.Cubic.InOut)
                        .onStart(() => {
                            if (to !== 0) {
                                this.userData["ignoreRaycast"] = false
                            }
                        })
                        .onUpdate(({ opacity }) => {
                            material.opacity = opacity
                        })
                        .onComplete(() => {
                            if (to === 0) {
                                this.userData["ignoreRaycast"] = true
                            }
                        })
                        .start(),
                ),
            )
    }
}

export class Tree extends Sapling {
    private positionCollection: Sapling[][] = []

    constructor(root: RawDataStream, colorSeed = 0) {
        const positionCollection: Sapling[][] = []

        super(root, { colorSeed, collector: positionCollection })

        this.userData["root"] = true

        this.positionCollection = positionCollection
    }

    get levelBounds() {
        return this.positionCollection.map((level) => boundsFromMeshGeometries(...level))
    }

    get levels() {
        return this.positionCollection.length
    }

    resetOpacity(tweenGroup: TweenGroup) {
        this.traverse((child) => {
            if (child.name !== Sapling.MESH_NAME || !child.userData["depth"]) {
                return
            }

            ;(child as Sapling).setOpacity(tweenGroup, 1)
        })
    }
}

export default Tree
