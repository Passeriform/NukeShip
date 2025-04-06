import { Quaternion, Vector3 } from "three"
import { TweenTransform } from "@constants/types"

export const X_AXIS = Object.freeze(new Vector3(1, 0, 0))
export const Y_AXIS = Object.freeze(new Vector3(0, 1, 0))
export const Z_AXIS = Object.freeze(new Vector3(0, 0, 1))

export const ELEVATION_FORWARD_QUATERNION = Object.freeze(new Quaternion(0, 0, 0, 1).normalize())

export const STATICS = {
    DIRECTIONAL_LIGHT: {
        position: Object.freeze(new Vector3(5, 5, 5)),
    },
    SELF: {
        position: Object.freeze(new Vector3(2, 0, 0)),
        rotation: Object.freeze(new Quaternion(0, 1, 0, 1).normalize()),
    },
    OPPONENT: {
        position: Object.freeze(new Vector3(-2, 0, 0)),
        rotation: Object.freeze(new Quaternion(0, -1, 0, 1).normalize()),
    },
} satisfies Record<string, Partial<TweenTransform>>
