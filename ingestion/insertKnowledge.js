import { supabase } from "../db/supabaseClient.js";
import { createEmbedding } from "../rag/embed.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_DIR = path.join(__dirname, "../knowledge");

// ──── Insert a single document ────
async function insertDocument(customerId, content, metadata = {}) {
  const embedding = await createEmbedding(content);

  const { error } = await supabase.from("documents").insert([
    {
      customer_id: customerId,
      content: content,
      embedding: embedding,
      metadata: metadata
    }
  ]);

  if (error) {
    console.error(`  ❌ Failed: ${content.substring(0, 50)}...`, error.message);
    return false;
  }

  console.log(`  ✅ Inserted: ${content.substring(0, 50)}...`);
  return true;
}

// ──── Delete all documents for a customer (fresh re-ingest) ────
async function clearCustomerDocs(customerId) {
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("customer_id", customerId);

  if (error) {
    console.error(`❌ Failed to clear docs for ${customerId}:`, error.message);
    return false;
  }

  console.log(`🗑️  Cleared old documents for: ${customerId}`);
  return true;
}

// ──── Ingest knowledge for a single customer from their JSON file ────
async function ingestCustomer(customerId) {
  const filePath = path.join(KNOWLEDGE_DIR, `${customerId}.json`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Knowledge file not found: knowledge/${customerId}.json`);
    console.log(`   Create it at: ${filePath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  console.log(`\n🚀 Ingesting knowledge for: ${data.customerId}`);
  console.log(`   Documents: ${data.documents.length}\n`);

  // Clear old docs first (so re-running updates instead of duplicates)
  await clearCustomerDocs(data.customerId);

  let success = 0;
  let failed = 0;

  for (const doc of data.documents) {
    const result = await insertDocument(data.customerId, doc.content, doc.metadata || {});
    result ? success++ : failed++;
  }

  console.log(`\n✅ ${data.customerId}: ${success} inserted, ${failed} failed\n`);
}

// ──── Ingest all customers (reads all JSON files in knowledge/) ────
async function ingestAll() {
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith(".json"));

  if (files.length === 0) {
    console.log("❌ No knowledge files found in knowledge/ directory.");
    return;
  }

  console.log(`📦 Found ${files.length} customer knowledge files\n`);

  for (const file of files) {
    const customerId = path.basename(file, ".json");
    await ingestCustomer(customerId);
  }

  console.log("🎉 All customers ingested!");
}

// ──── CLI ────
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--all") {
  // No args or --all: ingest everything
  ingestAll();
} else {
  // Specific customer: node ingestion/insertKnowledge.js gym_a
  ingestCustomer(args[0]);
}