import { WebClient } from "@slack/web-api";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

/** SlackユーザーIDから表示名を取得する */
export async function getUserName(userId: string): Promise<string> {
  try {
    const result = await slack.users.info({ user: userId });
    return result.user?.real_name || result.user?.name || userId;
  } catch {
    return userId; // 取得失敗時はIDをそのまま返す
  }
}

/** SlackチャンネルIDからチャンネル名を取得する */
export async function getChannelName(channelId: string): Promise<string> {
  try {
    const result = await slack.conversations.info({ channel: channelId });
    return result.channel?.name || channelId;
  } catch {
    return channelId; // 取得失敗時はIDをそのまま返す
  }
}
