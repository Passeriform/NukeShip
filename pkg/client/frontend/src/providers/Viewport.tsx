import { ParentComponent, createContext, createEffect, on, useContext } from "solid-js"
import { SetStoreFunction, createStore } from "solid-js/store"
import { ViewType } from "@constants/types"

type ViewportState = {
    birdsEye: boolean
    view: ViewType
}

type ViewportContextValue = {
    viewport: ViewportState
    setViewport: SetStoreFunction<ViewportState>
}

const ViewportContext = createContext<ViewportContextValue>()

const ViewportProvider: ParentComponent = (props) => {
    const [viewport, setViewport] = createStore<ViewportState>({
        birdsEye: false,
        view: ViewType.PLAN,
    })

    createEffect(
        on([() => viewport.birdsEye], () => {
            setViewport("view", ViewType.ELEVATION)
        }),
    )

    return (
        <ViewportContext.Provider
            value={{
                viewport,
                setViewport,
            }}
        >
            {props.children}
        </ViewportContext.Provider>
    )
}

export const useViewport = () => {
    const viewportContext = useContext(ViewportContext)

    if (!viewportContext) {
        throw new Error("useViewport must be used within a ViewportProvider")
    }

    return viewportContext
}

export default ViewportProvider
