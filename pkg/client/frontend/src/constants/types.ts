import * as three from "three"

export const FOCUS_TYPE = {
    NONE: "NONE",
    SELF: "SELF",
    OPPONENT: "OPPONENT",
} as const

export type FOCUS_TYPE = (typeof FOCUS_TYPE)[keyof typeof FOCUS_TYPE]

export const VIEW_TYPE = {
    PLAN: "PLAN",
    ELEVATION: "ELEVATION",
} as const

export type VIEW_TYPE = (typeof VIEW_TYPE)[keyof typeof VIEW_TYPE]

export type PositionRotationData = {
    position: three.Vector3
    rotation: three.Quaternion
}
