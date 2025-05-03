import { Easing, Tween, Group as TweenGroup } from "@tweenjs/tween.js"
import { Line, Material, Mesh, Object3D } from "three"
import { TweenTransform } from "@constants/types"

type TweenOptions = {
    timing: number
    onComplete: () => void
}

const DEFAULT_TWEEN_OPTIONS = { timing: 400 }

export const tweenOpacity = (
    group: TweenGroup,
    object: Mesh | Line,
    to: number,
    tweenOptions: Partial<TweenOptions> = DEFAULT_TWEEN_OPTIONS,
) => {
    if (!group) {
        return
    }

    group.add(
        new Tween({ opacity: (object.material as Material).opacity })
            .to({ opacity: to }, tweenOptions.timing ?? DEFAULT_TWEEN_OPTIONS.timing)
            .easing(Easing.Cubic.InOut)
            .onStart(() => {
                if (to !== 0) {
                    object.visible = true
                }
            })
            .onUpdate(({ opacity }) => {
                ;(object.material as Material).opacity = opacity
            })
            .onComplete(() => {
                if (to === 0) {
                    object.visible = false
                }
                tweenOptions.onComplete?.()
            })
            .start(),
    )
}
