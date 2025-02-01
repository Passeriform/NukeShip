import * as three from "three"
import { FOCUS_TYPE, PositionRotationData, VIEW_TYPE } from "@constants/types"

const Y_AXIS = new three.Vector3(0, 1, 0)

// TODO: Adapt for arbitrary FsTree positioning and rotation.

export const STATICS = {
    DIRECTIONAL_LIGHT: {
        position: new three.Vector3(5, 5, 5),
    },
    SELF: {
        position: new three.Vector3(2, 0, 0),
        rotation: new three.Quaternion(0, 1, 0, 1).normalize(),
    },
    OPPONENT: {
        position: new three.Vector3(-2, 0, 0),
        rotation: new three.Quaternion(0, -1, 0, 1).normalize(),
    },
} satisfies Record<string, Partial<PositionRotationData>>

// TODO: Get below values dynamically from tree positioning and rotations.
const NONE_FOCUS = {
    ELEVATION: {
        position: new three.Vector3(0, 0, -12),
        rotation: new three.Quaternion(0, 1, 0, 0).normalize(),
    },
    PLAN: {
        position: new three.Vector3(0, 0, -12),
        rotation: new three.Quaternion(0, 1, 0, 0).normalize(),
    },
} satisfies Record<VIEW_TYPE, PositionRotationData>

const SELF_FOCUS = {
    ELEVATION: {
        position: STATICS.SELF.position.clone().add(new three.Vector3(6, 0, -12)),
        rotation: STATICS.SELF.rotation.clone().setFromAxisAngle(Y_AXIS, Math.PI),
    },
    PLAN: {
        position: STATICS.SELF.position.clone().add(new three.Vector3(-4, 0, 0)),
        rotation: STATICS.SELF.rotation.clone().invert(),
    },
} satisfies Record<VIEW_TYPE, PositionRotationData>

const OPPONENT_FOCUS = {
    ELEVATION: {
        position: STATICS.OPPONENT.position.clone().add(new three.Vector3(-6, 0, -12)),
        rotation: STATICS.OPPONENT.rotation.clone().setFromAxisAngle(Y_AXIS, Math.PI),
    },
    PLAN: {
        position: STATICS.OPPONENT.position.clone().add(new three.Vector3(4, 0, 0)),
        rotation: STATICS.OPPONENT.rotation.clone().invert(),
    },
} satisfies Record<VIEW_TYPE, PositionRotationData>

export const FOCUS_STATICS = {
    NONE: NONE_FOCUS,
    SELF: SELF_FOCUS,
    OPPONENT: OPPONENT_FOCUS,
} satisfies Record<FOCUS_TYPE, Record<VIEW_TYPE, PositionRotationData>>
