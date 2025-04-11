import { Group as TweenGroup } from "@tweenjs/tween.js"
import {
    Controls,
    Object3D,
    OrthographicCamera,
    PerspectiveCamera,
    Quaternion,
    Raycaster,
    Vector2,
    Vector3,
} from "three"
import { Z_AXIS } from "@constants/statics"
import { TweenTransform } from "@constants/types"
import { tweenTransform } from "@utility/tween"

// TODO: Use dynamic fit offset so that all nodes of the next level are visible.
const FIT_OFFSET = 1
// TODO: Reuse lookAtFromQuaternion and arch controls static forward quaternion.
const FORWARD_QUATERNION = Object.freeze(new Quaternion(0, 1, 0, 0).normalize())

// TODO: Remove usage of private temporary variables, instead use immutable utilities.
// TODO: Rework according to archControls usage.

export class TargetControls extends Controls<Record<never, never>> {
    private _pointer: Vector2
    private _position: Vector3
    private _rotation: Quaternion
    private _targetRotation: Quaternion
    private _lastTarget: Object3D | undefined
    private tweenGroup: TweenGroup
    private raycaster: Raycaster
    private historyIdx: number
    private history: TweenTransform[]
    private transitioning: boolean

    private resetHistory() {
        this.history = this.history.splice(0, this.history.length)
        this.historyIdx = -1
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

        this._pointer.x = (event.clientX / window.innerWidth) * 2 - 1
        this._pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
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
            this.resetHistory()
            return
        }

        this.raycaster.setFromCamera(this._pointer, this.object)

        const intersects = this.raycaster.intersectObjects(this.targets, true)

        if (!intersects.length) {
            return
        }

        const [matched] = intersects
            .map((intersection) => intersection.object)
            .filter((object) => "isMesh" in object && object.isMesh)

        if (!matched || matched === this._lastTarget) {
            return
        }

        this._lastTarget = matched
        matched.getWorldPosition(this._position)

        // TODO: Make this reliant on getWorldQuaternion.
        const tweenTarget = {
            position: this._position
                .add(Z_AXIS.clone().applyQuaternion(this._targetRotation).multiplyScalar(FIT_OFFSET))
                .clone(),
            rotation: this._targetRotation.clone(),
        }

        if (this.historyIdx < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIdx + 1)
        }

        if (this.history.length === 0) {
            this.object.getWorldPosition(this._position)
            this.object.getWorldQuaternion(this._rotation)
            this.history.push({ position: this._position.clone(), rotation: this._rotation.clone() })
            this.historyIdx = this.history.length - 1
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

        this._pointer = new Vector2()
        this._position = new Vector3()
        this._rotation = new Quaternion()
        this._targetRotation = new Quaternion()
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
        this.targets = targets
        if (targets.length) {
            this._targetRotation = this.targets[0].quaternion.clone()
            this.targets.slice(1).forEach((target, idx) => {
                this._targetRotation.slerp(target.quaternion, 1 / (idx + 1))
            })
            this._targetRotation.invert().normalize()
        } else {
            this._targetRotation = FORWARD_QUATERNION.clone()
        }
        this._targetRotation.slerp(FORWARD_QUATERNION.clone(), 0.5)
        this.resetHistory()
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
