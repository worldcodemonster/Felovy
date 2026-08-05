/** Shared types for felovy-search ↔ Felovy job board integration. */

export type BoardJobRemoteStatus = 'remote' | 'hybrid' | 'onsite' | null;
export type BoardJobRegion = 'US' | 'EU' | 'LATAM' | 'OTHER';
export type BoardJobSearchMode = 'AND' | 'OR';
export type BoardJobDateRange = 'today' | '2d' | '3d' | '7d' | '15d' | '30d' | 'all';

/** Payload shape sent by felovy-search (snake_case, matches SQLite UnifiedJob). */
export interface BoardJobIngestPayload {
  job_id: string;
  board_token: string;
  ats: string;
  title?: string | null;
  company_name?: string | null;
  location_name?: string | null;
  absolute_url?: string | null;
  first_published?: string | null;
  updated_at?: string | null;
  content_html?: string | null;
  content_text?: string | null;
  departments_json?: string | null;
  offices_json?: string | null;
  metadata_json?: string | null;
  remote_status?: BoardJobRemoteStatus;
  language?: string | null;
  employment_type?: string | null;
  country_code?: string | null;
  logo_url?: string | null;
  scraped_at?: string | null;
  seen_in_last_scrape?: boolean | number | null;
}

export interface BoardJobIngestRequest {
  /** Single job (shorthand). */
  job?: BoardJobIngestPayload;
  /** Batch ingest (preferred for sync). */
  jobs?: BoardJobIngestPayload[];
}

export interface BoardJobIngestResult {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

export interface BoardJobListQuery {
  title_q?: string;
  title_mode?: BoardJobSearchMode;
  content_q?: string;
  content_mode?: BoardJobSearchMode;
  board_token_q?: string;
  ats?: string;
  remote_status?: string;
  region?: BoardJobRegion | 'ANY' | '';
  posted_range?: BoardJobDateRange;
  updated_range?: BoardJobDateRange;
  sort_by?:
    | 'title'
    | 'company_name'
    | 'location_name'
    | 'first_published'
    | 'source_updated_at'
    | 'board_token'
    | 'scraped_at';
  sort_dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface BoardJobRow {
  id: string;
  ats: string;
  boardToken: string;
  externalJobId: string;
  title: string | null;
  companyName: string | null;
  locationName: string | null;
  absoluteUrl: string | null;
  firstPublished: string | null;
  sourceUpdatedAt: string | null;
  contentHtml: string | null;
  contentText: string | null;
  departmentsJson: string | null;
  officesJson: string | null;
  metadataJson: string | null;
  remoteStatus: string | null;
  language: string | null;
  employmentType: string | null;
  countryCode: string | null;
  region: string | null;
  logoUrl: string | null;
  scrapedAt: string;
  seenInLastScrape: boolean;
}

export interface BoardJobListResponse {
  items: BoardJobRow[];
  total: number;
  page: number;
  pageSize: number;
}
