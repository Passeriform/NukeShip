import { Quaternion, Vector3 } from "three"
import { TweenTransform } from "@constants/types"

export const X_AXIS = Object.freeze(new Vector3(1, 0, 0))
export const Y_AXIS = Object.freeze(new Vector3(0, 1, 0))
export const Z_AXIS = Object.freeze(new Vector3(0, 0, 1))

export const FLIP_Y_QUATERNION = Object.freeze(new Quaternion().setFromAxisAngle(Y_AXIS, Math.PI))

export const OBJECTS = {
    DIRECTIONAL_LIGHT: {
        position: Object.freeze(new Vector3(5, 5, 5)),
    },
    SELF: {
        position: Object.freeze(new Vector3(-10, 0, 0)),
        quaternion: Object.freeze(new Quaternion(0, -1, 0, 1).normalize()),
    },
    OPPONENT: {
        position: Object.freeze(new Vector3(10, 0, 0)),
        quaternion: Object.freeze(new Quaternion(0, 1, 0, 1).normalize()),
    },
} satisfies Record<string, Partial<TweenTransform>>

export const CONTROLS = {
    VIEWING_DISTANCE: {
        BIRDS_EYE: 10,
        ELEVATION: 4,
        PLAN: 2,
        SELECTION: 1,
    },
    QUATERNION: {
        ELEVATION: Object.freeze(new Quaternion(0, 0, 0, 1).normalize()),
        PLAN: Object.freeze(new Quaternion(0, 1, 0, 1).normalize()),
    },
}
