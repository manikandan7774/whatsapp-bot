import express from "express";
import { retrieveDocs } from "./rag/retrieveDocs.js";
import { getAIReply } from "./services/aiService.js";
import { sendMessage } from "./services/whatsappService.js";
import { getCustomerByPhoneNumberId } from "./customers/customers.js";

const app = express();

app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my-verify-token";
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
});

app.post("/webhook", async (req, res) => {
  try {
    // Check if the webhook request is valid WhatsApp data
    if (req.body.object !== "whatsapp_business_account") {
      return res.sendStatus(404);
    }

    const value = req.body.entry?.[0]?.changes?.[0]?.value;

    // Acknowledge non-message webhooks early (like status updates)
    if (!value || !value.messages || !value.messages[0]) {
      return res.sendStatus(200);
    }

    const message = value.messages[0];

    // Only process text messages (ignore images, etc. for now)
    if (message.type !== "text" || !message.text?.body) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text.body;

    // Safely retrieve phone number ID
    const phoneNumberId = value.metadata?.phone_number_id;

    if (!phoneNumberId) {
      console.log("No phone number ID found in metadata");
      return res.sendStatus(200);
    }

    // Find customer
    const customer = getCustomerByPhoneNumberId(phoneNumberId);

    if (!customer) {
      console.log(`Customer not found for phone number ID: ${phoneNumberId}`);
      return res.sendStatus(200);
    }

    console.log("Customer:", customer.name);
    console.log("User message:", text);

    // RAG retrieval
    const docs = await retrieveDocs(customer.id, text);

    // Determine prompt based on whether customer has a custom one
    const basePrompt = customer.systemPrompt || `You are a helpful assistant for ${customer.name}.\nBe concise, friendly, and professional.\nAnswer questions based ONLY on the following knowledge. If the answer is not in the knowledge, politely say you don't have that information.`;

    const systemPrompt = `${basePrompt}

Knowledge:
${docs.join("\n")}`;

    const reply = await getAIReply(systemPrompt, text);

    await sendMessage(from, reply);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Still return 200 so WhatsApp doesn't keep retrying the message indefinitely
    return res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});