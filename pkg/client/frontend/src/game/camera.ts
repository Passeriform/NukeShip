import { Group } from "@tweenjs/tween.js"
import { PerspectiveCamera } from "three"

export const createCamera = () => {
    const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 2, 2000)
    const tweenGroup = new Group()

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
