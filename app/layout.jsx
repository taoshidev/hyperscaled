import "./globals.css";

export const metadata = {
  title: "Hyperscaled",
  description: "The decentralized prop trading network",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>{children}</body>
    </html>
  );
}
