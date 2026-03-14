import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function createEmbedding(text) {
  try {

    const response = await axios.post(
      "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction",
      {
        inputs: text
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const embedding = response.data;

    // sometimes HuggingFace returns nested arrays
    return Array.isArray(embedding[0]) ? embedding[0] : embedding;

  } catch (error) {

    console.log("Embedding API error:", error.response?.data || error.message);
    throw error;

  }
}