import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Box3, Controls, MathUtils, Object3D, OrthographicCamera, PerspectiveCamera, Vector3 } from "three"
import { ELEVATION_FIT_OFFSET, WORLD_ELEVATION_ROTATION, Z_AXIS } from "@constants/statics"
import { TweenTransform } from "@constants/types"
import { isOrthographicCamera, isPerspectiveCamera } from "./camera"
import { tweenTransform } from "./tween"

// TODO: Animate camera position along a pivot arc when rotating, instead of linear path.
// TODO: Add scroll binding for changing PLAN levels.
// TODO: Add rotation to FSTree on panning.
// TODO: Add PLAN and ELEVATION as properties of archControls.

export class ArchControls extends Controls<Record<never, never>> {
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

        const fitBox = new Box3()

        this.targets.forEach((target) => fitBox.expandByObject(target))

        const center = new Vector3()
        const size = new Vector3()
        fitBox.getCenter(center)
        fitBox.getSize(size)

        if (isPerspectiveCamera(this.object)) {
            const heightToFit = size.x / size.y < this.object.aspect ? size.y : size.x / this.object.aspect
            const cameraDistance =
                (heightToFit * 0.5) / Math.tan(this.object.fov * MathUtils.DEG2RAD * 0.5) + ELEVATION_FIT_OFFSET

            const rotation = WORLD_ELEVATION_ROTATION.clone()
            const position = new Vector3().addVectors(center, Z_AXIS.clone().multiplyScalar(-cameraDistance))

            this.animate({ position, rotation })
        }
    }

    constructor(
        private targets: Object3D[],
        public object: PerspectiveCamera | OrthographicCamera,
        public domElement: HTMLElement | null = null,
    ) {
        super(object, domElement)

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
