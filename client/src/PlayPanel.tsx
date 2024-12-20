import styles from "./play-panel.module.css"
import Button from "./components/Button"

const GAME_TYPE = {
    REGULAR: "Regular",
    SIEGE: "Siege",
}

const PlayPanel = () => {
    return (
        <section class={styles.container}>
            <section class={`${styles.panel} ${styles.left}`}>
                <select>
                    {Object.entries(GAME_TYPE).map(([type, text]) => <option value={type}>{text}</option>)}
                </select>
                <Button text="Create Room" />
            </section>
            <div class={styles.divider} />
            <section class={`${styles.panel} ${styles.left}`}>
                <input maxLength={5} placeholder="Code"/>
                <Button text="Join Room" />
            </section>
        </section>
    )
}

export default PlayPanel
