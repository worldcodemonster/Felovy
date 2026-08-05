/** Shared types for felovy-search board token & scrape features (ported from desktop app). */

export type RemoteStatus = 'remote' | 'hybrid' | 'onsite' | null;

export interface UnifiedJob {
  job_id: string;
  board_token: string;
  ats: string;
  title: string | null;
  company_name: string | null;
  location_name: string | null;
  absolute_url: string | null;
  first_published: string | null;
  updated_at: string | null;
  content_html: string | null;
  content_text: string | null;
  departments_json: string | null;
  offices_json: string | null;
  metadata_json: string | null;
  remote_status: RemoteStatus;
  language: string | null;
  employment_type: string | null;
  country_code: string | null;
}

export interface PlatformRow {
  slug: string;
  label: string;
  domain: string | null;
  integration: string | null;
  list_url_template: string | null;
  scrapeable: boolean;
  concurrency: number;
  agent_enabled: boolean;
  sort_order: number;
  token_count: number;
  job_count: number;
}

export interface BoardTokenRow {
  ats: string;
  board_token: string;
  enabled: boolean;
  last_scraped_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_job_count: number | null;
  logo_url: string | null;
  logo_fetched_at: string | null;
  opened_count: number;
}

export interface TokenVerifyProgress {
  mode: 'import' | 'verify' | 'add';
  ats: string;
  atsLabel: string | null;
  atsIndex: number;
  atsTotal: number;
  total: number;
  checked: number;
  valid: number;
  invalid: number;
  added: number;
  skippedExisting: number;
  skippedEmpty: number;
  skippedDupInFile: number;
  flowAdded: number;
  flowInvalid: number;
  flowSkippedExisting: number;
  concurrency: number;
  active: number;
  currentToken: string | null;
  running: boolean;
  finished: boolean;
  cancelled: boolean;
  message: string | null;
}

export interface TokenVerifyAllResult {
  ats: string;
  checked: number;
  valid: number;
  removed: number;
  concurrency: number;
  cancelled: boolean;
}

export interface TokenVerifyResult {
  mode?: 'import' | 'verify' | 'import_all';
  ats?: string;
  total?: number;
  checked?: number;
  valid?: number;
  invalid?: number;
  removed?: number;
  added: number;
  skippedExisting: number;
  skippedEmpty: number;
  skippedDupInFile: number;
  concurrency: number;
  cancelled: boolean;
}

export interface AgentStatus {
  ats: string;
  label: string;
  running: boolean;
  paused: boolean;
  concurrency: number;
  totalTokens: number;
  doneTokens: number;
  activeTokens: number;
  jobsFound: number;
  jobsPruned: number;
  errors: number;
  currentToken: string | null;
  lastMessage: string | null;
}

export interface RotationStatus {
  active: boolean;
  paused: boolean;
  currentAts: string | null;
  currentLabel: string | null;
  cycle: number;
  queue: string[];
}

export interface ScrapeEvent {
  type: 'agent' | 'token' | 'log';
  ats?: string;
  board_token?: string;
  message: string;
  at: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface MigrationResult {
  platforms: number;
  tokens: number;
  jobs: number;
  logosUploaded: number;
  logosSkipped: number;
  errors: string[];
}
