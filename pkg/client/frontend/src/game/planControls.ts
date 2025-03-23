import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Box3, Controls, MathUtils, Object3D, OrthographicCamera, PerspectiveCamera, Quaternion, Vector3 } from "three"
import { Z_AXIS } from "@constants/statics"
import { TweenTransform } from "@constants/types"
import { isOrthographicCamera, isPerspectiveCamera } from "./camera"
import { tweenTransform } from "./tween"

const FIT_OFFSET = 2
const FORWARD_QUATERNION = Object.freeze(new Quaternion(0, 1, 0, -1).normalize())

export class PlanControls extends Controls<Record<never, never>> {
    private _fitBox: Box3
    private _fitBoxCenter: Vector3
    private _fitBoxSize: Vector3
    private tweenGroup: TweenGroup
    private transitioning: boolean

    // TODO: Fix resize recalculating the camera position if snapControls is enabled.
    private resize() {
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
    }

    private fitToObjects() {
        if (!this.enabled) {
            return
        }

        // Computing position of the center and size to fit targets.
        this._fitBox.makeEmpty()
        this.targets.forEach((target) => this._fitBox.expandByObject(target))

        this._fitBox.getCenter(this._fitBoxCenter)
        this._fitBox.getSize(this._fitBoxSize)

        if (isPerspectiveCamera(this.object)) {
            const heightToFit =
                this._fitBoxSize.x / this._fitBoxSize.y < this.object.aspect
                    ? this._fitBoxSize.y
                    : this._fitBoxSize.x / this.object.aspect
            const cameraDistance =
                (heightToFit * 0.5) / Math.tan(this.object.fov * MathUtils.DEG2RAD * 0.5) + FIT_OFFSET

            const tweenTarget = {
                position: this._fitBoxCenter
                    .add(Z_AXIS.clone().applyQuaternion(FORWARD_QUATERNION).multiplyScalar(cameraDistance))
                    .clone(),
                rotation: FORWARD_QUATERNION.clone(),
            }

            this.animate(tweenTarget)
        }
    }

    constructor(
        private targets: Object3D[],
        public object: PerspectiveCamera | OrthographicCamera,
        public domElement: HTMLElement | null = null,
    ) {
        super(object, domElement)

        this._fitBox = new Box3()
        this._fitBoxCenter = new Vector3()
        this._fitBoxSize = new Vector3()
        this.tweenGroup = new TweenGroup()
        this.transitioning = false

        this.connect()
        this.update()
    }

    connect() {
        ;(this.domElement ?? window).addEventListener("resize", () => this.resize())
    }

    setTargets(targets: Object3D[]) {
        this.targets = targets

        if (targets.length) {
            this.fitToObjects()
        }
    }

    animate(tweenTarget: TweenTransform) {
        if (!this.enabled) {
            return
        }

        this.transitioning = true
        this.tweenGroup.removeAll()
        tweenTransform(this.tweenGroup, this.object, tweenTarget, () => {
            this.transitioning = false
        })
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
