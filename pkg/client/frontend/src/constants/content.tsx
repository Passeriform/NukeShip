export const CONTENT = {
    POWER: {
        title: "Power",
        icon: "❤︎",
        description: "Represents the node's total operational energy. Once depleted, the node shuts down completely.",
        tip: "Every turn, this node contributes this amount to the total power available for actions. A depleted node cannot perform any actions.",
        lore: {
            quote: "The only axiom to life is that power is finite. Use it wisely.",
            speaker:
                "12 Santa Monica, et al, IEEE Trans. Response to the 2998 EMP Terror Attacks, September, 2998, pp 201",
        },
    },
    SHIELD: {
        title: "Shield",
        icon: "⛊",
        description: "A defensive barrier that protects the node from damage.",
        tip: "At the start of every turn the shield regains its lost energy as per the recharge rate.",
        lore: {
            quote: "The first firewall was a locked door. Everything since has just been prettier code.",
            speaker: "Putter Injection (CVE-3031-256-453), January, 2999",
        },
    },
    RECHARGE_RATE: {
        title: "Recharge Rate",
        icon: "ⴵ",
        description: "Determines how quickly the node's shield recovers.",
        tip: "Use better redundancy strategies to increase the recharge rate of your shield.",
        lore: {
            quote: "feat: faster. always faster. the clock cycle won't wait, so why should you?",
            speaker:
                "@PlasticFissile/QuantumChronos v17 commit message, breakthrough in clock cycle skip computation, November, 3001",
        },
    },
    SENTINEL: {
        title: "Sentinel",
        icon: "𓆩✧𓆪",
        description: "Marks this node as critical for overall system stability. If destroyed, it cannot be restored.",
        tip: "Protect Sentinel nodes carefully. Losing them permanently reduces your network's resilience and strategic options.",
        lore: {
            quote: "Cut the heart, and the body forgets how to breathe.",
            speaker: "Unified Systems Command, CNS-3008: Critical Node Survival Doctrine, October, 3008, pp. 14-19",
        },
    },
} as const
