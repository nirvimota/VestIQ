// newsCron.js
// Wire this into your existing Express + Socket.IO backend.
// Requires: npm install node-cron axios groq-sdk @supabase/supabase-js

import cron from "node-cron";
import axios from "axios";
import crypto from "crypto";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role — this runs server-side only
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const FINNHUB_URL = `https://finnhub.io/api/v1/news?category=general&token=${process.env.FINNHUB_API_KEY}`;

function hashHeadline(headline) {
  return crypto.createHash("md5").update(headline.trim().toLowerCase()).digest("hex");
}

// Groq classifies sector + bullish/bearish impact in one cheap call.
async function classifyNews(headline, summary) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "Classify stock market news. Respond ONLY with JSON: " +
          '{"sector": "<one of: Banking & Finance, IT Services, Energy & Aviation, Auto, Pharma, Broad Market, Other>", ' +
          '"impact": "<bullish|bearish|neutral>"}',
      },
      { role: "user", content: `Headline: ${headline}\nSummary: ${summary || "N/A"}` },
    ],
    temperature: 0,
  });

  try {
    return JSON.parse(completion.choices[0].message.content);
  } catch {
    return { sector: "Other", impact: "neutral" };
  }
}

// `io` is your existing Socket.IO server instance — pass it in from server.js
export function startNewsCron(io) {
  // Every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    try {
      const { data: articles } = await axios.get(FINNHUB_URL);

      // Take top 5 fresh articles per run to stay well within free-tier limits
      const candidates = articles.slice(0, 5);

      for (const article of candidates) {
        const headline = article.headline;
        const dedupeHash = hashHeadline(headline);

        // Skip if already stored
        const { data: existing } = await supabase
          .from("market_news")
          .select("id")
          .eq("dedupe_hash", dedupeHash)
          .maybeSingle();

        if (existing) continue;

        const { sector, impact } = await classifyNews(headline, article.summary);

        const { data: inserted, error } = await supabase
          .from("market_news")
          .insert({
            headline,
            summary: article.summary?.slice(0, 200) || "",
            sector,
            impact,
            source: article.source || "News",
            source_url: article.url,
            dedupe_hash: dedupeHash,
          })
          .select()
          .single();

        if (error) {
          console.error("Failed to insert news:", error.message);
          continue;
        }

        // Push live to every connected client
        io.emit("news:update", inserted);
      }
    } catch (err) {
      console.error("News cron failed:", err.message);
    }
  });

  console.log("News cron scheduled — running every 10 minutes");
}

/*
── Supabase table (SQL) ──────────────────────────────────
create table market_news (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  summary text,
  sector text,
  impact text check (impact in ('bullish','bearish','neutral')),
  source text,
  source_url text,
  dedupe_hash text unique,
  created_at timestamptz default now()
);

── server.js wiring ───────────────────────────────────────
import { startNewsCron } from './newsCron.js';
// after you create your http server + io:
startNewsCron(io);
*/