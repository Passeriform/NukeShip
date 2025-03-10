import { Quaternion, Vector3 } from "three"
import { TweenTransform } from "@constants/types"

export const Y_AXIS = new Vector3(0, 1, 0)
export const PLAN_CAMERA_NODE_DISTANCE = 4

// TODO: Adapt for arbitrary FsTree positioning and rotation.

export const STATICS = {
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
} satisfies Record<string, Partial<TweenTransform>>
