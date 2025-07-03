import { CONTENT } from "@constants/content"

interface ContentBodyProps {
    content: (typeof CONTENT)[keyof typeof CONTENT]
}

export const ContentBody = ({ content }: ContentBodyProps) => {
    return (
        <section>
            <p class="mt-2">{content.description}</p>
            <p class="mt-2 italic text-gray-300">{content.tip}</p>
            <blockquote class="mt-4 border-l-4 border-gray-600 pl-4 italic">
                "{content.lore.quote}"<br />
                <span class="italic">~ {content.lore.speaker}</span>
            </blockquote>
        </section>
    )
}
