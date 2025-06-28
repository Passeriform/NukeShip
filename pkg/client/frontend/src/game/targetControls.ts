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
    private _lastSelected: Object3D | undefined
    private preloadedRotation: Quaternion
    private tweenGroup: TweenGroup
    private historyIdx: number
    private history: TweenTransform[]
    private transitioning: boolean
    public cameraOffset: number

    private resetHistory() {
        this.history = this.history.splice(0, this.history.length)
        this.historyIdx = -1
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

        if (this.historyIdx === 0) {
            this.dispatchEvent({
                type: "deselect",
                tweenGroup: this.tweenGroup,
            })
        }

        this.animate(this.history[this.historyIdx]!)
    }

    private onMouseDown(event: MouseEvent) {
        event.preventDefault()

        if (!this.enabled) {
            return
        }

        if (event.button === 2) {
            if (this.history.length) {
                this.animate(this.history[0]!)
            }

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
        this.historyIdx = -1
        this.transitioning = false
        this.cameraOffset = 1

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
        if (target === this._lastSelected) {
            return
        }

        this._lastSelected = target
        const [position] = getWorldPose(target)

        // TODO: Make this reliant on getWorldQuaternion.
        const tweenTarget = {
            position: position
                .add(Z_AXIS.clone().applyQuaternion(this.preloadedRotation).multiplyScalar(this.cameraOffset))
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
                intersect: target,
                tweenGroup: this.tweenGroup,
            })
        }

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
