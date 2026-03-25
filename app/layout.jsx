import "./globals.css";

export const metadata = {
  title: "Hyperscaled",
  description: "The decentralized prop trading network",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap"
          rel="stylesheet"
        />

      </head>
      <body style={{ fontFamily: "'Satoshi', ui-sans-serif, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
