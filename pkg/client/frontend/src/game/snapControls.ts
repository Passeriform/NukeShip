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
import { SNAP_CAMERA_LOOK_AT_ROTATION, Z_AXIS } from "@constants/statics"
import { TweenTransform } from "@constants/types"
import { tweenTransform } from "./tween"

export class SnapControls extends Controls<Record<never, never>> {
    private tweenGroup: TweenGroup
    private pointer: Vector2
    private raycaster: Raycaster
    private historyIdx: number
    private history: TweenTransform[]
    private transitioning: boolean

    private resetHistory() {
        this.history = this.history.splice(0, this.history.length)
        this.historyIdx = -1
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

        this.transitioning = true
        this.tweenGroup.removeAll()
        tweenTransform(this.tweenGroup, this.object, this.history[this.historyIdx], () => (this.transitioning = false))
    }

    private onMouseDown(event: MouseEvent) {
        event.preventDefault()

        if (!this.enabled) {
            return
        }

        if (event.button === 2) {
            if (this.history.length) {
                this.transitioning = true
                this.tweenGroup.removeAll()
                tweenTransform(this.tweenGroup, this.object, this.history[0], () => (this.transitioning = false))
            }
            this.resetHistory()
            return
        }

        this.raycaster.setFromCamera(this.pointer, this.object)

        const intersects = this.raycaster.intersectObjects(this.targets, true)

        if (!intersects.length) {
            return
        }

        const [matched] = intersects
            .map((intersection) => intersection.object)
            .filter((object) => "isMesh" in object && object.isMesh)

        if (!matched) {
            return
        }

        const position = new Vector3()
        matched.getWorldPosition(position)

        // TODO: Make this reliant on getWorldQuaternion.
        const tweenTarget = {
            position: new Vector3().addVectors(position, Z_AXIS.clone().applyQuaternion(SNAP_CAMERA_LOOK_AT_ROTATION)),
            rotation: SNAP_CAMERA_LOOK_AT_ROTATION.clone(),
        }

        if (this.historyIdx < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIdx + 1)
        }

        if (this.history.length === 0) {
            const position = new Vector3()
            const rotation = new Quaternion()
            this.object.getWorldPosition(position)
            this.object.getWorldQuaternion(rotation)
            this.history.push({ position, rotation })
            this.historyIdx = this.history.length - 1
        }

        this.history.push(tweenTarget)
        this.historyIdx = this.history.length - 1

        this.transitioning = true
        this.tweenGroup.removeAll()
        tweenTransform(this.tweenGroup, this.object, tweenTarget, () => (this.transitioning = false))
    }

    constructor(
        private targets: Object3D[],
        public object: PerspectiveCamera | OrthographicCamera,
        public domElement: HTMLElement | null = null,
    ) {
        super(object, domElement)

        this.tweenGroup = new TweenGroup()
        this.pointer = new Vector2()
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
