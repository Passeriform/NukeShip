import * as tween from "@tweenjs/tween.js"
import * as three from "three"

export const createCameraResource = () => {
    const camera = new three.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 2, 2000)
    const tweenGroup = new tween.Group()

    const cleanup = () => {
        tweenGroup.removeAll()
        camera.clear()
    }

    return {
        camera,
        tweenGroup,
        cleanup,
    }
}
