import { Easing, Tween, Group as TweenGroup } from "@tweenjs/tween.js"
import { Controls, Event, Mesh, Object3D, OrthographicCamera, PerspectiveCamera, Quaternion } from "three"
import { ELEVATION_FORWARD_QUATERNION, Z_AXIS } from "@constants/statics"
import { TweenTransform } from "@constants/types"
import { getWorldPose } from "@utility/pureTransform"
import { averageQuaternions, lookAtFromQuaternion } from "@utility/quaternion"

type TargetControlsEventMap = {
    select: {
        intersect: Mesh
        tweenGroup: TweenGroup
    }
    deselect: {
        tweenGroup: TweenGroup
    }
    transitionChange: {
        transitioning: boolean
    }
    change: {}
}

export type TargetControlsSelectEvent = TargetControlsEventMap["select"] & Event<"select", TargetControls>
export type TargetControlsDeselectEvent = TargetControlsEventMap["deselect"] & Event<"deselect", TargetControls>
export type TargetControlsTransitionChangeEvent = TargetControlsEventMap["transitionChange"] &
    Event<"transitionChange", TargetControls>
export type TargetControlsChangeEvent = TargetControlsEventMap["change"] & Event<"change", TargetControls>

// TODO: Remove usage of private temporary variables, instead use immutable utilities.
// TODO: Rework according to archControls usage.
// TODO: Use actual nodes to track history and return nodes instead of positions.

class TargetControls extends Controls<TargetControlsEventMap> {
    private _unselectedPose: TweenTransform | undefined
    private preloadedRotation: Quaternion
    private tweenGroup: TweenGroup
    private historyIdx: number | undefined
    private history: TweenTransform[]
    private transitioning: boolean
    private cameraOffset: number
    public timing: number

    private resetHistory() {
        this.history = this.history.splice(0, 0)
        this.historyIdx = undefined
        this._unselectedPose = undefined
    }

    private loadRotation(interactables: Object3D[]) {
        const rotations = interactables.map((target) => getWorldPose(target)[1])
        this.preloadedRotation = averageQuaternions(...rotations)
        this.preloadedRotation.slerp(lookAtFromQuaternion(this.object, ELEVATION_FORWARD_QUATERNION), 0.5)
    }

    private animate(tweenTarget: TweenTransform) {
        this.transitioning = true
        this.dispatchEvent({
            type: "transitionChange",
            transitioning: this.transitioning,
        })

        const qFrom = this.object.quaternion.clone()
        const qTo = tweenTarget.rotation.normalize()

        this.tweenGroup.add(
            new Tween({ position: this.object.position.clone(), time: 0 })
                .to({ position: tweenTarget.position, time: 1 }, 400)
                .easing(Easing.Cubic.InOut)
                .onUpdate(({ position, time }) => {
                    this.dispatchEvent({ type: "change" })
                    this.object.position.copy(position)
                    this.object.quaternion.slerpQuaternions(qFrom, qTo, time)
                })
                .onComplete(() => {
                    this.transitioning = false
                    this.dispatchEvent({
                        type: "transitionChange",
                        transitioning: this.transitioning,
                    })
                })
                .start(),
        )
    }

    private onMouseWheel(event: WheelEvent) {
        if (!this.enabled || this.transitioning || event.deltaY === 0 || this.historyIdx === undefined) {
            // Skip if controls are disabled, transitioning, or history is uninitialized.
            return
        }

        // Reset to unselected pose if moving back if beginning is reached.
        if (event.deltaY > 0 && this.historyIdx === 0) {
            if (!this._unselectedPose) {
                throw new Error("Unselected pose is not defined.")
            }

            this.animate(this._unselectedPose)

            this.dispatchEvent({
                type: "deselect",
                tweenGroup: this.tweenGroup,
            })

            this.resetHistory()

            return
        }

        // Skip if history index has reached the end.
        if (event.deltaY < 0 && this.historyIdx === this.history.length - 1) {
            return
        }

        // Move across history.
        if (event.deltaY < 0) {
            this.historyIdx++
        } else if (event.deltaY > 0) {
            this.historyIdx--
        }

        this.animate(this.history[this.historyIdx]!)
    }

    private onMouseDown(event: MouseEvent) {
        event.preventDefault()

        if (!this.enabled) {
            return
        }

        if (event.button === 2) {
            if (!this._unselectedPose) {
                throw new Error("Unselected pose is not defined.")
            }

            this.animate(this._unselectedPose)

            this.dispatchEvent({
                type: "deselect",
                tweenGroup: this.tweenGroup,
            })

            this.resetHistory()
        }
    }

    constructor(
        public override object: PerspectiveCamera | OrthographicCamera,
        public override domElement: HTMLElement | null = null,
    ) {
        super(object, domElement)

        this.preloadedRotation = new Quaternion()
        this.tweenGroup = new TweenGroup()
        this.history = []
        this.transitioning = false
        this.cameraOffset = 1
        this.timing = 400

        if (domElement) {
            this.connect(domElement)
        }

        this.update()
    }

    override connect(element: HTMLElement) {
        element.addEventListener("mousedown", (event) => this.onMouseDown(event))
        element.addEventListener("wheel", (event) => this.onMouseWheel(event))
    }

    pushTarget(target: Mesh) {
        // TODO: Remove when storing targets directly.
        const [position] = getWorldPose(target)
        position.add(Z_AXIS.clone().applyQuaternion(this.preloadedRotation).multiplyScalar(this.cameraOffset))

        if (this.historyIdx !== undefined && this.history[this.historyIdx]?.position.equals(position)) {
            return
        }

        // Store initial pose if the target is pushed is the first.
        if (this.history.length === 0) {
            this._unselectedPose = {
                position: this.object.position.clone(),
                rotation: this.object.quaternion.clone(),
            }
        }

        // Discard later history items if a new target is pushed.
        this.history = this.history.slice(0, (this.historyIdx ?? -1) + 1)

        // Add new target to history.
        // TODO: Make this reliant on getWorldQuaternion.
        const tweenTarget = { position, rotation: this.preloadedRotation.clone() }

        this.history.push(tweenTarget)
        this.historyIdx = this.history.length - 1

        this.dispatchEvent({
            type: "select",
            intersect: target,
            tweenGroup: this.tweenGroup,
        })

        this.animate(tweenTarget)
    }

    setInteractables(interactables: Object3D[]) {
        this.resetHistory()

        if (interactables.length) {
            this.loadRotation(interactables)
        }
    }

    setCameraOffset(offset: number) {
        this.cameraOffset = offset

        if (this.historyIdx) {
            this.animate(this.history[this.historyIdx]!)
        }
    }

    override update(time?: number) {
        this.tweenGroup.update(time)
    }

    clear() {
        this.tweenGroup.removeAll()
        super.dispose()
        return
    }
}

export default TargetControls
