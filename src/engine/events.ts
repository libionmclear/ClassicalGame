// Crossroads events — historical dilemma cards with two real choices, each with
// genuine precedent and a real trade-off. Effects are pure data so the engine
// can apply them deterministically.

export interface EventEffects {
  gold?: number;
  production?: number;
  science?: number;
  /** Added to each owned city's growth food. */
  food?: number;
  /** Unit type spawned at the capital. */
  spawnUnit?: string;
}

export interface EventOption {
  label: string;
  outcome: string;
  effects: EventEffects;
}

export interface CrossroadsEvent {
  id: string;
  title: string;
  situation: string;
  options: [EventOption, EventOption];
}

export const EVENTS: CrossroadsEvent[] = [
  {
    id: "gracchi",
    title: "The Gracchi and the Land",
    situation:
      "Tribunes demand farmland for landless veterans, defying the Senate. (Rome, 133 BC — the reform that lit a century of strife.)",
    options: [
      {
        label: "Grant the land reform",
        outcome: "Veterans settle new farms. The people cheer; the nobles seethe.",
        effects: { production: 18, gold: -25 }
      },
      {
        label: "Side with the Senate",
        outcome: "Order holds and the treasury swells, but resentment festers.",
        effects: { gold: 32, science: -15 }
      }
    ]
  },
  {
    id: "grain-fleet",
    title: "The Grain Fleet Falters",
    situation:
      "Storms delay the grain ships from Alexandria and the city grows hungry. Bread or coin?",
    options: [
      {
        label: "Open the public granaries",
        outcome: "Bread for the people — the stores empty but the city thrives.",
        effects: { food: 8, gold: -15 }
      },
      {
        label: "Ration and sell the surplus",
        outcome: "Coin fills the coffers; the mob grumbles at the queues.",
        effects: { gold: 28, production: -8 }
      }
    ]
  },
  {
    id: "philosopher",
    title: "A Philosopher at the Gates",
    situation:
      "A renowned teacher offers to found a school of rhetoric and natural philosophy in your city.",
    options: [
      {
        label: "Endow the academy",
        outcome: "Minds are sharpened; discoveries follow.",
        effects: { science: 32, gold: -22 }
      },
      {
        label: "Send him on his way",
        outcome: "Tradition preserved, purse intact.",
        effects: { gold: 16 }
      }
    ]
  },
  {
    id: "mercenaries",
    title: "Mercenaries for Hire",
    situation:
      "A hardened band of spearmen offers their service — for a price. Sacred bands and hired spears fought in every ancient war.",
    options: [
      {
        label: "Hire the spearmen",
        outcome: "Fresh spears muster at your capital.",
        effects: { spawnUnit: "spearman", gold: -28 }
      },
      {
        label: "Refuse and keep the coin",
        outcome: "You keep your gold and your independence.",
        effects: { gold: 14 }
      }
    ]
  },
  {
    id: "games",
    title: "Games for the People",
    situation:
      "The crowd clamors for festival games in the forum. Bread and circuses buy loyalty — at a cost.",
    options: [
      {
        label: "Fund lavish games",
        outcome: "The crowd roars your name; workshops hum with new energy.",
        effects: { gold: -20, production: 12 }
      },
      {
        label: "Hold a modest festival",
        outcome: "A quiet celebration; savings kept.",
        effects: { gold: 8 }
      }
    ]
  }
];

export function getEvent(id: string): CrossroadsEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}
