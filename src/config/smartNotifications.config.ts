export interface SmartMessage {
    id: string;
    title: string;
    text: string;
    screen: 'DISCOVER' | 'NEARBY';
}

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface SmartNotificationConfig {
    [key: string]: { // TimeSlot
        male: SmartMessage[];
        female: SmartMessage[];
    }
}

export const SMART_NOTIFICATION_MESSAGES: SmartNotificationConfig = {
    morning: {
        male: [
            { id: 'm_m_1', title: "Morning Vibes ☀️", text: "Start your morning by meeting someone new!", screen: 'DISCOVER' },
            { id: 'm_m_2', title: "Ready to Match?", text: "Someone perfect might be waiting for you today.", screen: 'NEARBY' },
        ],
        female: [
            { id: 'm_f_1', title: "Good Morning! ✨", text: "New people are waiting to meet you. See who's up!", screen: 'DISCOVER' },
            { id: 'm_f_2', title: "Morning Discovery", text: "Check out who's nearby this morning!", screen: 'NEARBY' },
        ]
    },
    afternoon: {
        male: [
            { id: 'a_m_1', title: "Quick Break? ☕", text: "Take a break and see who's around!", screen: 'NEARBY' },
            { id: 'a_m_2', title: "Refresh Your Day", text: "New profiles added! Go check them out.", screen: 'DISCOVER' },
        ],
        female: [
            { id: 'a_f_1', title: "Afternoon Match", text: "Someone special might be close by right now.", screen: 'NEARBY' },
            { id: 'a_f_2', title: "Explore Now 💖", text: "Explore new matches this afternoon!", screen: 'DISCOVER' },
        ]
    },
    evening: {
        male: [
            { id: 'e_m_1', title: "Evening Plans? 🌹", text: "Evening is the best time for a date! See who's free.", screen: 'NEARBY' },
            { id: 'e_m_2', title: "Top Picks Tonight", text: "Don't miss out on tonight's top matches! ✨", screen: 'DISCOVER' },
        ],
        female: [
            { id: 'e_f_1', title: "Someone Special? ✨", text: "Plan your evening with someone special.", screen: 'NEARBY' },
            { id: 'e_f_2', title: "Tonight's the Night", text: "Check your matches before the day ends!", screen: 'DISCOVER' },
        ]
    },
    night: {
        male: [
            { id: 'n_m_1', title: "Late Night Discovery 🌙", text: "Winding down? See who else is awake!", screen: 'NEARBY' },
            { id: 'n_m_2', title: "Sweet Dreams? 😴", text: "One last check before bed? Your match is waiting.", screen: 'DISCOVER' },
        ],
        female: [
            { id: 'n_f_1', title: "Moonlight Magic ✨", text: "Dreams start with a great match. See who's online.", screen: 'NEARBY' },
            { id: 'n_f_2', title: "Night Owl? 🦉", text: "Check out late night profiles before you sleep!", screen: 'DISCOVER' },
        ]
    }
};

export const INACTIVE_MESSAGES = {
    short: { // 3-5 days
        title: "We Miss You! 💖",
        text: "Come back and see what's new in your area.",
        screen: 'DISCOVER' as const
    },
    medium: { // 5-7 days
        title: "Things are Heating Up! 🔥",
        text: "A lot has happened since you've been away. Check it out!",
        screen: 'NEARBY' as const
    },
    long: { // 7+ days
        title: "Don't Give Up on Love ✨",
        text: "Your perfect match is still waiting. Don't let them wait too long!",
        screen: 'DISCOVER' as const
    }
};
