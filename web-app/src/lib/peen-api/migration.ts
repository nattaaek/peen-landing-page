import { apiJson } from './client'

export type MigrationDomain =
  | 'routes'
  | 'climbs'
  | 'social'
  | 'community'
  | 'seasonal'
  | 'notifications'

export async function migrationInvoke<T>(
  domain: MigrationDomain,
  op: string,
  params: Record<string, unknown>,
  accessToken: string,
): Promise<T> {
  return apiJson<T>(`/v1/migration/${domain}`, {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ op, params }),
  })
}

export async function migrationInvokeVoid(
  domain: MigrationDomain,
  op: string,
  params: Record<string, unknown>,
  accessToken: string,
): Promise<void> {
  await migrationInvoke<unknown>(domain, op, params, accessToken)
}
