import { Box3, Object3D, Vector3 } from "three"

const _bounds = new Box3()
const _boundCenter = new Vector3()
const _boundSize = new Vector3()

export const boundsFromObjects = (...objects: Object3D[]) => {
    _bounds.makeEmpty()
    objects.forEach((obj) => _bounds.expandByObject(obj))
    return _bounds.clone()
}

export const unpackBounds = (bounds: Box3) => {
    bounds.getCenter(_boundCenter)
    bounds.getSize(_boundSize)
    return [_boundCenter.clone(), _boundSize.clone()] as [Vector3, Vector3]
}
