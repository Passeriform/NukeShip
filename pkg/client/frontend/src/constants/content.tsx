import { RecursiveRecord } from "./types"

export type Content = {
    title: string
    icon: string
    description: string
    tip: string
    lore: {
        quote: string
        speaker: string
    }
}

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
            quote: "fuck stable ABI, broke a few things, sorry, not sorry :P",
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
    ATTACKS: {
        DIRECT: {
            title: "Direct Attack",
            icon: "🎯",
            description: "Directly attack one of the opponent's nodes.",
            tip: "Strategically attack high-value enemy nodes to topple their strategy.",
            lore: {
                quote: "The Realm has no sanctuaries. Access is privilege, not birthright, and those who weaponize it against progress will be erased from it entirely.",
                speaker:
                    "General Elias Stauffer, Realm Emergency Broadcast, Siege of Charm Sector, State Archives: Public Record 2989-10-14, Section 4A",
            },
        },
        PIPELINE: {
            title: "Pipeline Attack",
            icon: "🔱",
            description: "Execute a chain strike against the opponent's mainframe.",
            tip: "Pipeline attacks exploit systemic inter-connectivity. Breach from top node and the attack will impact the whole network.",
            lore: {
                quote: "All code is bound by duty as much as right. When one branch fails the collective, the Constitution compels its peers to contain the fault.",
                speaker:
                    "Programming Constitution, Code Rights Act Amendment I (Corporate Applicability), ratified August 2973; General Constitution Adoption, December 2981, Article 12 Section C",
            },
        },
    },
} as const satisfies RecursiveRecord<string, Content>
