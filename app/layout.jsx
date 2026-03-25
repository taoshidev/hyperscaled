import "./globals.css";

export const metadata = {
  title: "Hyperscaled",
  description: "The decentralized prop trading network.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap"
          rel="stylesheet"
        />
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
