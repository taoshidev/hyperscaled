const SITE_URL = process.env.HYPERSCALED_BASE_URL || "https://hyperscaled.trade";

export default function sitemap() {
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "monthly" },
    { path: "/how-it-works", priority: 0.9, changeFrequency: "monthly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
    { path: "/rules", priority: 0.8, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.8, changeFrequency: "monthly" },
    { path: "/leaderboard", priority: 0.8, changeFrequency: "daily" },
    { path: "/agents", priority: 0.7, changeFrequency: "monthly" },
    { path: "/partners", priority: 0.7, changeFrequency: "monthly" },
    { path: "/register", priority: 0.9, changeFrequency: "monthly" },
    { path: "/dashboard", priority: 0.5, changeFrequency: "daily" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/risk", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
