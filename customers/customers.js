export const customers = [
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