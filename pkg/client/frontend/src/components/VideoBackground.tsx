import { VoidComponent } from "solid-js"

interface VideoBackgroundProps {
    src: string
}

const VideoBackground: VoidComponent<VideoBackgroundProps> = (props) => {
    return (
        <div class="absolute inset-0 -z-10 h-full w-full overflow-hidden">
            <video preload="auto" autoplay loop muted class="aspect-auto w-full blur-sm brightness-50 -hue-rotate-45">
                <source src={props.src} type="video/mp4" />
            </video>
        </div>
    )
}

export default VideoBackground
