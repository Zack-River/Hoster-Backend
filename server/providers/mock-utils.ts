export function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  let state = Math.abs(hash) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function randomInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const FIRST_NAMES = [
  "James", "Maria", "Yuki", "Hans", "Sophie", "Carlos",
  "Anna", "Pierre", "Elena", "David", "Mei", "Omar",
  "Lucia", "Henrik", "Priya", "Marco", "Ingrid", "Liam",
];

const LAST_NAMES = [
  "Smith", "Garcia", "Tanaka", "Mueller", "Dubois", "Silva",
  "Johnson", "Lee", "Petrov", "Anderson", "Chen", "Williams",
  "Rossi", "Larsson", "Patel", "Rodriguez", "Taylor", "Brown",
];

export function randomGuestName(rng: () => number): string {
  return `${pickRandom(FIRST_NAMES, rng)} ${pickRandom(LAST_NAMES, rng)}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

const MESSAGE_TEMPLATES = {
  inbound: [
    "Hi! I'm excited about my upcoming stay. Could you share the check-in instructions?",
    "Is early check-in possible? We'll be arriving around noon.",
    "Do you have parking available at the property?",
    "What's the Wi-Fi password? We'd like to get some work done.",
    "Thanks for hosting us! The place looks great in the photos.",
    "Is there a grocery store nearby? We'd like to cook some meals.",
    "Can we bring our small dog? He's very well-behaved.",
    "What time is check-out? We might need a late check-out.",
    "We had a wonderful stay, thank you so much!",
    "The kitchen was so well-equipped. We really enjoyed cooking there.",
  ],
  outbound: [
    "Welcome! Check-in is at 3 PM. I'll send you the door code the day before.",
    "Of course, early check-in might be available. Let me check and get back to you.",
    "Yes, we have free parking in the driveway for up to 2 cars.",
    "The Wi-Fi details are on the fridge. Network: HomeGuest, Password: welcome2024",
    "Thank you for your kind words! Please don't hesitate to reach out if you need anything.",
    "There's a great supermarket just a 5-minute walk from the apartment.",
  ],
};

export function randomMessage(direction: "INBOUND" | "OUTBOUND", rng: () => number): string {
  const pool = direction === "INBOUND" ? MESSAGE_TEMPLATES.inbound : MESSAGE_TEMPLATES.outbound;
  return pickRandom(pool, rng);
}
