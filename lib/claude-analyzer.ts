import Anthropic from "@anthropic-ai/sdk";
import type { Tweet } from "./x-client";

export interface AnalysisResult {
  summary: string;
  fullAnalysis: string;
  totalLikes: number;
  totalRetweets: number;
  totalImpressions: number;
  topTweet: string;
  tweetCount: number;
}

/** ツイートデータから集計値を算出し、Claudeで定性分析を行う */
export async function analyzeTweets(tweets: Tweet[]): Promise<AnalysisResult> {
  // ---- 数値集計（コードで確実に算出） ----
  const totalLikes = tweets.reduce((sum, t) => sum + t.public_metrics.like_count, 0);
  const totalRetweets = tweets.reduce((sum, t) => sum + t.public_metrics.retweet_count, 0);
  const totalImpressions = tweets.reduce((sum, t) => sum + t.public_metrics.impression_count, 0);

  // エンゲージメントスコア（いいね + RT*2 + リプライ）が最も高いツイートを特定
  const topTweet = tweets.reduce((best, t) => {
    const score =
      t.public_metrics.like_count +
      t.public_metrics.retweet_count * 2 +
      t.public_metrics.reply_count;
    const bestScore =
      best.public_metrics.like_count +
      best.public_metrics.retweet_count * 2 +
      best.public_metrics.reply_count;
    return score > bestScore ? t : best;
  }, tweets[0]);

  // ---- Claude による定性分析 ----
  let summary = "";
  let fullAnalysis = "";

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const tweetData = tweets.map((t) => ({
      text: t.text,
      likes: t.public_metrics.like_count,
      retweets: t.public_metrics.retweet_count,
      replies: t.public_metrics.reply_count,
      impressions: t.public_metrics.impression_count,
      created_at: t.created_at,
    }));

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `以下はXの直近ツイートのエンゲージメントデータです。分析してください。

## ツイートデータ
${JSON.stringify(tweetData, null, 2)}

## 集計値
- 合計いいね: ${totalLikes}
- 合計RT: ${totalRetweets}
- 合計インプレッション: ${totalImpressions}
- ツイート数: ${tweets.length}

## 出力形式
以下の形式で日本語で回答してください:

【総合評価】
1-2文で全体の傾向を要約

【効果的だったコンテンツ】
- エンゲージメントが高かったツイートの共通点や傾向

【改善ポイント】
- エンゲージメントが低かったツイートの改善案

【次のアクション】
- 今後のツイート戦略の具体的な提案（2-3個）`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // 最初の「総合評価」セクションをサマリーとして抽出
    const summaryMatch = responseText.match(/【総合評価】\n([\s\S]*?)(?=\n【|$)/);
    summary = summaryMatch ? summaryMatch[1].trim() : responseText.slice(0, 200);
    fullAnalysis = responseText;
  } catch (error) {
    console.error("Claude API エラー:", error);
    summary = "Claude分析は利用できませんでした";
    fullAnalysis = `分析エラー: ${error instanceof Error ? error.message : "不明なエラー"}`;
  }

  return {
    summary,
    fullAnalysis,
    totalLikes,
    totalRetweets,
    totalImpressions,
    topTweet: `${topTweet.text} (❤️${topTweet.public_metrics.like_count} 🔁${topTweet.public_metrics.retweet_count})`,
    tweetCount: tweets.length,
  };
}
