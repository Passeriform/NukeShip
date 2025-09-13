import InteractionProvider from "@passeriform/solid-fiber-interaction"
import SceneProvider from "@passeriform/solid-fiber-scene"
import { useParams } from "@solidjs/router"
import { VoidComponent, onMount } from "solid-js"
import toast from "solid-toast"
import { Object3D } from "three"
import NavButton from "@components/NavButton"
import { OBJECTS } from "@constants/statics"
import { PlacementPosition } from "@constants/types"
import Game from "@game/Game"
import { Sapling } from "@game/tree"
import ViewportProvider from "@providers/Viewport"

// TODO: Cull whole node if it is being partially culled (https://discourse.threejs.org/t/how-to-do-frustum-culling-with-instancedmesh/22633/5).
// TODO: Use actual FS data from native client.

const GameBoard: VoidComponent = () => {
    const { code } = useParams()

    const onWebGLError = (errorDiv: HTMLDivElement) =>
        toast.error(<>WebGL is not available {errorDiv}</>, { duration: -1 })

    onMount(() => {
        window.addEventListener("contextmenu", (event) => {
            event.preventDefault()
        })
    })

    return (
        <>
            <SceneProvider
                onWebGLError={onWebGLError}
                ambientLightColor={0x193751}
                directionalLightPosition={OBJECTS.DIRECTIONAL_LIGHT.position}
            >
                <ViewportProvider>
                    <InteractionProvider
                        filter={(meshes: Object3D[]) =>
                            meshes
                                .filter((mesh) => mesh.userData["ignoreRaycast"] !== true)
                                .filter((mesh) => mesh.name === Sapling.MESH_NAME) as Sapling[]
                        }
                        allowEmptySelection={false}
                    >
                        <Game />
                    </InteractionProvider>
                </ViewportProvider>
            </SceneProvider>
            <NavButton position={PlacementPosition.RIGHT} class="pointer-events-none cursor-default" disabled>
                {code}
            </NavButton>
        </>
    )
}

export default GameBoard
