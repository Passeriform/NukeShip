import { Quaternion, Vector3 } from "three"

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
    rotation: Quaternion
}

export const AttackType = {
    PIPELINE: "PIPELINE",
    DIRECT: "DIRECT",
} as const

export type AttackType = (typeof AttackType)[keyof typeof AttackType]

export type RecursiveRecord<P extends PropertyKey, T> = {
    [K in P]: T | RecursiveRecord<P, T>
}
