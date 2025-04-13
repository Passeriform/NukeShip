import { Group as TweenGroup } from "@tweenjs/tween.js"
import { BaseEvent, Box3, Controls, MathUtils, OrthographicCamera, PerspectiveCamera, Quaternion } from "three"
import { Z_AXIS } from "@constants/statics"
import { TweenTransform } from "@constants/types"
import { unpackBounds } from "@utility/bounds"
import { lookAtFromQuaternion } from "@utility/camera"
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
    private boundSet: Box3[]
    private preloadedRotation: Quaternion
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
        this.history = this.boundSet.map((pose) => {
            const [center, size] = unpackBounds(pose)

            const heightToFit = size.x / size.y < this.object.aspect ? size.y : size.x / this.object.aspect
            const cameraDistance =
                (heightToFit * 0.5) / Math.tan(this.object.fov * MathUtils.DEG2RAD * 0.5) + this.cameraOffset

            const rotation = lookAtFromQuaternion(this.object, this.preloadedRotation)
            const position = center.add(Z_AXIS.clone().applyQuaternion(rotation).multiplyScalar(cameraDistance)).clone()

            return { position, rotation }
        })
    }

    // TODO: Fix resize recalculating the camera position if snapControls is enabled.
    private onResize() {
        this.object.aspect = window.innerWidth / window.innerHeight

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
        public object: PerspectiveCamera,
        public domElement: HTMLElement | null = null,
    ) {
        if ("isOrthographicCamera" in object && (object as unknown as OrthographicCamera).isOrthographicCamera) {
            throw Error("Arch controls currently only works for perspective camera.")
        }

        super(object, domElement)

        this.boundSet = []
        this.preloadedRotation = new Quaternion()
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

    setPoses(boundSet: Box3[], rotation: Quaternion) {
        this.preloadedRotation = rotation
        this.boundSet = boundSet

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
