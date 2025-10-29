import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourservice.ru";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api", "/settings", "/billing"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

