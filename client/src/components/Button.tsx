import { ParentProps } from "solid-js"

const Button = ({ text }: ParentProps<{ text: string }>) => {
    return (
        <button>
            <span />
            {text}
        </button>
    )
}

export default Button
