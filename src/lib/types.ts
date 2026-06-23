export interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  profession: string | null;
  location: string | null;
  source: string;
  source_url: string;
  bio: string | null;
  profile_url: string | null;
  image_url: string | null;
  found_at: string;
}

export interface SearchRequest {
  profession: string;
  state: string;
  maxResults?: number;
}

export interface SearchProgress {
  total_found: number;
  with_email: number;
  with_phone: number;
  sources_tried: string[];
  status: "searching" | "done" | "error";
  current_source: string | null;
}
