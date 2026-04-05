import { NextRequest, NextResponse } from "next/server";
import { getRecentTweets } from "@/lib/x-client";
import { analyzeTweets } from "@/lib/claude-analyzer";
import { writeXAnalysisToNotion } from "@/lib/x-notion-writer";

export async function GET(request: NextRequest) {
  // ---- CRON_SECRET による認証 ----
  // Vercel Cronは自動的に Authorization: Bearer <CRON_SECRET> を送信する
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Step 1: X APIから直近ツイートを取得
    console.log("X APIからツイートを取得中...");
    const tweets = await getRecentTweets(10);

    if (tweets.length === 0) {
      console.log("分析対象のツイートがありません");
      return NextResponse.json({
        success: true,
        message: "分析対象のツイートがありません",
      });
    }

    // Step 2: Claude APIで分析
    console.log(`${tweets.length}件のツイートを分析中...`);
    const analysis = await analyzeTweets(tweets);

    // Step 3: Notionに保存
    console.log("分析結果をNotionに保存中...");
    await writeXAnalysisToNotion(analysis);

    console.log("X分析完了:", {
      tweetCount: analysis.tweetCount,
      totalLikes: analysis.totalLikes,
      totalImpressions: analysis.totalImpressions,
    });

    return NextResponse.json({
      success: true,
      tweetCount: analysis.tweetCount,
      totalLikes: analysis.totalLikes,
      totalRetweets: analysis.totalRetweets,
      totalImpressions: analysis.totalImpressions,
    });
  } catch (error) {
    console.error("X分析Cronエラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}
