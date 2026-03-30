import { NextRequest, NextResponse } from "next/server";
import { verifySlackRequest } from "@/lib/slack-verify";
import { getUserName, getChannelName } from "@/lib/slack-helpers";
import { writeToNotion } from "@/lib/notion-writer";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const body = JSON.parse(rawBody);

  // ---- 1. Slack URL検証チャレンジ ----
  // Slack AppのEvent Subscriptions設定時に1回だけ送られる
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  // ---- 2. Slackリトライのスキップ ----
  // Slackは3秒以内に応答がないとリトライする。重複処理を防ぐ
  if (request.headers.get("x-slack-retry-num")) {
    return new NextResponse("ok", { status: 200 });
  }

  // ---- 3. 署名検証 ----
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.error("SLACK_SIGNING_SECRET が設定されていません");
    return new NextResponse("Server error", { status: 500 });
  }

  const timestamp = request.headers.get("x-slack-request-timestamp") || "";
  const signature = request.headers.get("x-slack-signature") || "";

  if (!verifySlackRequest(signingSecret, timestamp, rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  // ---- 4. イベント処理 ----
  if (body.type === "event_callback") {
    const event = body.event;

    // メッセージイベントのみ処理（システムメッセージやボットは除外）
    if (event?.type === "message" && !event.subtype && !event.bot_id) {
      try {
        // ユーザー名とチャンネル名を並行取得
        const [senderName, channelName] = await Promise.all([
          getUserName(event.user),
          getChannelName(event.channel),
        ]);

        // Notionデータベースに書き込み
        await writeToNotion({
          senderName,
          messageText: event.text || "",
          channelName,
          timestamp: event.ts,
        });

        console.log(`メッセージを記録: ${senderName} in #${channelName}`);
      } catch (error) {
        console.error("Notion書き込みエラー:", error);
      }
    }
  }

  return new NextResponse("ok", { status: 200 });
}
