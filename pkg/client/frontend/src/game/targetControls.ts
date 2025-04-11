import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Controls, Object3D, OrthographicCamera, PerspectiveCamera, Quaternion, Raycaster, Vector2 } from "three"
import { ELEVATION_FORWARD_QUATERNION, Z_AXIS } from "@constants/statics"
import { TweenTransform } from "@constants/types"
import { lookAtFromQuaternion } from "@utility/camera"
import { getWorldPose } from "@utility/pureTransform"
import { averageQuaternions } from "@utility/quaternion"
import { tweenTransform } from "@utility/tween"

const FIT_OFFSET = 1

type TargetControlsEventMap = {
    select: {
        intersect: Object3D
        tweenGroup: TweenGroup
    }
    deselect: {
        tweenGroup: TweenGroup
    }
}

// TODO: Remove usage of private temporary variables, instead use immutable utilities.
// TODO: Rework according to archControls usage.

export class TargetControls extends Controls<TargetControlsEventMap> {
    private _lastSelected: Object3D | undefined
    private pointer: Vector2
    private preloadedRotation: Quaternion
    private tweenGroup: TweenGroup
    private raycaster: Raycaster
    private historyIdx: number
    private history: TweenTransform[]
    private transitioning: boolean

    private resetHistory() {
        this.history = this.history.splice(0, this.history.length)
        this.historyIdx = -1
    }

    private loadRotation() {
        const rotations = this.targets.map((target) => getWorldPose(target)[1])
        this.preloadedRotation = averageQuaternions(...rotations)
        this.preloadedRotation.slerp(lookAtFromQuaternion(this.object, ELEVATION_FORWARD_QUATERNION.clone()), 0.5)
    }

    private animate(tweenTarget: TweenTransform) {
        this.transitioning = true
        this.tweenGroup.removeAll()
        tweenTransform(this.tweenGroup, this.object, tweenTarget, { onComplete: () => (this.transitioning = false) })
    }

    private onMouseMove(event: MouseEvent) {
        if (!this.enabled) {
            return
        }

        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
    }

    private onMouseWheel(event: WheelEvent) {
        if (!this.enabled || this.transitioning || event.deltaY === 0 || this.historyIdx === -1) {
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

        this.animate(this.history[this.historyIdx])
    }

    private onMouseDown(event: MouseEvent) {
        event.preventDefault()

        if (!this.enabled) {
            return
        }

        if (event.button === 2) {
            if (this.history.length) {
                this.animate(this.history[0])
            }

            this.dispatchEvent({
                type: "deselect",
                tweenGroup: this.tweenGroup,
            })

            this.resetHistory()

            return
        }

        this.raycaster.setFromCamera(this.pointer, this.object)

        const intersects = this.raycaster.intersectObjects(this.targets, true)

        const [matched] = intersects
            .map((intersection) => intersection.object)
            .filter((object) => "isMesh" in object && object.isMesh)

        if (!matched || matched === this._lastSelected) {
            return
        }

        this._lastSelected = matched
        const [position] = getWorldPose(matched)

        // TODO: Make this reliant on getWorldQuaternion.
        const tweenTarget = {
            position: position
                .add(Z_AXIS.clone().applyQuaternion(this.preloadedRotation).multiplyScalar(FIT_OFFSET))
                .clone(),
            rotation: this.preloadedRotation.clone(),
        }

        if (this.historyIdx < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIdx + 1)
        }

        if (this.history.length === 0) {
            const [position, rotation] = getWorldPose(this.object)
            this.history.push({ position, rotation })
            this.historyIdx = this.history.length - 1

            this.dispatchEvent({
                type: "select",
                intersect: matched,
                tweenGroup: this.tweenGroup,
            })
        }

        this.history.push(tweenTarget)
        this.historyIdx = this.history.length - 1

        this.animate(tweenTarget)
    }

    constructor(
        private targets: Object3D[],
        public object: PerspectiveCamera | OrthographicCamera,
        public domElement: HTMLElement | null = null,
    ) {
        super(object, domElement)

        this.pointer = new Vector2()
        this.preloadedRotation = new Quaternion()
        this.tweenGroup = new TweenGroup()
        this.raycaster = new Raycaster()
        this.history = []
        this.historyIdx = -1
        this.transitioning = false

        this.connect()
        this.update()
    }

    connect() {
        document.addEventListener("mousemove", (event) => this.onMouseMove(event))
        document.addEventListener("mousedown", (event) => this.onMouseDown(event))
        document.addEventListener("wheel", (event) => this.onMouseWheel(event))
    }

    setTargets(targets: Object3D[]) {
        if (!targets.length) {
            throw Error("At least one target is required to be assigned for target controls.")
        }

        this.targets = targets

        this.resetHistory()

        this.loadRotation()
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
