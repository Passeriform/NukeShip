import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Box3, Camera, MathUtils, Object3D, OrthographicCamera, PerspectiveCamera, Quaternion, Vector3 } from "three"
import { tweenTransform } from "./tween"

export const CAMERA_TYPE = {
    ORTHOGRAPHIC: "ORTHOGRAPHIC",
    PERSPECTIVE: "PERSPECTIVE",
} as const

export type CAMERA_TYPE = (typeof CAMERA_TYPE)[keyof typeof CAMERA_TYPE]

const ORTHO_FRUSTUM_SIZE = 10
const FIT_OFFSET = 4

export class TogglingCamera extends Camera {
    // TODO: Extend self to store camera instance instead.
    private camera: PerspectiveCamera | OrthographicCamera

    private static isPerspective(cam: OrthographicCamera | PerspectiveCamera): cam is PerspectiveCamera {
        return "isPerspectiveCamera" in cam && cam.isPerspectiveCamera
    }

    private static createOrthographicCamera() {
        const aspect = window.innerWidth / window.innerHeight
        const left = (-ORTHO_FRUSTUM_SIZE * aspect) / 2
        const right = (ORTHO_FRUSTUM_SIZE * aspect) / 2
        const top = ORTHO_FRUSTUM_SIZE / 2
        const bottom = -ORTHO_FRUSTUM_SIZE / 2
        return new OrthographicCamera(left, right, top, bottom, 0.1, 2000)
    }

    private static createPerspectiveCamera() {
        const fov = 70
        const aspect = window.innerWidth / window.innerHeight
        return new PerspectiveCamera(fov, aspect, 0.1, 2000)
    }

    private resize() {
        if (TogglingCamera.isPerspective(this.camera)) {
            this.camera.aspect = window.innerWidth / window.innerHeight
        } else {
            const aspect = window.innerWidth / window.innerHeight
            this.camera.left = (-ORTHO_FRUSTUM_SIZE * aspect) / 2
            this.camera.right = (ORTHO_FRUSTUM_SIZE * aspect) / 2
            this.camera.top = ORTHO_FRUSTUM_SIZE / 2
            this.camera.bottom = -ORTHO_FRUSTUM_SIZE / 2
        }
        this.camera.updateProjectionMatrix()
    }

    constructor(
        private cameraType: CAMERA_TYPE,
        public tweenGroup: TweenGroup = new TweenGroup(),
    ) {
        super()
        this.camera =
            this.cameraType === CAMERA_TYPE.PERSPECTIVE
                ? TogglingCamera.createPerspectiveCamera()
                : TogglingCamera.createOrthographicCamera()

        window.addEventListener("resize", this.resize)
    }

    animate(position: Vector3, rotation: Quaternion) {
        this.tweenGroup.removeAll()
        tweenTransform(this.tweenGroup, this.camera, { position, rotation })
    }

    fitToObjects(...objects: Object3D[]) {
        const fitBox = new Box3()

        objects.forEach((obj) => fitBox.expandByObject(obj))

        const center = new Vector3()
        const size = new Vector3()
        fitBox.getCenter(center)
        fitBox.getSize(size)

        if (TogglingCamera.isPerspective(this.camera)) {
            const heightToFit = size.x / size.y < this.camera.aspect ? size.y : size.x / this.camera.aspect
            const cameraZ = (heightToFit * 0.5) / Math.tan(this.camera.fov * MathUtils.DEG2RAD * 0.5) + FIT_OFFSET

            this.animate(new Vector3(center.x, center.y, center.z - cameraZ), new Quaternion(0, 1, 0, 0).normalize())
        }
    }

    clear() {
        this.tweenGroup.removeAll()
        this.camera.clear()
        window.removeEventListener("resize", this.resize)
        return super.clear()
    }
}
