import { db } from '../core/database.js'

// 10 fictional KC-metro trade shops for dry-run testing.
// Real leads replace these via CSV import in Phase 0.
const TEST_LEADS = [
  ['Comfort King Heating & Air', 'hvac', 'Kansas City'],
  ['Blue Valley Plumbing Co', 'plumbing', 'Overland Park'],
  ['Ampere Electric Services', 'electrical', 'Olathe'],
  ['Prairie Air Mechanical', 'hvac', 'Shawnee'],
  ['Summit Drain & Sewer', 'plumbing', "Lee's Summit"],
  ['Heartland Wiring Solutions', 'electrical', 'Kansas City'],
  ['TrueFlow Plumbing & Gas', 'plumbing', 'Olathe'],
  ['Cornerstone Climate Control', 'hvac', 'Overland Park'],
  ['Meridian Electric Co', 'electrical', 'Shawnee'],
  ['RiverBend Mechanical', 'hvac', "Lee's Summit"],
]

const insert = db.prepare(
  `INSERT OR IGNORE INTO leads (id, company_name, website_url, contact_email, trade, city)
   VALUES (?, ?, ?, ?, ?, ?)`,
)

let added = 0
for (const [name, trade, city] of TEST_LEADS) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const r = insert.run(`lead_${slug}`, name, `https://${slug}.example.com`, `owner@${slug}.example.com`, trade, city)
  added += r.changes
}
console.log(`Seeded ${added} lead(s) (${TEST_LEADS.length - added} already existed).`)

// One sample pending skill so the Skill Factory review queue is exercisable
// before the Dev Agent writes real ones.
db.prepare(
  `INSERT OR IGNORE INTO system_skills (id, skill_name, description, file_path, code_body, status)
   VALUES (?, ?, ?, ?, ?, 'pending_review')`,
).run(
  'skill_sample_csv_import',
  'lead_csv_import',
  'Parses a CSV of leads from the workspace and inserts new rows into the leads table. Capabilities: file_read_workspace, db_write.',
  'src/skills/auto_gen/lead_csv_import.ts',
  `import { BaseSkill, SkillContext, SkillResult } from '../base_skill.js'

export class LeadCsvImport extends BaseSkill {
  static manifest = {
    name: 'lead_csv_import',
    description: 'Import leads from workspace CSV (company,website,email,trade,city)',
    version: '1.0.0',
    capabilities: ['file_read_workspace', 'db_write'] as const,
  }

  async execute(input: { path: string }): Promise<SkillResult> {
    if (!input?.path?.endsWith('.csv')) return { ok: false, error: 'expected a .csv path' }
    const raw = this.ctx.readWorkspaceFile!(input.path)
    let inserted = 0
    for (const line of raw.split('\\n').slice(1)) {
      const [company, website, email, trade, city] = line.split(',').map(s => s?.trim())
      if (!company || !email) continue
      this.ctx.dbWrite!(
        \`INSERT OR IGNORE INTO leads (id, company_name, website_url, contact_email, trade, city)
         VALUES (?, ?, ?, ?, ?, ?)\`,
        ['lead_' + company.toLowerCase().replace(/[^a-z0-9]+/g, '-'), company, website, email, trade, city],
      )
      inserted++
    }
    this.ctx.log(\`imported \${inserted} lead(s)\`)
    return { ok: true, data: { inserted } }
  }
}`,
)
console.log('Seeded sample skill for the review queue.')
