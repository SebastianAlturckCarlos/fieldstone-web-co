// The Skill Factory safety contract (Master_Blueprint Part III).
// Skills get ONLY the capabilities their manifest declares — the SkillContext
// they receive physically lacks everything else. No fs, no child_process,
// no env access. Capability injection, not trust.

export type Capability = 'http_get' | 'db_read' | 'db_write' | 'file_read_workspace'

export interface SkillManifest {
  name: string
  description: string
  version: string
  capabilities: Capability[]
}

export interface SkillContext {
  httpGet?(url: string): Promise<string>          // 10s timeout, GET only, no auth headers
  dbRead?(sql: string, params?: unknown[]): unknown[]
  dbWrite?(sql: string, params?: unknown[]): void
  readWorkspaceFile?(relPath: string): string     // jailed to workspace root
  log(msg: string): void
}

export interface SkillResult {
  ok: boolean
  data?: unknown
  error?: string
}

export abstract class BaseSkill {
  static manifest: SkillManifest
  constructor(protected ctx: SkillContext) {}
  abstract execute(input: unknown): Promise<SkillResult>
}
