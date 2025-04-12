import { Group as TweenGroup } from "@tweenjs/tween.js"
import { BaseEvent, Box3, Controls, MathUtils, OrthographicCamera, PerspectiveCamera, Quaternion } from "three"
import { Z_AXIS } from "@constants/statics"
import { TweenTransform } from "@constants/types"
import { unpackBounds } from "@utility/bounds"
import { isOrthographicCamera, isPerspectiveCamera, lookAtFromQuaternion } from "@utility/camera"
import { tweenTransform } from "@utility/tween"

// TODO: Animate camera position along a pivot arc when rotating, instead of linear path.
// TODO: Add rotation to FSTree on panning.
// TODO: Add common history between arch and target controls.

type ArchControlsEventMap = {
    drill: {
        historyIdx: number
    }
}

export type DrillEvent = BaseEvent<"drill"> & ArchControlsEventMap["drill"]

// TODO: Accept tweenGroup from caller

export class ArchControls extends Controls<ArchControlsEventMap> {
    private poses: [Box3[], Quaternion]
    private tweenGroup: TweenGroup
    private transitioning: boolean
    private history: TweenTransform[]
    private historyIdx: number
    public cameraOffset: number

    private animate(tweenTarget: TweenTransform) {
        if (!this.enabled) {
            return
        }

        this.transitioning = true
        tweenTransform(this.tweenGroup, this.object, tweenTarget, { onComplete: () => (this.transitioning = false) })
    }

    private updateToFitScreen() {
        this.history = this.poses[0].map((pose) => {
            const [poseCenter, poseSize] = unpackBounds(pose)

            if (isPerspectiveCamera(this.object)) {
                const heightToFit =
                    poseSize.x / poseSize.y < this.object.aspect ? poseSize.y : poseSize.x / this.object.aspect
                const cameraDistance =
                    (heightToFit * 0.5) / Math.tan(this.object.fov * MathUtils.DEG2RAD * 0.5) + this.cameraOffset

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
            historyIdx: this.historyIdx,
        })

        this.animate(this.history[this.historyIdx])
    }

    constructor(
        public object: PerspectiveCamera | OrthographicCamera,
        public domElement: HTMLElement | null = null,
    ) {
        super(object, domElement)

        this.poses = [[new Box3()], new Quaternion()]
        this.tweenGroup = new TweenGroup()
        this.cameraOffset = 4
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

    setPoses(poses: [Box3[], Quaternion]) {
        this.poses = poses

        this.historyIdx = 0

        this.updateToFitScreen()

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
