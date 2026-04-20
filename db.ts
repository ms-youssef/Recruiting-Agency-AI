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
        tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        company TEXT,
        title TEXT,
        industry TEXT,
        seniority TEXT,
        salary TEXT,
        location TEXT,
        source_url TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
