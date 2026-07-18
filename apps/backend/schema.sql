CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    website_url TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    trade TEXT,
    city TEXT,
    lead_status TEXT CHECK(lead_status IN ('pending','processing','audited','drafted',
        'validated','sent','converted','failed')) DEFAULT 'pending',
    fail_reason TEXT,
    audit_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);

CREATE TABLE IF NOT EXISTS outreach_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id TEXT NOT NULL REFERENCES leads(id),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    qa_score INTEGER,
    approved_by TEXT,
    resend_message_id TEXT,
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    replied_at TIMESTAMP,
    reply_sentiment TEXT,
    consult_json TEXT,                            -- Sales Rep click-through review of the draft
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppression (
    email TEXT PRIMARY KEY,
    reason TEXT CHECK(reason IN ('unsubscribe','hard_bounce','complaint','manual')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- The token ledger. est_cost_usd is 0 for dry-run/claude-code/ollama runs:
-- those modes never bill per token. Only mode=api runs record a real cost.
CREATE TABLE IF NOT EXISTS agent_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    model TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'dry-run',
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    est_cost_usd REAL NOT NULL DEFAULT 0,
    duration_ms INTEGER,
    lead_id TEXT REFERENCES leads(id),
    ran_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_runs_day ON agent_runs(ran_at);

CREATE TABLE IF NOT EXISTS daily_metrics (
    day TEXT PRIMARY KEY,
    leads_in INTEGER, audited INTEGER, drafted INTEGER, sent INTEGER,
    opens INTEGER, replies INTEGER, positives INTEGER, calls_booked INTEGER,
    bounces INTEGER, unsubscribes INTEGER,
    est_spend_usd REAL,
    digest_md TEXT
);

CREATE TABLE IF NOT EXISTS system_skills (
    id TEXT PRIMARY KEY,
    skill_name TEXT NOT NULL,
    description TEXT NOT NULL,
    file_path TEXT NOT NULL,
    code_body TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending_review','active','disabled')) DEFAULT 'pending_review',
    generated_by_agent TEXT DEFAULT 'dev_agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS episodic_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id TEXT REFERENCES leads(id),
    vector_tag TEXT NOT NULL,
    memory_payload TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sprint 3: incoming replies + the Sales Rep's classification and suggested
-- follow-up. A follow-up never sends itself — status flips to 'sent' only
-- through the human-triggered endpoint.
CREATE TABLE IF NOT EXISTS reply_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    outreach_id INTEGER NOT NULL REFERENCES outreach_emails(id),
    lead_id TEXT NOT NULL REFERENCES leads(id),
    reply_text TEXT NOT NULL,
    sentiment TEXT,
    intent TEXT,
    urgency INTEGER,
    action TEXT,
    suggested_reply TEXT,
    status TEXT CHECK(status IN ('pending','sent','dismissed')) DEFAULT 'pending',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tiny operational flags (e.g. send_paused after a bounce spike).
CREATE TABLE IF NOT EXISTS kv (
    k TEXT PRIMARY KEY,
    v TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
