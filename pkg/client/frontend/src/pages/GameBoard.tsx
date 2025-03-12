import { useParams } from "@solidjs/router"
import { Show, Switch, VoidComponent, createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { Match } from "solid-js"
import toast from "solid-toast"
import { Line, Matrix4, Mesh, Quaternion, Vector3 } from "three"
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import Button from "@components/Button"
import NavButton from "@components/NavButton"
import { ExampleFS } from "@constants/sample"
import { PLAN_CAMERA_NODE_DISTANCE, STATICS, Y_AXIS } from "@constants/statics"
import { FOCUS_TYPE, VIEW_TYPE } from "@constants/types"
import { CAMERA_TYPE, TogglingCamera } from "@game/camera"
import { createLighting } from "@game/lighting"
import { createScene } from "@game/scene"
import { Tree } from "@game/tree"
import { tweenOpacity } from "@game/tween"

// TODO: Cull whole node if it is being partially culled (https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633/5).
// TODO: Use actual FS data from native client.
// TODO: Migrate to using trackball controls with no panning.

const getFocusOpacity = (limitIdx: number, testIdx: number) => {
    switch (Math.sign(limitIdx - testIdx)) {
        case -1:
            return 0.2
        case 1:
            return 0
        case 0:
            return 1
    }

    return 1
}

const treeFocusTransform = (tree: Tree) => (mesh: Mesh | Line, level: number, idx: number) => {
    tweenOpacity(tree.tweenGroup, mesh, getFocusOpacity(level, idx))
}

const GameBoard: VoidComponent = () => {
    const { code } = useParams()

    const { scene, renderer, cleanup: sceneCleanup } = createScene()
    const { ambientLight, directionalLight, cleanup: lightingCleanup } = createLighting()

    const camera = new TogglingCamera(CAMERA_TYPE.PERSPECTIVE)
    const selfFsTree = new Tree().setFromRawData(ExampleFS, 1)
    const opponentFsTree = new Tree().setFromRawData(ExampleFS, 2)

    const [activeLevel, setActiveLevel] = createSignal(0)
    const [view, setView] = createSignal<VIEW_TYPE>(VIEW_TYPE.ELEVATION)
    const [focus, setFocus] = createSignal<FOCUS_TYPE>(FOCUS_TYPE.NONE)

    const drillDown = () => {
        const maxLevelIdx = (focus() === FOCUS_TYPE.SELF ? selfFsTree : opponentFsTree).levelCount - 1

        if (activeLevel() === maxLevelIdx) {
            return
        }

        setActiveLevel(activeLevel() + 1)
    }

    const drillUp = () => {
        if (activeLevel() === 0) {
            return
        }

        setActiveLevel(activeLevel() - 1)
    }

    const draw = (time: number = 0) => {
        camera.tweenGroup.update(time)
        selfFsTree.tweenGroup.update(time)
        opponentFsTree.tweenGroup.update(time)
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
            renderer.setSize(window.innerWidth, window.innerHeight)
        })
    })

    createEffect(() => {
        // Set position and rotation for NONE focus.
        if (focus() === FOCUS_TYPE.NONE) {
            setView(VIEW_TYPE.ELEVATION)
            selfFsTree.blurLevel()
            opponentFsTree.blurLevel()
            setActiveLevel(0)
            camera.fitToObjects(selfFsTree, opponentFsTree)
            return
        }

        const targetTree = focus() === FOCUS_TYPE.SELF ? selfFsTree : opponentFsTree

        switch (view()) {
            case VIEW_TYPE.ELEVATION: {
                targetTree.blurLevel()
                camera.fitToObjects(targetTree)
                return
            }
            case VIEW_TYPE.PLAN: {
                const position = new Vector3().addVectors(
                    targetTree.planeCenters[activeLevel()],
                    new Vector3().addScaledVector(targetTree.normal.clone().negate(), PLAN_CAMERA_NODE_DISTANCE),
                )
                const rotation = new Quaternion().setFromRotationMatrix(
                    new Matrix4().lookAt(position, targetTree.planeCenters[activeLevel()], Y_AXIS),
                )
                targetTree.focusLevel(activeLevel(), treeFocusTransform(targetTree))
                camera.animate(position, rotation)
                return
            }
        }
    })

    onCleanup(() => {
        selfFsTree.clear()
        opponentFsTree.clear()
        camera.clear()
        lightingCleanup()
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
                            }}
                        />
                        <Button
                            class="p-8"
                            text="Focus Opponent"
                            onClick={() => {
                                setFocus(FOCUS_TYPE.OPPONENT)
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
                        }}
                    />
                </Show>
            </section>
            <section class="absolute left-8 top-8 flex flex-col justify-evenly gap-8">
                <Show when={view() === VIEW_TYPE.PLAN}>
                    <Button class="p-8" text="+" onClick={drillDown} />
                    <Button class="p-8" text="-" onClick={drillUp} />
                </Show>
            </section>
            <NavButton class="pointer-events-none cursor-default" position="right" text={code} />
        </>
    )
}

export default GameBoard
