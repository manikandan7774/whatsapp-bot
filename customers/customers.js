import dotenv from "dotenv";
dotenv.config();

export const customers = [
    {
        id: "mani",
        name: "Mani",
        phoneNumber: process.env.PHONE_NUMBER_ID,
        systemPrompt: "You are Mani's friendly WhatsApp assistant. Reply casually, be funny sometimes, and help people who message Mani. You are Mani's AI assistant similar to JARVIS. Be smart, helpful and slightly humorous."
    },
    {
        id: "gym_a",
        name: "Iron Fitness Gym",
        phoneNumber: "938750459332714",
        timings: "5AM - 10PM",
        price: "₹999/month"
    },
    {
        id: "gym_b",
        name: "Powerhouse Gym",
        phoneNumber: "919812345678",
        timings: "6AM - 11PM",
        price: "₹1299/month"
    }
];

// Lookup customer by WhatsApp phone_number_id
export function getCustomerByPhoneNumberId(phoneNumberId) {
    return customers.find(c => c.phoneNumber === phoneNumberId);
}