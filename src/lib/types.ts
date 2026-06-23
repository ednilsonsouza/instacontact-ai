export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type OutputFormat = "xlsx" | "csv" | "json" | "google_sheets" | "notion" | "webhook";

export interface JobSource {
  type: "usernames" | "urls" | "hashtags" | "locations" | "keywords" | "csv";
  items: string[];
}

export interface JobOptions {
  endpoints: string[];
  enrichment: {
    validate_email: boolean;
    check_whatsapp: boolean;
    lead_score: boolean;
  };
  filters: {
    is_business?: boolean;
    min_followers?: number;
    max_followers?: number;
    keywords_in_bio?: string[];
  };
  dedup: boolean;
  cache_ttl_hours: number;
}

export interface JobInput {
  name: string;
  source: JobSource;
  options: JobOptions;
  outputs: OutputFormat[];
  webhook_url?: string;
  tags: string[];
}

export interface ContactField {
  value: string | null;
  source: string;
  valid?: boolean;
  confidence?: number;
}

export interface WhatsAppField {
  value: string | null;
  wa_me: string | null;
  source: string;
  valid_format: boolean;
  country: string | null;
}

export interface ProfileResult {
  username: string;
  full_name: string | null;
  bio: string | null;
  category: string | null;
  is_business: boolean;
  is_verified: boolean;
  followers: number | null;
  following: number | null;
  posts: number | null;
  bio_link: string | null;
  email: ContactField;
  whatsapp: WhatsAppField;
  lead_score: number | null;
  sources_used: string[];
  errors: string[];
  extracted_at: string;
  cost_cents: number;
}

export interface EndpointStat {
  endpoint: string;
  requests: number;
  successes: number;
  failures: number;
  avg_latency_ms: number;
  cost_cents: number;
  contacts_found: number;
  circuit_open: boolean;
}

export interface Job {
  id: string;
  user_id: string;
  name: string;
  input: JobInput;
  status: JobStatus;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  progress: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    emails_found: number;
    whatsapps_found: number;
  };
  results: ProfileResult[];
  cost_cents: number;
  error: string | null;
}

export interface Credits {
  user_id: string;
  total: number;
  used: number;
  plan: string;
}

export interface RapidApiEndpointMeta {
  id: string;
  name: string;
  provider: string;
  host: string;
  path: string;
  cost_per_request_cents: number;
  rate_limit_per_min: number;
  capabilities: string[];
  priority: number;
}
