import { useParams } from "@solidjs/router"
import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Show, Switch, VoidComponent, createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { Match } from "solid-js"
import toast from "solid-toast"
import { Line, Mesh } from "three"
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import Button from "@components/Button"
import NavButton from "@components/NavButton"
import { ExampleFS } from "@constants/sample"
import { STATICS } from "@constants/statics"
import { FocusType } from "@constants/types"
import { ArchControls, ViewType } from "@game/archControls"
import { createOrthographicCamera, createPerspectiveCamera } from "@game/camera"
import { createLighting } from "@game/lighting"
import { createScene } from "@game/scene"
import { TargetControls } from "@game/targetControls"
import { Tree } from "@game/tree"
import { tweenOpacity } from "@game/tween"

// TODO: Cull whole node if it is being partially culled (https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633/5).
// TODO: Use actual FS data from native client.

const GameBoard: VoidComponent = () => {
    const { code } = useParams()

    const { scene, renderer, cleanup: sceneCleanup } = createScene()
    const { ambientLight, directionalLight, cleanup: lightingCleanup } = createLighting()

    const [isCameraPerspective, _setIsCameraPerspective] = createSignal(true)
    const camera = isCameraPerspective() ? createPerspectiveCamera() : createOrthographicCamera()
    const archControls = new ArchControls([], ViewType.ELEVATION, camera)
    const targetControls = new TargetControls([], camera)

    const selfFsTree = new Tree().setFromRawData(ExampleFS, 1)
    const opponentFsTree = new Tree().setFromRawData(ExampleFS, 2)

    const [activeLevel, setActiveLevel] = createSignal(0)
    const [view, setView] = createSignal<ViewType>(ViewType.ELEVATION)
    const [focus, setFocus] = createSignal<FocusType>(FocusType.NONE)

    const disableContextMenu = (event: MouseEvent) => {
        event.preventDefault()
    }

    const getFocusOpacity = (testIdx: number) => {
        if (view() !== ViewType.PLAN || activeLevel() === undefined) {
            return 1
        }

        switch (Math.sign(activeLevel() - testIdx)) {
            case -1:
                return 0.2
            case 1:
                return 0
            case 0:
                return 1
        }

        return 1
    }

    const treeFocusTransform = (mesh: Mesh | Line, idx: number, tweenGroup: TweenGroup) => {
        tweenOpacity(tweenGroup, mesh, getFocusOpacity(idx))
    }

    // TODO: Move into PLAN view for arch controls.
    const drillDown = () => {
        const maxLevelIdx = (focus() === FocusType.SELF ? selfFsTree : opponentFsTree).levelCount - 1

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
        archControls.update(time)
        targetControls.update(time)
        selfFsTree.update(time)
        opponentFsTree.update(time)
        renderer.render(scene, camera)
    }

    onMount(() => {
        if (!WebGL.isWebGL2Available()) {
            toast.error(`WebGL is not available ${WebGL.getWebGL2ErrorMessage()}`, { duration: -1 })
            return
        }

        // Renderer
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setAnimationLoop(draw)

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

        window.addEventListener("contextmenu", disableContextMenu)
        // Resize handler
        window.addEventListener("resize", () => {
            renderer.setSize(window.innerWidth, window.innerHeight)
        })
    })

    createEffect(() => {
        // Set position and rotation for NONE focus.
        if (focus() === FocusType.NONE) {
            setView(ViewType.ELEVATION)
            selfFsTree.traverseLevelOrder(treeFocusTransform)
            opponentFsTree.traverseLevelOrder(treeFocusTransform)
            setActiveLevel(0)
            archControls.setTargets([selfFsTree, opponentFsTree], ViewType.ELEVATION)
            targetControls.enabled = false
            targetControls.setTargets([])
            return
        }

        const targetTree = focus() === FocusType.SELF ? selfFsTree : opponentFsTree
        targetTree.traverseLevelOrder(treeFocusTransform)

        // TODO: Add targeting in plan mode as well. Pass the forward vector to controls along with targets.
        targetControls.enabled = true
        targetControls.setTargets([targetTree])

        switch (view()) {
            case ViewType.ELEVATION: {
                archControls.setTargets([targetTree], ViewType.ELEVATION)
                return
            }
            case ViewType.PLAN: {
                archControls.setTargets(targetTree.levels[activeLevel()], ViewType.PLAN)
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

        window.removeEventListener("contextmenu", disableContextMenu)
    })

    return (
        <>
            {renderer.domElement}
            <section class="absolute bottom-8 flex flex-row justify-evenly gap-8">
                <Switch>
                    <Match when={focus() === FocusType.NONE}>
                        <Button
                            class="p-8"
                            text="Focus Self"
                            onClick={() => {
                                setFocus(FocusType.SELF)
                            }}
                        />
                        <Button
                            class="p-8"
                            text="Focus Opponent"
                            onClick={() => {
                                setFocus(FocusType.OPPONENT)
                            }}
                        />
                    </Match>
                </Switch>
                <Show when={focus() !== FocusType.NONE}>
                    <Button
                        class="p-8"
                        text="Switch View"
                        onClick={() => {
                            setView(view() === ViewType.PLAN ? ViewType.ELEVATION : ViewType.PLAN)
                        }}
                    />
                    <Button
                        class="p-8"
                        text="Focus Back"
                        onClick={() => {
                            setFocus(FocusType.NONE)
                        }}
                    />
                </Show>
            </section>
            <section class="absolute left-8 top-8 flex flex-col justify-evenly gap-8">
                <Show when={view() === ViewType.PLAN}>
                    <Button class="p-8" text="+" onClick={drillDown} />
                    <Button class="p-8" text="-" onClick={drillUp} />
                </Show>
            </section>
            <NavButton class="pointer-events-none cursor-default" position="right" text={code} />
        </>
    )
}

export default GameBoard
