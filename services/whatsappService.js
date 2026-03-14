import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function sendMessage(to, message) {

    const url = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;

    await axios.post(
        url,
        {
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: { body: message }
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        }
    );
}