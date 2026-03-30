export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Slack → Notion Logger</h1>
      <p>Slackのメッセージをリアルタイムでnotionデータベースに記録します。</p>
      <h2>セットアップ</h2>
      <ol>
        <li>Slack Appを作成し、Event SubscriptionsのRequest URLに <code>/api/slack</code> を設定</li>
        <li>Notionでデータベースを作成し、Integrationを接続</li>
        <li>環境変数を設定（SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, NOTION_API_KEY, NOTION_DATABASE_ID）</li>
        <li>Slackチャンネルにボットを招待してメッセージを送信</li>
      </ol>
    </main>
  );
}
