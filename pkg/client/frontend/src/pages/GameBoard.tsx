import { useParams } from "@solidjs/router"
import { VoidComponent, onMount } from "solid-js"
import toast from "solid-toast"
import NavButton from "@components/NavButton"
import { OBJECTS } from "@constants/statics"
import { PlacementPosition } from "@constants/types"
import Game from "@game/Game"
import InteractionProvider from "@providers/Interaction"
import SceneProvider from "@providers/Scene"
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
                    <InteractionProvider>
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
