import { DescriptiveContent } from "@constants/content"

type DescriptionProps = {
    content: DescriptiveContent
}

const Description = (props: DescriptionProps) => {
    return (
        <section>
            <p class="mt-2">{props.content.description}</p>
            <p class="mt-2 italic text-gray-300">{props.content.tip}</p>
            <blockquote class="mt-4 border-l-4 border-gray-600 pl-4 italic">
                "{props.content.lore.quote}"<br />
                <span class="italic">~ {props.content.lore.speaker}</span>
            </blockquote>
        </section>
    )
}

export default Description
