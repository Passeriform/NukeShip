import styles from "./splash.module.css"

const Splash = () => {
    return (
        <section class={styles.container}>
            <h1 class={`${styles.title} ${styles.glitch} ${styles.layers}`} data-text="NUKESHIP"><span>NUKESHIP</span></h1>
        </section>
    )
}

export default Splash
