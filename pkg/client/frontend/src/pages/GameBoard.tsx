import { useParams } from "@solidjs/router"
import { Show, Switch, VoidComponent, createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { Match } from "solid-js"
import toast from "solid-toast"
import { Box3, Mesh, Object3D, Vector3 } from "three"
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import Button from "@components/Button"
import { ExampleFS } from "@constants/sample"
import { FOCUS_STATICS, STATICS } from "@constants/statics"
import { FOCUS_TYPE, VIEW_TYPE } from "@constants/types"
import { CAMERA_TYPE, createCamera } from "@game/camera"
import { createLighting } from "@game/lighting"
import { createScene } from "@game/scene"
import { CHILDREN_GROUP_NAME, generateObjectTree } from "@game/tree"
import { tweenObject } from "@game/tween"

// TODO: Cull whole node if it is being partially culled (https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633/5).

const GameBoard: VoidComponent = () => {
    const { code } = useParams()

    const { scene, renderer, cleanup: sceneCleanup } = createScene()
    const { ambientLight, directionalLight, cleanup: lightingCleanup } = createLighting()
    const { camera, tweenGroup, resize: cameraResize, cleanup: cameraCleanup } = createCamera(CAMERA_TYPE.PERSPECTIVE)

    const selfFsTree = generateObjectTree(ExampleFS, 1, 2)
    const opponentFsTree = generateObjectTree(ExampleFS, 1, 1)
    const nodeCache: Object3D[] = []
    const nodeCacheBox = new Box3()
    const nodeCacheHistory: Object3D[][] = []

    const [view, setView] = createSignal<VIEW_TYPE>(VIEW_TYPE.ELEVATION)
    const [focus, setFocus] = createSignal<FOCUS_TYPE>(FOCUS_TYPE.NONE)

    createEffect(() => {
        tweenGroup.removeAll()
        tweenGroup.add(
            tweenObject(camera, {
                position: FOCUS_STATICS[focus()][view()].position,
                rotation: FOCUS_STATICS[focus()][view()].rotation,
            }),
        )
    })

    createEffect(() => {
        selfFsTree.position.copy(STATICS.SELF.position)
        selfFsTree.quaternion.copy(STATICS.SELF.rotation)
        scene.add(selfFsTree)
    })

    createEffect(() => {
        opponentFsTree.position.copy(STATICS.OPPONENT.position)
        opponentFsTree.quaternion.copy(STATICS.OPPONENT.rotation)
        scene.add(opponentFsTree)
    })

    const clearNodeCache = () => {
        while (nodeCache.length) {
            nodeCache.pop()
        }
    }

    const replaceNodeCache = (...nodes: Object3D[]) => {
        clearNodeCache()
        nodeCache.push(...nodes)
    }

    const isMesh = (obj: Object3D): obj is Mesh => "isMesh" in obj && (obj as Mesh).isMesh

    const setCameraFromNodeCache = (nodeCache: Object3D[]) => {
        const positions = nodeCache.flatMap((node) =>
            node.children.filter(isMesh).map((child) => {
                const worldPosition = new Vector3()
                child.getWorldPosition(worldPosition)
                return worldPosition
            }),
        )

        const center = new Vector3()
        nodeCacheBox.setFromPoints(positions).getCenter(center)

        // TODO: Place camera in the normal direction from the plane from points.
        camera.position.set(center.x - 4, center.y, center.z)
    }

    const moveForward = () => {
        // TODO: Make first insert default.
        const nodes = nodeCache.flatMap((node) => node.children.filter((child) => child.name === CHILDREN_GROUP_NAME))

        if (!nodes.length) {
            return
        }

        const newNodes = nodes.flatMap((node) => node.children)
        nodeCacheHistory.push([...nodeCache])

        setCameraFromNodeCache(newNodes)
        replaceNodeCache(...newNodes)
    }

    const moveBackward = () => {
        const prevNodeCache = nodeCacheHistory.pop()

        if (!prevNodeCache?.length) {
            return
        }

        setCameraFromNodeCache(prevNodeCache)
        replaceNodeCache(...prevNodeCache)
    }

    const draw = (time: number = 0) => {
        tweenGroup.update(time)
        renderer.render(scene, camera)
    }

    onMount(() => {
        if (!WebGL.isWebGL2Available()) {
            toast.error(`WebGL is not available ${WebGL.getWebGL2ErrorMessage()}`, { duration: -1 })
            return
        }

        // Renderer
        renderer.setAnimationLoop(draw)
        renderer.setSize(window.innerWidth, window.innerHeight)

        // Lighting
        directionalLight.position.copy(STATICS.DIRECTIONAL_LIGHT.position)
        scene.add(ambientLight)
        scene.add(directionalLight)

        // Resize handler
        window.addEventListener("resize", () => {
            cameraResize()
            renderer.setSize(window.innerWidth, window.innerHeight)
        })
    })

    onCleanup(() => {
        // TODO: Cleanup material and meshes inside fsTree
        selfFsTree.clear()
        opponentFsTree.clear()
        lightingCleanup()
        cameraCleanup()
        sceneCleanup()
    })

    return (
        <>
            {renderer.domElement}
            <section class="absolute bottom-8 flex flex-row justify-evenly gap-8">
                <Switch>
                    <Match when={focus() === FOCUS_TYPE.NONE}>
                        <Button
                            class="p-8"
                            text="Focus Self"
                            onClick={() => {
                                setFocus(FOCUS_TYPE.SELF)
                                replaceNodeCache(selfFsTree)
                            }}
                        />
                        <Button
                            class="p-8"
                            text="Focus Opponent"
                            onClick={() => {
                                setFocus(FOCUS_TYPE.OPPONENT)
                                replaceNodeCache(opponentFsTree)
                            }}
                        />
                    </Match>
                </Switch>
                <Show when={focus() !== FOCUS_TYPE.NONE}>
                    <Button
                        class="p-8"
                        text="Switch View"
                        onClick={() => {
                            setView(view() === VIEW_TYPE.PLAN ? VIEW_TYPE.ELEVATION : VIEW_TYPE.PLAN)
                            // TODO: Maintain focus on the nodeCache if nodes exist, instead of default view.
                        }}
                    />
                    <Button
                        class="p-8"
                        text="Focus Back"
                        onClick={() => {
                            setFocus(FOCUS_TYPE.NONE)
                            setView(VIEW_TYPE.ELEVATION)
                            clearNodeCache()
                        }}
                    />
                </Show>
                <Show when={focus() === FOCUS_TYPE.SELF && view() === VIEW_TYPE.PLAN}>
                    <Button class="p-8" text="+" onClick={moveForward} />
                    <Button class="p-8" text="-" onClick={moveBackward} />
                </Show>
            </section>
        </>
    )
}

export default GameBoard
