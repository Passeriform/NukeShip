import { createEffect, mergeProps, onCleanup } from "solid-js"
import { AmbientLight, ColorRepresentation, DirectionalLight, Vector3 } from "three"

interface UseLightingProps {
    ambientLightColor?: ColorRepresentation
    ambientLightIntensity?: number
    directionalLightColor?: ColorRepresentation
    directionalLightIntensity?: number
    directionalLightPosition?: Vector3
}

const useLighting = (_props: UseLightingProps) => {
    const props = mergeProps(
        {
            ambientLightColor: 0xffffff,
            ambientLightIntensity: 2,
            directionalLightColor: 0xffffff,
            directionalLightIntensity: 2,
            directionalLightPosition: new Vector3(1, 1, 1),
        },
        _props,
    )

    const ambientLight = new AmbientLight(props.ambientLightColor, props.ambientLightIntensity)
    const directionalLight = new DirectionalLight(props.directionalLightColor, props.directionalLightIntensity)

    createEffect(() => {
        ambientLight.color.set(props.ambientLightColor)
        ambientLight.intensity = props.ambientLightIntensity
        directionalLight.color.set(props.directionalLightColor)
        directionalLight.intensity = props.directionalLightIntensity
        directionalLight.position.copy(props.directionalLightPosition)
    })

    onCleanup(() => {
        directionalLight.dispose()
        ambientLight.dispose()
    })

    return {
        ambientLight,
        directionalLight,
    }
}

export default useLighting
