export const providerRegistry = {
  ai: [
    { id: "mock", label: "Mock provider", status: "active", needsKey: false },
    { id: "openai", label: "OpenAI", status: "adapter planned", needsKey: true },
    { id: "anthropic", label: "Anthropic", status: "adapter planned", needsKey: true },
    { id: "gemini", label: "Gemini", status: "adapter planned", needsKey: true }
  ],
  dataSources: [
    { id: "mock", label: "Curated demo dataset", status: "active" },
    { id: "hacker-news", label: "Hacker News via Algolia Search", status: "available · server opt-in" },
    { id: "github", label: "GitHub Issues via REST Search", status: "available · server opt-in" },
    { id: "reddit", label: "Reddit", status: "not connected" },
    { id: "product-hunt", label: "Product Hunt", status: "not connected" },
    { id: "reviews", label: "App & SaaS reviews", status: "not connected" }
  ]
} as const;
