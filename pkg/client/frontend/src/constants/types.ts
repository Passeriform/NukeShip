import { Quaternion, Vector3 } from "three"
import { CONTENT } from "./content"

export const FocusType = {
    SELF: "SELF",
    OPPONENT: "OPPONENT",
} as const

export type FocusType = (typeof FocusType)[keyof typeof FocusType]

export const ViewType = {
    PLAN: "PLAN",
    ELEVATION: "ELEVATION",
} as const

export type ViewType = (typeof ViewType)[keyof typeof ViewType]

export type TweenTransform = {
    position: Vector3
    quaternion: Quaternion
}

export const PlacementPosition = {
    LEFT: "LEFT",
    RIGHT: "RIGHT",
} as const

export type PlacementPosition = (typeof PlacementPosition)[keyof typeof PlacementPosition]

export const AttackType = {
    TARGET: "TARGET",
    BLENDED: "BLENDED",
} as const satisfies {
    [K in keyof typeof CONTENT.ATTACKS]: K
}

export type AttackType = (typeof AttackType)[keyof typeof AttackType]
