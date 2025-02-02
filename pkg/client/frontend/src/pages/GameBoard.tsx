import { useParams } from "@solidjs/router"
import { Show, Switch, VoidComponent, createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { Match } from "solid-js"
import toast from "solid-toast"
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import Button from "@components/Button"
import { ExampleFS } from "@constants/sample"
import { FOCUS_STATICS, STATICS } from "@constants/statics"
import { FOCUS_TYPE, VIEW_TYPE } from "@constants/types"
import { createCamera } from "@game/camera"
import { createLighting } from "@game/lighting"
import { createScene } from "@game/scene"
import { generateObjectTree } from "@game/tree"
import { tweenObject } from "@game/tween"

// TODO: Cull whole node if it is being partially culled (https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633/5).

const GameBoard: VoidComponent = () => {
    const { code } = useParams()

    const { scene, renderer, cleanup: sceneCleanup } = createScene()
    const { ambientLight, directionalLight, cleanup: lightingCleanup } = createLighting()
    const { camera, tweenGroup, cleanup: cameraCleanup } = createCamera()

    const selfFsTree = generateObjectTree(ExampleFS, 1, 2)
    const opponentFsTree = generateObjectTree(ExampleFS, 1, 1)

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

    const draw = (time: number = 0) => {
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
