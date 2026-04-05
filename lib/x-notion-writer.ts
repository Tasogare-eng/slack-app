import { Client } from "@notionhq/client";
import type { AnalysisResult } from "./claude-analyzer";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_X_DATABASE_ID!;

/** X分析結果をNotionデータベースに保存する */
export async function writeXAnalysisToNotion(analysis: AnalysisResult) {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0]; // "2026-04-05"

  await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Date: {
        title: [{ text: { content: dateStr } }],
      },
      Summary: {
        rich_text: [{ text: { content: analysis.summary.slice(0, 2000) } }],
      },
      TotalLikes: {
        number: analysis.totalLikes,
      },
      TotalRetweets: {
        number: analysis.totalRetweets,
      },
      TotalImpressions: {
        number: analysis.totalImpressions,
      },
      TopTweet: {
        rich_text: [{ text: { content: analysis.topTweet.slice(0, 2000) } }],
      },
      FullAnalysis: {
        rich_text: [{ text: { content: analysis.fullAnalysis.slice(0, 2000) } }],
      },
      TweetCount: {
        number: analysis.tweetCount,
      },
      AnalyzedAt: {
        date: { start: today.toISOString() },
      },
    },
  });
}
