import { existsSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import { prisma } from '../config/database';
import { EXCLUDED_PLATFORM_SLUGS } from '../../lib/excluded-platforms';
import { migrateLogoUrl } from './board-logo.service';
import { inferRegion } from '../../lib/board-job-region';
import type { MigrationResult } from '../../lib/board-search-types';

export interface MigrationOptions {
  sqlitePath?: string;
  includeJobs?: boolean;
  uploadLogos?: boolean;
  batchSize?: number;
}

function resolveSqlitePath(custom?: string): string {
  const candidates = [
    custom,
    join(process.cwd(), '..', 'felovy-search', 'felovy.db'),
    join(process.cwd(), 'felovy.db'),
    'E:\\felovy-search\\felovy.db',
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(`SQLite database not found. Tried: ${candidates.join(', ')}`);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function runFelovySearchMigration(
  options: MigrationOptions = {},
): Promise<MigrationResult> {
  const sqlitePath = resolveSqlitePath(options.sqlitePath);
  const includeJobs = options.includeJobs !== false;
  const uploadLogos = options.uploadLogos !== false;
  const batchSize = options.batchSize ?? 500;

  const db = new Database(sqlitePath, { readonly: true });
  const errors: string[] = [];
  let platforms = 0;
  let tokens = 0;
  let jobs = 0;
  let logosUploaded = 0;
  let logosSkipped = 0;

  try {
    const platformRows = db
      .prepare(
        `SELECT slug, label, domain, integration, list_url_template, headers_json,
                pagination_json, jobs_path, response_format, description_from_list,
                scrapeable, concurrency, agent_enabled, sort_order, catalog_json
         FROM platforms ORDER BY COALESCE(sort_order, 9999)`,
      )
      .all() as Array<Record<string, unknown>>;

    for (const row of platformRows) {
      const slug = String(row.slug);
      if (EXCLUDED_PLATFORM_SLUGS.has(slug)) continue;

      await prisma.boardPlatform.upsert({
        where: { slug },
        create: {
          slug,
          label: String(row.label ?? slug),
          domain: row.domain != null ? String(row.domain) : null,
          integration: row.integration != null ? String(row.integration) : null,
          listUrlTemplate: row.list_url_template != null ? String(row.list_url_template) : null,
          headersJson: String(row.headers_json ?? '{"User-Agent":"Felovy/1.0"}'),
          paginationJson: row.pagination_json != null ? String(row.pagination_json) : null,
          jobsPath: row.jobs_path != null ? String(row.jobs_path) : null,
          responseFormat: row.response_format != null ? String(row.response_format) : null,
          descriptionFromList: Number(row.description_from_list ?? 0) === 1,
          scrapeable: Number(row.scrapeable ?? 0) === 1,
          concurrency: Number(row.concurrency ?? 10) || 10,
          agentEnabled: Number(row.agent_enabled ?? 0) === 1,
          sortOrder: Number(row.sort_order ?? platforms),
          catalogJson: row.catalog_json != null ? String(row.catalog_json) : null,
        },
        update: {
          label: String(row.label ?? slug),
          domain: row.domain != null ? String(row.domain) : null,
          integration: row.integration != null ? String(row.integration) : null,
          listUrlTemplate: row.list_url_template != null ? String(row.list_url_template) : null,
          headersJson: String(row.headers_json ?? '{"User-Agent":"Felovy/1.0"}'),
          paginationJson: row.pagination_json != null ? String(row.pagination_json) : null,
          jobsPath: row.jobs_path != null ? String(row.jobs_path) : null,
          responseFormat: row.response_format != null ? String(row.response_format) : null,
          descriptionFromList: Number(row.description_from_list ?? 0) === 1,
          scrapeable: Number(row.scrapeable ?? 0) === 1,
          concurrency: Number(row.concurrency ?? 10) || 10,
          agentEnabled: Number(row.agent_enabled ?? 0) === 1,
          sortOrder: Number(row.sort_order ?? platforms),
          catalogJson: row.catalog_json != null ? String(row.catalog_json) : null,
        },
      });
      platforms++;
    }

    const tokenRows = db
      .prepare(
        `SELECT ats, board_token, enabled, last_scraped_at, last_status, last_error,
                last_job_count, logo_url, logo_fetched_at, opened_count
         FROM board_tokens`,
      )
      .all() as Array<Record<string, unknown>>;

    for (let i = 0; i < tokenRows.length; i++) {
      const row = tokenRows[i];
      const ats = String(row.ats);
      if (EXCLUDED_PLATFORM_SLUGS.has(ats)) continue;

      const boardToken = String(row.board_token).trim().toLowerCase();
      if (!boardToken) continue;

      let logoUrl = row.logo_url != null ? String(row.logo_url) : null;
      if (uploadLogos && logoUrl) {
        try {
          const migrated = await migrateLogoUrl(ats, boardToken, logoUrl);
          if (migrated && migrated !== logoUrl) logosUploaded++;
          else if (logoUrl.startsWith('felovy-asset://')) logosSkipped++;
          logoUrl = migrated ?? logoUrl;
        } catch (err) {
          errors.push(`Logo ${ats}/${boardToken}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      await prisma.boardToken.upsert({
        where: { ats_boardToken: { ats, boardToken } },
        create: {
          ats,
          boardToken,
          enabled: Number(row.enabled ?? 1) === 1,
          lastScrapedAt: parseDate(row.last_scraped_at as string),
          lastStatus: row.last_status != null ? String(row.last_status) : null,
          lastError: row.last_error != null ? String(row.last_error) : null,
          lastJobCount: row.last_job_count != null ? Number(row.last_job_count) : null,
          logoUrl,
          logoFetchedAt: parseDate(row.logo_fetched_at as string),
          openedCount: Number(row.opened_count ?? 0) || 0,
        },
        update: {
          enabled: Number(row.enabled ?? 1) === 1,
          lastScrapedAt: parseDate(row.last_scraped_at as string),
          lastStatus: row.last_status != null ? String(row.last_status) : null,
          lastError: row.last_error != null ? String(row.last_error) : null,
          lastJobCount: row.last_job_count != null ? Number(row.last_job_count) : null,
          logoUrl,
          logoFetchedAt: parseDate(row.logo_fetched_at as string),
          openedCount: Number(row.opened_count ?? 0) || 0,
        },
      });
      tokens++;

      if (i > 0 && i % 1000 === 0) {
        await new Promise(r => setImmediate(r));
      }
    }

    if (includeJobs) {
      const jobCount =
        (db.prepare('SELECT COUNT(*) AS c FROM jobs').get() as { c: number })?.c ?? 0;
      let offset = 0;

      while (offset < jobCount) {
        const batch = db
          .prepare(
            `SELECT ats, board_token, job_id, title, company_name, location_name, absolute_url,
                    first_published, updated_at, content_html, content_text, departments_json,
                    offices_json, metadata_json, remote_status, language, employment_type,
                    country_code, scraped_at, seen_in_last_scrape
             FROM jobs LIMIT ? OFFSET ?`,
          )
          .all(batchSize, offset) as Array<Record<string, unknown>>;

        if (!batch.length) break;

        for (const row of batch) {
          const ats = String(row.ats);
          if (EXCLUDED_PLATFORM_SLUGS.has(ats)) continue;
          const boardToken = String(row.board_token);
          const externalJobId = String(row.job_id);
          const countryCode = row.country_code != null ? String(row.country_code) : null;
          const locationName = row.location_name != null ? String(row.location_name) : null;

          await prisma.boardJob.upsert({
            where: {
              ats_boardToken_externalJobId: { ats, boardToken, externalJobId },
            },
            create: {
              ats,
              boardToken,
              externalJobId,
              title: row.title != null ? String(row.title) : null,
              companyName: row.company_name != null ? String(row.company_name) : null,
              locationName,
              absoluteUrl: row.absolute_url != null ? String(row.absolute_url) : null,
              firstPublished: parseDate(row.first_published as string),
              sourceUpdatedAt: parseDate(row.updated_at as string),
              contentHtml: row.content_html != null ? String(row.content_html) : null,
              contentText: row.content_text != null ? String(row.content_text) : null,
              departmentsJson: row.departments_json != null ? String(row.departments_json) : null,
              officesJson: row.offices_json != null ? String(row.offices_json) : null,
              metadataJson: row.metadata_json != null ? String(row.metadata_json) : null,
              remoteStatus: row.remote_status != null ? String(row.remote_status) : null,
              language: row.language != null ? String(row.language) : null,
              employmentType: row.employment_type != null ? String(row.employment_type) : null,
              countryCode,
              region: inferRegion(countryCode, locationName),
              scrapedAt: parseDate(row.scraped_at as string) ?? new Date(),
              seenInLastScrape: Number(row.seen_in_last_scrape ?? 1) === 1,
            },
            update: {
              title: row.title != null ? String(row.title) : null,
              companyName: row.company_name != null ? String(row.company_name) : null,
              locationName,
              absoluteUrl: row.absolute_url != null ? String(row.absolute_url) : null,
              firstPublished: parseDate(row.first_published as string),
              sourceUpdatedAt: parseDate(row.updated_at as string),
              contentHtml: row.content_html != null ? String(row.content_html) : null,
              contentText: row.content_text != null ? String(row.content_text) : null,
              departmentsJson: row.departments_json != null ? String(row.departments_json) : null,
              officesJson: row.offices_json != null ? String(row.offices_json) : null,
              metadataJson: row.metadata_json != null ? String(row.metadata_json) : null,
              remoteStatus: row.remote_status != null ? String(row.remote_status) : null,
              language: row.language != null ? String(row.language) : null,
              employmentType: row.employment_type != null ? String(row.employment_type) : null,
              countryCode,
              region: inferRegion(countryCode, locationName),
              scrapedAt: parseDate(row.scraped_at as string) ?? new Date(),
              seenInLastScrape: Number(row.seen_in_last_scrape ?? 1) === 1,
            },
          });
          jobs++;
        }

        offset += batchSize;
        await new Promise(r => setImmediate(r));
      }
    }

    await prisma.appMeta.upsert({
      where: { key: 'sqlite_migrated_at' },
      create: { key: 'sqlite_migrated_at', value: new Date().toISOString() },
      update: { value: new Date().toISOString() },
    });
  } finally {
    db.close();
  }

  return { platforms, tokens, jobs, logosUploaded, logosSkipped, errors };
}

/** CLI entry — node -r ts-node/register or via script */
export async function migrateFromCli(): Promise<void> {
  const pathArg = process.argv.find(a => a.startsWith('--path='))?.slice(7);
  const skipJobs = process.argv.includes('--skip-jobs');
  const skipLogos = process.argv.includes('--skip-logos');

  console.log('Starting felovy-search SQLite migration…');
  const result = await runFelovySearchMigration({
    sqlitePath: pathArg,
    includeJobs: !skipJobs,
    uploadLogos: !skipLogos,
  });
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  migrateFromCli().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
