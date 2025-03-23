import { Quaternion, Vector3 } from "three"

export const FocusType = {
    NONE: "NONE",
    SELF: "SELF",
    OPPONENT: "OPPONENT",
} as const

export type FocusType = (typeof FocusType)[keyof typeof FocusType]

export type TweenTransform = {
    position: Vector3
    rotation: Quaternion
}
