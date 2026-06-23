import type { RapidApiEndpointMeta } from "@/lib/types";

export const ENDPOINT_CATALOG: RapidApiEndpointMeta[] = [
  {
    id: "instagram_scraper_stable",
    name: "Instagram Scraper (Stable)",
    provider: "rockapis",
    host: "instagram-scraper-stable-api.p.rapidapi.com",
    path: "/v1/info",
    cost_per_request_cents: 2,
    rate_limit_per_min: 60,
    capabilities: ["profile", "bio", "followers", "category", "bio_link"],
    priority: 1,
  },
  {
    id: "instagram_email_scraper",
    name: "Instagram Email Scraper",
    provider: "freshdata",
    host: "instagram-email-scraper.p.rapidapi.com",
    path: "/v1/email",
    cost_per_request_cents: 4,
    rate_limit_per_min: 30,
    capabilities: ["profile", "email", "contact_button"],
    priority: 2,
  },
  {
    id: "instagram_email_finder",
    name: "Instagram Email Contact Finder",
    provider: "wirelessreach",
    host: "instagram-email-contact-finder.p.rapidapi.com",
    path: "/v1/find",
    cost_per_request_cents: 5,
    rate_limit_per_min: 25,
    capabilities: ["email", "enrichment"],
    priority: 3,
  },
  {
    id: "website_contacts_scraper",
    name: "Website Contacts Scraper",
    provider: "omrapi",
    host: "website-contacts-scraper.p.rapidapi.com",
    path: "/v1/contacts",
    cost_per_request_cents: 3,
    rate_limit_per_min: 40,
    capabilities: ["bio_link", "email", "phone", "whatsapp"],
    priority: 4,
  },
  {
    id: "instagram_profile_info",
    name: "Instagram Profile Info (Lite)",
    provider: "datauniverse",
    host: "instagram-profile-info.p.rapidapi.com",
    path: "/v1/profile",
    cost_per_request_cents: 1,
    rate_limit_per_min: 80,
    capabilities: ["profile", "bio", "followers"],
    priority: 5,
  },
];

export function getEndpoint(id: string): RapidApiEndpointMeta | undefined {
  return ENDPOINT_CATALOG.find((e) => e.id === id);
}

export function endpointsForCapability(cap: string): RapidApiEndpointMeta[] {
  return ENDPOINT_CATALOG.filter((e) => e.capabilities.includes(cap)).sort(
    (a, b) => a.priority - b.priority
  );
}
