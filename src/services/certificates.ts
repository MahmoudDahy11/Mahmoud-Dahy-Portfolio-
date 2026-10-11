import { fetchOneOrThrow, fetchRows, getSupabaseClient, toDatabaseRow } from './base'
import { toFieldOption } from '@/utils/toFieldOption'
import type { CertificateValues } from '@/schemas/certificate'
import type { Certificate, Row } from '@/types/entities'

function toCertificate(row: Row<'certificates'>): Certificate {
  return { ...row, field: toFieldOption(row.field) }
}

/** Published certificates, newest first. */
export async function getCertificates(): Promise<Certificate[]> {
  const rows = await fetchRows<'certificates'>(
    () =>
      getSupabaseClient()
        .from('certificates')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('issued_on', { ascending: false, nullsFirst: false }),
    'Could not load the certificates.',
  )
  return rows.map(toCertificate)
}

/** Every certificate, including drafts, for the admin table. */
export async function getAllCertificates(): Promise<Certificate[]> {
  const rows = await fetchRows<'certificates'>(
    () =>
      getSupabaseClient()
        .from('certificates')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('issued_on', { ascending: false, nullsFirst: false }),
    'Could not load the certificates.',
  )
  return rows.map(toCertificate)
}

export async function createCertificate(values: CertificateValues): Promise<Certificate> {
  const row = await fetchOneOrThrow<'certificates'>(
    () =>
      getSupabaseClient()
        .from('certificates')
        .insert(toDatabaseRow<'certificates'>(values))
        .select()
        .limit(1),
    'Could not save the certificate.',
  )
  return toCertificate(row)
}

export async function updateCertificate(id: string, values: CertificateValues): Promise<Certificate> {
  const row = await fetchOneOrThrow<'certificates'>(
    () =>
      getSupabaseClient()
        .from('certificates')
        .update(toDatabaseRow<'certificates'>(values))
        .eq('id', id)
        .select()
        .limit(1),
    'Could not save the certificate.',
  )
  return toCertificate(row)
}

export async function deleteCertificate(id: string): Promise<void> {
  await fetchRows<'certificates'>(
    () => getSupabaseClient().from('certificates').delete().eq('id', id).select(),
    'Could not delete the certificate.',
  )
}
