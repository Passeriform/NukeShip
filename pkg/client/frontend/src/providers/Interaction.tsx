import {
    Accessor,
    Context,
    ParentProps,
    Setter,
    createContext,
    createEffect,
    createSignal,
    mergeProps,
    on,
    onCleanup,
    onMount,
    useContext,
} from "solid-js"
import { Store, createStore } from "solid-js/store"
import { Mesh, Object3D, Raycaster, Vector2 } from "three"
import { useScene } from "./Scene"

type InteractionState<T extends Mesh> = {
    current: T | undefined
    last: T | undefined
    repeat: boolean
}

const DEFAULT_INTERACTION_STATE = {
    current: undefined,
    last: undefined,
    repeat: false,
}

type InteractionContextValue<T extends Mesh> = {
    raycaster: Raycaster
    interaction: Store<{
        hovered: InteractionState<T>
        selected: InteractionState<T>
    }>
    setRoot: Setter<Object3D | undefined>
    setFilter: Setter<(meshes: Object3D[]) => T[]>
    resetSelected: () => void
}

const InteractionContext = createContext<InteractionContextValue<Mesh>>()

type InteractionProviderProps = {
    allowEmptySelection?: Accessor<boolean>
}

const InteractionProvider = (_props: ParentProps<InteractionProviderProps>) => {
    const props = mergeProps({ allowEmptySelection: () => false }, _props)

    const raycaster = new Raycaster()

    const [interaction, setInteraction] = createStore<{
        hovered: InteractionState<Mesh>
        selected: InteractionState<Mesh>
    }>({
        hovered: { ...DEFAULT_INTERACTION_STATE },
        selected: { ...DEFAULT_INTERACTION_STATE },
    })
    const [root, setRoot] = createSignal<Object3D | undefined>(undefined)
    const [filter, setFilter] = createSignal((objects: Object3D[]) =>
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Explicit cast to mesh to check static property.
        objects.filter((object) => (object as Mesh).isMesh).map((object) => object as Mesh),
    )

    const { camera } = useScene()

    const testNextInteraction = (event: MouseEvent) => {
        if (!root()) {
            return undefined
        }

        raycaster.setFromCamera(
            new Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1),
            camera,
        )

        const intersects = raycaster.intersectObjects([root()!], true)

        const [matched] = filter()(intersects.map((intersection) => intersection.object))

        return matched
    }

    const setHovered = (next: Mesh | undefined) => {
        if (!root()) {
            return
        }

        if (next === interaction.hovered.current) {
            setInteraction("hovered", "repeat", true)
            return
        }

        setInteraction("hovered", { current: next, repeat: false, last: interaction.hovered.current })
    }

    const setSelected = (next: Mesh | undefined) => {
        if (!root()) {
            return
        }

        if (next === interaction.selected.current) {
            setInteraction("selected", "repeat", true)
            return
        }

        if (next === undefined && !props.allowEmptySelection()) {
            return
        }

        setInteraction("selected", { current: next, repeat: false, last: interaction.selected.current })
    }

    const resetSelected = () => {
        setInteraction("selected", {
            current: undefined,
            repeat: false,
            last: interaction.selected.current,
        })
    }

    const onHover = (event: MouseEvent) => {
        if (!root()) {
            return
        }

        setHovered(testNextInteraction(event))
    }

    const onClick = (event: MouseEvent) => {
        if (!root()) {
            return
        }

        setSelected(testNextInteraction(event))
    }

    createEffect(
        on([() => interaction.selected.current], () => {
            setInteraction("hovered", "last", undefined)
        }),
    )

    onMount(() => {
        window.addEventListener("mousemove", onHover)
        window.addEventListener("click", onClick)
    })

    onCleanup(() => {
        window.removeEventListener("mousemove", onHover)
        window.removeEventListener("click", onClick)
    })

    return (
        <InteractionContext.Provider value={{ interaction, raycaster, resetSelected, setRoot, setFilter }}>
            {props.children}
        </InteractionContext.Provider>
    )
}

export const useInteraction = <T extends Mesh>() => {
    const context = useContext<InteractionContextValue<T> | undefined>(
        InteractionContext as Context<InteractionContextValue<T> | undefined>,
    )

    if (!context) {
        throw new Error("useInteraction must be used within an InteractionProvider")
    }

    return {
        interaction: context.interaction,
        resetSelected: context.resetSelected,
        setRoot: context.setRoot,
        setFilter: context.setFilter,
    }
}

export default InteractionProvider
