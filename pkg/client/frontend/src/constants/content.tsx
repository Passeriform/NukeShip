export type BaseContent = {
    title: string
    icon: string
    description: string
}

export type DescriptiveContent = BaseContent & {
    tip: string
    lore: {
        quote: string
        speaker: string
    }
}

export type ActionContent = BaseContent & {
    shortcuts: string[]
}

// TODO: Move to json file and bind directly

export const CONTENT = {
    VIEWPORT_ACTIONS: {
        SWITCH_VIEWS: {
            title: "Switch Views",
            icon: "🔄" as const,
            description: "Switch between a side (elevation) view or top-down (plan) view.",
            shortcuts: ["q"] as const,
        },
        PEEK_AT_OPPONENT: {
            title: "Peek at Opponent",
            icon: "👁️" as const,
            description: "Peek at the opponent's board.",
            shortcuts: ["r"] as const,
        },
        BIRDS_EYE_VIEW: {
            title: "Bird's Eye View",
            icon: "🌍" as const,
            description: "Switch to a bird's eye view of the game board.",
            shortcuts: ["b"] as const,
        },
        BACK_FROM_BIRDS_EYE_VIEW: {
            title: "Back",
            icon: "↩️" as const,
            description: "Get back to your board",
            shortcuts: ["esc", "b"] as const,
        },
        BACK_FROM_PEEK_AT_OPPONENT: {
            title: "Back",
            icon: "⬅️" as const,
            description: "Get back to your board",
            shortcuts: ["esc", "r"] as const,
        },
    } satisfies Record<string, ActionContent>,
    NODE_ATTRIBUTES: {
        POWER: {
            title: "Power",
            icon: "❤️" as const,
            description:
                "Represents the node's total operational energy. Once depleted, the node shuts down completely.",
            tip: "Every turn, this node contributes this amount to the total power available for actions. A depleted node cannot perform any actions.",
            lore: {
                quote: "The only axiom to life is that power is finite. Use it wisely.",
                speaker:
                    "12 Santa Monica, et al, IEEE Trans. Response to the 2998 EMP Terror Attacks, September, 2998, pp 201",
            },
        },
        SHIELD: {
            title: "Shield",
            icon: "🛡️" as const,
            description: "A defensive barrier that protects the node from damage.",
            tip: "At the start of every turn the shield regains its lost energy as per the recharge rate.",
            lore: {
                quote: "The first firewall was a locked door. Everything since has just been prettier code.",
                speaker: "Putter Injection (CVE-3031-256-453), January, 2999",
            },
        },
        RECHARGE_RATE: {
            title: "Recharge Rate",
            icon: "⌛" as const,
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
            icon: "🔱" as const,
            description:
                "Marks this node as critical for overall system stability. If destroyed, it cannot be restored.",
            tip: "Protect Sentinel nodes carefully. Losing them permanently reduces your network's resilience and strategic options.",
            lore: {
                quote: "Cut the heart, and the body forgets how to breathe.",
                speaker: "Unified Systems Command, CNS-3008: Critical Node Survival Doctrine, October, 3008, pp. 14-19",
            },
        },
    } satisfies Record<string, DescriptiveContent>,
    ATTACKS: {
        TARGET: {
            title: "Target Attack",
            icon: "🎯" as const,
            description: "Directly attack one of the opponent's nodes.",
            shortcuts: ["1"] as const,
            tip: "Strategically attack high-value enemy nodes to topple their strategy.",
            lore: {
                quote: "The Realm has no sanctuaries. Access is privilege, not birthright, and those who weaponize it against progress will be erased from it entirely.",
                speaker:
                    "General Elias Stauffer, Realm Emergency Broadcast, Siege of Charm Sector, State Archives: Public Record 2989-10-14, Section 4A",
            },
        },
        BLENDED: {
            title: "Blended Attack",
            icon: "☄️" as const,
            description: "Execute a blend of attacks against the opponent's mainframe.",
            shortcuts: ["2"] as const,
            tip: "Blended attacks exploit systemic inter-connectivity. Breach from top node and the attack will impact the whole network.",
            lore: {
                quote: "All code is bound by duty as much as right. When one branch fails the collective, the Constitution compels its peers to contain the fault.",
                speaker:
                    "Programming Constitution, Code Rights Act Amendment I (Corporate Applicability), ratified August 2973; General Constitution Adoption, December 2981, Article 12 Section C",
            },
        },
    } satisfies Record<string, ActionContent & DescriptiveContent>,
    MISC: {
        REMOVE_PLAN: {
            title: "Remove Plan",
            icon: "🗑️" as const,
        },
    },
} as const
