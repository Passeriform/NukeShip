import { Box3, Object3D, Vector3, Vector3Tuple } from "three"

export const boundsFromObjects = (...objects: Object3D[]) => {
    const bounds = new Box3()
    objects.forEach((obj) => bounds.expandByObject(obj))
    return bounds.clone()
}

export const boundsFromPoints = (...points: Vector3Tuple[]) => {
    const bounds = new Box3()
    bounds.setFromPoints(points.map((point) => new Vector3(...point)))
    return bounds.clone()
}
