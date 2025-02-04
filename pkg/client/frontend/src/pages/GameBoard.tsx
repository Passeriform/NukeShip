import { useParams } from "@solidjs/router"
import { Show, Switch, VoidComponent, createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { Match } from "solid-js"
import toast from "solid-toast"
import { Matrix4, Quaternion, Vector3 } from "three"
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import Button from "@components/Button"
import { ExampleFS } from "@constants/sample"
import { ELEVATION_CAMERA_OFFSET, PLAN_CAMERA_NODE_DISTANCE, STATICS, Y_AXIS } from "@constants/statics"
import { FOCUS_TYPE, VIEW_TYPE } from "@constants/types"
import { CAMERA_TYPE, createCamera } from "@game/camera"
import { createLighting } from "@game/lighting"
import { createScene } from "@game/scene"
import { Tree } from "@game/tree"
import { tweenObject } from "@game/tween"

// TODO: Cull whole node if it is being partially culled (https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633/5).
// TODO: Use actual FS data from native client.
// TODO: Migrate to using trackball controls with no panning.

const GameBoard: VoidComponent = () => {
    const { code } = useParams()

    const { scene, renderer, cleanup: sceneCleanup } = createScene()
    const { ambientLight, directionalLight, cleanup: lightingCleanup } = createLighting()
    const { camera, tweenGroup, resize: cameraResize, cleanup: cameraCleanup } = createCamera(CAMERA_TYPE.PERSPECTIVE)

    const selfFsTree = new Tree().setFromRawData(ExampleFS, 1)
    const opponentFsTree = new Tree().setFromRawData(ExampleFS, 2)

    const [planeIdx, setPlaneIdx] = createSignal(0)
    const [view, setView] = createSignal<VIEW_TYPE>(VIEW_TYPE.ELEVATION)
    const [focus, setFocus] = createSignal<FOCUS_TYPE>(FOCUS_TYPE.NONE)

    createEffect(() => {
        // Set position and rotation for NONE focus.
        if (focus() === FOCUS_TYPE.NONE) {
            return tweenObject(tweenGroup, camera, {
                position: new Vector3()
                    .addVectors(selfFsTree.getWorldPosition(), opponentFsTree.getWorldPosition())
                    .divideScalar(2)
                    .add(ELEVATION_CAMERA_OFFSET),
                rotation: new Quaternion(0, 1, 0, 0).normalize(),
            })
        }

        const targetTree = focus() === FOCUS_TYPE.SELF ? selfFsTree : opponentFsTree

        switch (view()) {
            case VIEW_TYPE.ELEVATION: {
                const position = new Vector3().addVectors(targetTree.midpoint, ELEVATION_CAMERA_OFFSET)
                const rotation = new Quaternion(0, 1, 0, 0).normalize()
                return tweenObject(tweenGroup, camera, {
                    position,
                    rotation,
                })
            }
            case VIEW_TYPE.PLAN: {
                const position = new Vector3().addVectors(
                    targetTree.planes[planeIdx()].center,
                    new Vector3().addScaledVector(
                        targetTree.planes[planeIdx()].normal.clone().negate(),
                        PLAN_CAMERA_NODE_DISTANCE,
                    ),
                )
                const rotation = new Quaternion().setFromRotationMatrix(
                    new Matrix4().lookAt(position, targetTree.planes[planeIdx()].center, Y_AXIS),
                )
                return tweenObject(tweenGroup, camera, { position, rotation })
            }
        }
    })

    const moveForward = () => {
        const maxPlaneIdx = (focus() === FOCUS_TYPE.SELF ? selfFsTree : opponentFsTree).planes.length - 1

        if (planeIdx() === maxPlaneIdx) {
            return
        }

        setPlaneIdx(planeIdx() + 1)
    }

    const moveBackward = () => {
        if (planeIdx() === 0) {
            return
        }

        setPlaneIdx(planeIdx() - 1)
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

        // Node trees
        selfFsTree.position.copy(STATICS.SELF.position)
        selfFsTree.quaternion.copy(STATICS.SELF.rotation)
        opponentFsTree.position.copy(STATICS.OPPONENT.position)
        opponentFsTree.quaternion.copy(STATICS.OPPONENT.rotation)
        scene.add(selfFsTree)
        scene.add(opponentFsTree)
        selfFsTree.recomputePlanes()
        opponentFsTree.recomputePlanes()

        // Resize handler
        window.addEventListener("resize", () => {
            cameraResize()
            renderer.setSize(window.innerWidth, window.innerHeight)
        })
    })

    onCleanup(() => {
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
                                setPlaneIdx(0)
                            }}
                        />
                        <Button
                            class="p-8"
                            text="Focus Opponent"
                            onClick={() => {
                                setFocus(FOCUS_TYPE.OPPONENT)
                                setPlaneIdx(0)
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
                        }}
                    />
                    <Button
                        class="p-8"
                        text="Focus Back"
                        onClick={() => {
                            setFocus(FOCUS_TYPE.NONE)
                            setView(VIEW_TYPE.ELEVATION)
                            setPlaneIdx(0)
                        }}
                    />
                </Show>
            </section>
            <section class="absolute left-8 top-8 flex flex-col justify-evenly gap-8">
                <Show when={view() === VIEW_TYPE.PLAN}>
                    <Button class="p-8" text="+" onClick={moveForward} />
                    <Button class="p-8" text="-" onClick={moveBackward} />
                </Show>
            </section>
        </>
    )
}

export default GameBoard
