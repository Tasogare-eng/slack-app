import crypto from "crypto";

/**
 * Slackリクエストの署名を検証する
 * https://api.slack.com/authentication/verifying-requests-from-slack
 */
export function verifySlackRequest(
  signingSecret: string,
  timestamp: string,
  rawBody: string,
  signature: string
): boolean {
  // 5分以上古いリクエストは拒否（リプレイ攻撃防止）
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (parseInt(timestamp, 10) < fiveMinutesAgo) {
    return false;
  }

  // HMAC-SHA256で署名を計算
  const sigBasestring = `v0:${timestamp}:${rawBody}`;
  const mySignature =
    "v0=" +
    crypto
      .createHmac("sha256", signingSecret)
      .update(sigBasestring, "utf8")
      .digest("hex");

  // タイミング攻撃を防ぐ安全な比較
  return crypto.timingSafeEqual(
    Buffer.from(mySignature, "utf8"),
    Buffer.from(signature, "utf8")
  );
}
