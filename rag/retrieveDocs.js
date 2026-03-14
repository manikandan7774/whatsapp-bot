import { supabase } from "../db/supabaseClient.js";
import { createEmbedding } from "./embed.js";

export async function retrieveDocs(customerId, query) {

    const embedding = await createEmbedding(query);

    const { data, error } = await supabase.rpc("match_documents", {
        query_embedding: embedding,
        match_customer: customerId,
        match_count: 3
    });

    if (error) {
        console.error(error);
        return [];
    }

    return data.map(d => d.content);
}