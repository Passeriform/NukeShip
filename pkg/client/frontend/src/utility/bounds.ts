import { Box3, Mesh, Object3D, Vector3, Vector3Tuple } from "three"

const _bounds = new Box3()

export const boundsFromObjects = (...objects: Object3D[]) => {
    _bounds.makeEmpty()
    objects.forEach((obj) => _bounds.expandByObject(obj))
    return _bounds.clone()
}

export const boundsFromPoints = (...points: Vector3Tuple[]) => {
    _bounds.makeEmpty()
    points.forEach((point) => _bounds.expandByPoint(new Vector3(...point)))
    return _bounds.clone()
}

export const boundsFromMeshGeometries = (...meshes: Mesh[]) => {
    _bounds.makeEmpty()
    meshes.forEach((mesh) => {
        const meshBoundingBox = new Box3()

        mesh.updateWorldMatrix(false, false)

        if (!mesh.geometry.boundingBox) {
            mesh.geometry.computeBoundingBox()
        }

        meshBoundingBox.copy(mesh.geometry.boundingBox!)
        meshBoundingBox.applyMatrix4(mesh.matrixWorld)
        _bounds.union(meshBoundingBox)
    })
    return _bounds.clone()
}
