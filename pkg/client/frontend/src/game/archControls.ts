import { Group as TweenGroup } from "@tweenjs/tween.js"
import {
    BaseEvent,
    Box3,
    Controls,
    MathUtils,
    Object3D,
    OrthographicCamera,
    PerspectiveCamera,
    Quaternion,
} from "three"
import { Z_AXIS } from "@constants/statics"
import { TweenTransform } from "@constants/types"
import { unpackBounds } from "./bounds"
import { isOrthographicCamera, isPerspectiveCamera, lookAtFromQuaternion } from "./camera"
import { tweenTransform } from "./tween"

// TODO: Animate camera position along a pivot arc when rotating, instead of linear path.
// TODO: Add rotation to FSTree on panning.
// TODO: Add common history between arch and target controls.

export const ViewType = {
    PLAN: "PLAN",
    ELEVATION: "ELEVATION",
} as const

export type ViewType = (typeof ViewType)[keyof typeof ViewType]

const FIT_OFFSET = {
    [ViewType.ELEVATION]: 4,
    [ViewType.PLAN]: 2,
}

type ArchControlsEventMap = {
    drill: {
        targets: Object3D[]
        historyIdx: number
        tweenGroup: TweenGroup
    }
    drillStart: {
        targets: Object3D[]
        tweenGroup: TweenGroup
    }
    drillEnd: {
        targets: Object3D[]
        tweenGroup: TweenGroup
    }
}

export type DrillEvent = BaseEvent<"drill"> & ArchControlsEventMap["drill"]
export type DrillStartEvent = BaseEvent<"drillStart"> & ArchControlsEventMap["drillStart"]
export type DrillEndEvent = BaseEvent<"drillEnd"> & ArchControlsEventMap["drillEnd"]

export class ArchControls extends Controls<ArchControlsEventMap> {
    private poses: [Box3[], Quaternion]
    private tweenGroup: TweenGroup
    private transitioning: boolean
    private history: TweenTransform[]
    private historyIdx: number

    private animate(tweenTarget: TweenTransform) {
        if (!this.enabled) {
            return
        }

        if (this.viewType === ViewType.PLAN) {
            this.dispatchEvent({
                type: "drill",
                targets: this.targets,
                historyIdx: this.historyIdx,
                tweenGroup: this.tweenGroup,
            })
        }

        this.transitioning = true
        tweenTransform(this.tweenGroup, this.object, tweenTarget, () => (this.transitioning = false))
    }

    private updateToFitScreen() {
        this.history = this.poses[0].map((pose) => {
            const [poseCenter, poseSize] = unpackBounds(pose)

            if (isPerspectiveCamera(this.object)) {
                const heightToFit =
                    poseSize.x / poseSize.y < this.object.aspect ? poseSize.y : poseSize.x / this.object.aspect
                const cameraDistance =
                    (heightToFit * 0.5) / Math.tan(this.object.fov * MathUtils.DEG2RAD * 0.5) +
                    FIT_OFFSET[this.viewType]

                const rotation = lookAtFromQuaternion(this.object, this.poses[1])
                const position = poseCenter
                    .add(Z_AXIS.clone().applyQuaternion(rotation).multiplyScalar(cameraDistance))
                    .clone()

                return { position, rotation }
            } else {
                throw Error("Orthographic camera object fitting is not implemented yet.")
            }
        })
    }

    // TODO: Fix resize recalculating the camera position if snapControls is enabled.
    private onResize() {
        if (isPerspectiveCamera(this.object)) {
            this.object.aspect = window.innerWidth / window.innerHeight
        } else if (isOrthographicCamera(this.object)) {
            const aspect = window.innerWidth / window.innerHeight
            const inferredHalfFrustumSize = this.object.top
            this.object.left = -inferredHalfFrustumSize * aspect
            this.object.right = inferredHalfFrustumSize * aspect
            this.object.top = inferredHalfFrustumSize
            this.object.bottom = -inferredHalfFrustumSize
        }

        this.object.updateProjectionMatrix()

        this.updateToFitScreen()

        this.animate(this.history[this.historyIdx])
    }

    private onMouseWheel(event: WheelEvent) {
        if (!this.enabled || !this.history.length || this.transitioning) {
            return
        }

        if (
            (event.deltaY < 0 && this.historyIdx === this.history.length - 1) ||
            (event.deltaY > 0 && this.historyIdx === 0)
        ) {
            return
        }

        if (event.deltaY < 0) {
            this.historyIdx++
        } else if (event.deltaY > 0) {
            this.historyIdx--
        }

        this.dispatchEvent({
            type: "drill",
            targets: this.targets,
            historyIdx: this.historyIdx,
            tweenGroup: this.tweenGroup,
        })

        this.animate(this.history[this.historyIdx])
    }

    constructor(
        private targets: Object3D[],
        private viewType: ViewType,
        public object: PerspectiveCamera | OrthographicCamera,
        public domElement: HTMLElement | null = null,
    ) {
        super(object, domElement)

        this.poses = [[new Box3()], new Quaternion()]
        this.tweenGroup = new TweenGroup()
        this.transitioning = false
        this.history = []
        this.historyIdx = -1

        this.connect()
        this.update()
    }

    connect() {
        ;(this.domElement ?? window).addEventListener("resize", () => this.onResize())
        document.addEventListener("wheel", (event) => this.onMouseWheel(event))
    }

    setTargets(targets: Object3D[], viewType: ViewType, poses: [Box3[], Quaternion]) {
        if (viewType) {
            this.viewType = viewType
        }

        this.targets = targets

        if (!targets.length) {
            return
        }

        this.poses = poses

        this.historyIdx = 0

        this.updateToFitScreen()

        this.dispatchEvent({
            type: viewType === ViewType.PLAN ? "drillStart" : "drillEnd",
            targets: this.targets,
            tweenGroup: this.tweenGroup,
        })

        this.animate(this.history[this.historyIdx])
    }

    update(time?: number) {
        this.tweenGroup.update(time)
    }

    clear() {
        this.tweenGroup.removeAll()
        super.dispose()
        return
    }
}
