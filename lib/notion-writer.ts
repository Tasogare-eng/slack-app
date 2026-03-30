import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID!;

/** SlackメッセージをNotionデータベースに1行追加する */
export async function writeToNotion(params: {
  senderName: string;
  messageText: string;
  channelName: string;
  timestamp: string;
}) {
  // Slackタイムスタンプ（Unix epoch）をISO 8601に変換
  const date = new Date(parseFloat(params.timestamp) * 1000);
  const isoTimestamp = date.toISOString();

  await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      // Sender: Titleプロパティ（Notionデータベースに必ず1つ必要）
      Sender: {
        title: [{ text: { content: params.senderName } }],
      },
      // Message: テキストプロパティ（最大2000文字）
      Message: {
        rich_text: [{ text: { content: params.messageText.slice(0, 2000) } }],
      },
      // Channel: テキストプロパティ
      Channel: {
        rich_text: [{ text: { content: params.channelName } }],
      },
      // Timestamp: 日付プロパティ
      Timestamp: {
        date: { start: isoTimestamp },
      },
    },
  });
}
