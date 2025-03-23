import { Quaternion, Vector3 } from "three"
import { TweenTransform } from "@constants/types"

export const X_AXIS = Object.freeze(new Vector3(1, 0, 0))
export const Y_AXIS = Object.freeze(new Vector3(0, 1, 0))
export const Z_AXIS = Object.freeze(new Vector3(0, 0, 1))

// TODO: Adapt for arbitrary FsTree positioning and rotation.

export const STATICS = Object.freeze({
    DIRECTIONAL_LIGHT: {
        position: new Vector3(5, 5, 5),
    },
    SELF: {
        position: new Vector3(2, 0, 0),
        rotation: new Quaternion(0, 1, 0, 1).normalize(),
    },
    OPPONENT: {
        position: new Vector3(-2, 0, 0),
        rotation: new Quaternion(0, -1, 0, 1).normalize(),
    },
}) satisfies Record<string, Partial<TweenTransform>>
