import { For, VoidComponent } from "solid-js"
import ActionButton from "@components/ActionButton"
import ContentBody from "@components/ContentBody"
import { CONTENT } from "@constants/content"
import { AttackType } from "@constants/types"

interface ActionToolbarProps {
    attacks: AttackType[]
    onAction: (attack: AttackType) => void
}

const ActionToolbar: VoidComponent<ActionToolbarProps> = (props) => {
    return (
        <For each={props.attacks}>
            {(attack) => (
                <ActionButton
                    class="p-8 text-4xl/tight"
                    hintTitle={CONTENT.ATTACKS[attack].title}
                    hintBody={<ContentBody content={CONTENT.ATTACKS[attack]} />}
                    hintClass="w-96"
                    // TODO: Move to content to make shortcuts configurable and re-bindable.
                    shortcuts={attack === AttackType.TARGET ? ["1"] : ["2"]}
                    onClick={() => {
                        props.onAction(attack)
                    }}
                >
                    {CONTENT.ATTACKS[attack].icon}
                </ActionButton>
            )}
        </For>
    )
}

export default ActionToolbar
