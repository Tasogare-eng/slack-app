/** X (Twitter) API v2 から直近ツイートのエンゲージメントデータを取得する */

export interface TweetPublicMetrics {
  like_count: number;
  retweet_count: number;
  reply_count: number;
  impression_count: number;
}

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: TweetPublicMetrics;
}

interface XApiResponse {
  data?: Tweet[];
  meta?: { result_count: number };
}

/** 直近のツイート（リツイート・リプライ除外）を取得する */
export async function getRecentTweets(maxResults = 10): Promise<Tweet[]> {
  const userId = process.env.X_USER_ID;
  const bearerToken = process.env.X_BEARER_TOKEN;

  if (!userId || !bearerToken) {
    throw new Error("X_USER_ID または X_BEARER_TOKEN が設定されていません");
  }

  const params = new URLSearchParams({
    "tweet.fields": "public_metrics,created_at",
    max_results: String(maxResults),
    exclude: "retweets,replies",
  });

  const url = `https://api.x.com/2/users/${userId}/tweets?${params}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`X API error (${response.status}): ${errorBody}`);
  }

  const json: XApiResponse = await response.json();
  return json.data ?? [];
}
