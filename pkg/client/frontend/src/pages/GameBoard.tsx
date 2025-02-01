import { useParams } from "@solidjs/router"
import { Show, Switch, VoidComponent, createEffect, createResource, createSignal, onCleanup, onMount } from "solid-js"
import { Match } from "solid-js"
import toast from "solid-toast"
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import Button from "@components/Button"
import { ExampleFS } from "@constants/sample"
import { FOCUS_STATICS, STATICS } from "@constants/statics"
import { FOCUS_TYPE, VIEW_TYPE } from "@constants/types"
import { createCameraResource } from "@game/camera"
import { createSceneResource } from "@game/scene"
import { generateObjectTree } from "@game/tree"
import { tweenObject } from "@game/tween"

// TODO: Cull whole node if it is being partially culled (https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633/5).

const GameBoard: VoidComponent = () => {
    const { code } = useParams()

    const [sceneResource] = createResource(createSceneResource)
    const [cameraResource] = createResource(createCameraResource)

    const [selfFsTreeResource] = createResource(() => generateObjectTree(ExampleFS, 1, 2))
    const [opponentFsTreeResource] = createResource(() => generateObjectTree(ExampleFS, 1, 1))

    const [view, setView] = createSignal<VIEW_TYPE>(VIEW_TYPE.ELEVATION)
    const [focus, setFocus] = createSignal<FOCUS_TYPE>(FOCUS_TYPE.NONE)

    createEffect(() => {
        const { camera, tweenGroup } = cameraResource()!
        tweenGroup.removeAll()
        tweenGroup.add(
            tweenObject(camera, {
                position: FOCUS_STATICS[focus()][view()].position,
                rotation: FOCUS_STATICS[focus()][view()].rotation,
            }),
        )
    })

    createEffect(() => {
        const { scene } = sceneResource()!
        selfFsTreeResource()!.position.copy(STATICS.SELF.position)
        selfFsTreeResource()!.quaternion.copy(STATICS.SELF.rotation)
        scene.add(selfFsTreeResource()!)
    })

    createEffect(() => {
        const { scene } = sceneResource()!
        opponentFsTreeResource()!.position.copy(STATICS.OPPONENT.position)
        opponentFsTreeResource()!.quaternion.copy(STATICS.OPPONENT.rotation)
        scene.add(opponentFsTreeResource()!)
    })

    const draw = (time: number = 0) => {
        const { scene, renderer } = sceneResource()!
        const { camera, tweenGroup } = cameraResource()!
        tweenGroup.update(time)
        renderer.render(scene, camera)
    }

    const switchView = () => {
        setView(view() === VIEW_TYPE.PLAN ? VIEW_TYPE.ELEVATION : VIEW_TYPE.PLAN)
    }

    onMount(() => {
        if (!WebGL.isWebGL2Available()) {
            toast.error(`WebGL is not available ${WebGL.getWebGL2ErrorMessage()}`, { duration: -1 })
            return
        }

        const { scene, renderer, directionalLight, ambientLight } = sceneResource()!
        const { camera } = cameraResource()!

        // Renderer
        renderer.setAnimationLoop(draw)
        renderer.setSize(window.innerWidth, window.innerHeight)

        // Lighting
        directionalLight.position.copy(STATICS.DIRECTIONAL_LIGHT.position)
        scene.add(ambientLight)
        scene.add(directionalLight)

        // Resize handler
        window.addEventListener("resize", () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        })
    })

    onCleanup(() => {
        // TODO: Cleanup material and meshes inside fsTree
        selfFsTreeResource()!.clear()
        opponentFsTreeResource()!.clear()
        cameraResource()!.cleanup()
        sceneResource()!.cleanup()
    })

    return (
        <>
            {sceneResource()!.renderer.domElement}
            <section class="absolute bottom-8 flex flex-row justify-evenly gap-8">
                <Switch>
                    <Match when={focus() === FOCUS_TYPE.NONE}>
                        <Button class="p-8" text="Focus Self" onClick={() => setFocus(FOCUS_TYPE.SELF)} />
                        <Button class="p-8" text="Focus Opponent" onClick={() => setFocus(FOCUS_TYPE.OPPONENT)} />
                    </Match>
                </Switch>
                <Show when={focus() !== FOCUS_TYPE.NONE}>
                    <Button class="p-8" text="Switch View" onClick={switchView} />
                    <Button
                        class="p-8"
                        text="Focus Back"
                        onClick={() => {
                            setFocus(FOCUS_TYPE.NONE)
                            setView(VIEW_TYPE.ELEVATION)
                        }}
                    />
                </Show>
            </section>
        </>
    )
}

export default GameBoard
