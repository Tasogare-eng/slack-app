export const metadata = {
  title: "Slack to Notion",
  description: "SlackメッセージをNotionに記録するアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
