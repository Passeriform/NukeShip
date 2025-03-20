import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Box3, Controls, MathUtils, Object3D, OrthographicCamera, PerspectiveCamera, Quaternion, Vector3 } from "three"
import { ELEVATION_CAMERA_LOOK_AT_ROTATION, Z_AXIS } from "@constants/statics"
import { isOrthographicCamera, isPerspectiveCamera } from "./camera"
import { tweenTransform } from "./tween"

const FIT_OFFSET = 4

// TODO: Animate camera position along a pivot arc when rotating, instead of linear path.
// TODO: Add scroll binding for changing PLAN levels.
// TODO: Add rotation to FSTree on panning.

export class ArchControls extends Controls<Record<never, never>> {
    private tweenGroup: TweenGroup

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

    constructor(
        public object: PerspectiveCamera | OrthographicCamera,
        public domElement: HTMLElement | null = null,
    ) {
        super(object, domElement)

        this.tweenGroup = new TweenGroup()

        this.connect()
        this.update()
    }

    connect() {
        ;(this.domElement ?? window).addEventListener("resize", () => this.resize())
    }

    animate(position: Vector3, rotation: Quaternion) {
        if (!this.enabled) {
            return
        }

        this.tweenGroup.removeAll()
        tweenTransform(this.tweenGroup, this.object, { position, rotation })
    }

    fitToObjects(objects: Object3D[], reposition = false) {
        if (!this.enabled) {
            return
        }

        const fitBox = new Box3()

        objects.forEach((obj) => fitBox.expandByObject(obj))

        const center = new Vector3()
        const size = new Vector3()
        fitBox.getCenter(center)
        fitBox.getSize(size)

        if (isPerspectiveCamera(this.object)) {
            const heightToFit = size.x / size.y < this.object.aspect ? size.y : size.x / this.object.aspect
            const cameraZ = (heightToFit * 0.5) / Math.tan(this.object.fov * MathUtils.DEG2RAD * 0.5) + FIT_OFFSET

            this.animate(
                reposition
                    ? new Vector3().addVectors(center, Z_AXIS.clone().multiplyScalar(-cameraZ))
                    : new Vector3(this.object.position.x, this.object.position.y, -cameraZ),
                ELEVATION_CAMERA_LOOK_AT_ROTATION.clone(),
            )
        }
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
