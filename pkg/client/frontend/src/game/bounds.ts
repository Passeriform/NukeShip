import { Box3, Object3D, Vector3 } from "three"

const _boundCenter = new Vector3()
const _boundSize = new Vector3()

export const boundsFromObjects = (...objects: Object3D[]) => {
    const bounds = new Box3()
    objects.forEach((obj) => bounds.expandByObject(obj))
    return bounds
}

export const unpackBounds = (bounds: Box3) => {
    bounds.getCenter(_boundCenter)
    bounds.getSize(_boundSize)
    return [_boundCenter.clone(), _boundSize.clone()]
}
