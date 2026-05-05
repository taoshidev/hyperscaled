import Script from "next/script";

export default function RegisterLayout({ children }) {
  return (
    <>
      <Script
        src="https://cdn.tolt.io/tolt.js"
        data-tolt="pk_NViW5X1SHRST7w9SGJVkcEwE"
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
