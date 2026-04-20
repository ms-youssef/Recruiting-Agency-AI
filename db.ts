import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  user: 'kimo',
  host: 'localhost',
  database: 'recruitment_db',
  password: 'kimo_pass',
  port: 5433,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        timezone TEXT NOT NULL DEFAULT 'Africa/Cairo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'salesperson', 'manager', 'ceo')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (tenant_id, email)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS icp_configs (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
        industries TEXT[] DEFAULT '{}',
        geographies TEXT[] DEFAULT '{}',
        headcount_min INTEGER,
        headcount_max INTEGER,
        seniority_levels TEXT[] DEFAULT '{}',
        excluded_domains TEXT[] DEFAULT '{}',
        custom_qualifiers TEXT,
        qualification_threshold NUMERIC(3,2) DEFAULT 0.70,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS job_leads (
        id TEXT PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        company TEXT,
        title TEXT,
        industry TEXT,
        seniority TEXT,
        salary TEXT,
        location TEXT,
        source_url TEXT,
        qualification_score NUMERIC(3,2),
        qualification_status TEXT,
        qualification_reason TEXT,
        dedupe_status TEXT DEFAULT 'new',
        enrichment_status TEXT DEFAULT 'pending',
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE;`);
    await client.query(`ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS source_url TEXT;`);
    await client.query(`ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS qualification_score NUMERIC(3,2);`);
    await client.query(`ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS qualification_status TEXT;`);
    await client.query(`ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS qualification_reason TEXT;`);
    await client.query(`ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS dedupe_status TEXT DEFAULT 'new';`);
    await client.query(`ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending';`);
    await client.query(`ALTER TABLE job_leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        lead_id TEXT REFERENCES job_leads(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        role TEXT,
        contact_type TEXT,
        email TEXT,
        phone TEXT,
        bio TEXT,
        linkedin_profile TEXT,
        signalhire_request_id BIGINT,
        signalhire_status TEXT DEFAULT 'pending',
        raw_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS signalhire_request_id BIGINT;`);

    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE;`);
    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_id TEXT REFERENCES job_leads(id) ON DELETE CASCADE;`);
    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS full_name TEXT;`);
    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS role TEXT;`);
    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type TEXT;`);
    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email TEXT;`);
    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone TEXT;`);
    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS bio TEXT;`);
    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linkedin_profile TEXT;`);
    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS signalhire_status TEXT DEFAULT 'pending';`);
    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS raw_data JSONB;`);
    await client.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS scrape_runs (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        sector TEXT,
        services TEXT,
        source TEXT DEFAULT 'kimo-engine',
        run_status TEXT,
        pulled_count INTEGER DEFAULT 0,
        qualified_count INTEGER DEFAULT 0,
        deduped_count INTEGER DEFAULT 0,
        enriched_count INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        metadata JSONB
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS signalhire_callbacks (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        request_id BIGINT,
        payload JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`ALTER TABLE scrape_runs ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE;`);
    await client.query(`ALTER TABLE scrape_runs ADD COLUMN IF NOT EXISTS sector TEXT;`);
    await client.query(`ALTER TABLE scrape_runs ADD COLUMN IF NOT EXISTS services TEXT;`);
    await client.query(`ALTER TABLE scrape_runs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'kimo-engine';`);
    await client.query(`ALTER TABLE scrape_runs ADD COLUMN IF NOT EXISTS run_status TEXT;`);
    await client.query(`ALTER TABLE scrape_runs ADD COLUMN IF NOT EXISTS pulled_count INTEGER DEFAULT 0;`);
    await client.query(`ALTER TABLE scrape_runs ADD COLUMN IF NOT EXISTS qualified_count INTEGER DEFAULT 0;`);
    await client.query(`ALTER TABLE scrape_runs ADD COLUMN IF NOT EXISTS deduped_count INTEGER DEFAULT 0;`);
    await client.query(`ALTER TABLE scrape_runs ADD COLUMN IF NOT EXISTS enriched_count INTEGER DEFAULT 0;`);
    await client.query(`ALTER TABLE scrape_runs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;`);
    await client.query(`ALTER TABLE scrape_runs ADD COLUMN IF NOT EXISTS metadata JSONB;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      INSERT INTO tenants (name, slug)
      VALUES ('NTS Demo Agency', 'nts-demo')
      ON CONFLICT (slug) DO NOTHING;
    `);

    const tenantResult = await client.query(`SELECT id FROM tenants WHERE slug = 'nts-demo' LIMIT 1;`);
    const tenantId = tenantResult.rows[0]?.id;

    if (tenantId) {
      await client.query(`
        INSERT INTO icp_configs (
          tenant_id, industries, geographies, seniority_levels, custom_qualifiers
        ) VALUES (
          $1,
          ARRAY['Fintech', 'E-commerce', 'Retail'],
          ARRAY['Egypt', 'KSA'],
          ARRAY['Manager', 'Director', 'C-Level'],
          'Prioritize companies with active hiring signals and visible growth momentum.'
        )
        ON CONFLICT (tenant_id) DO NOTHING;
      `, [tenantId]);
    }

    console.log('PostgreSQL initialized with multi-tenant schema.');
  } finally {
    client.release();
  }
}

export async function getDefaultTenantId(): Promise<number> {
  const result = await pool.query(`SELECT id FROM tenants WHERE slug = 'nts-demo' LIMIT 1;`);
  if (!result.rows[0]?.id) {
    throw new Error('Default tenant not found');
  }
  return result.rows[0].id;
}

export async function getTenantIcpConfig(tenantId: number) {
  const result = await pool.query(`SELECT * FROM icp_configs WHERE tenant_id = $1 LIMIT 1;`, [tenantId]);
  return result.rows[0] || null;
}
