import { fetchOneOrThrow, fetchRows, getSupabaseClient, toDatabaseRow } from './base'
import type { CertificateValues } from '@/schemas/certificate'
import type { Certificate } from '@/types/entities'

/** Published certificates, newest first. */
export async function getCertificates(): Promise<Certificate[]> {
  return fetchRows<'certificates'>(
    () =>
      getSupabaseClient()
        .from('certificates')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('issued_on', { ascending: false, nullsFirst: false }),
    'Could not load the certificates.',
  )
}

/** Every certificate, including drafts, for the admin table. */
export async function getAllCertificates(): Promise<Certificate[]> {
  return fetchRows<'certificates'>(
    () =>
      getSupabaseClient()
        .from('certificates')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('issued_on', { ascending: false, nullsFirst: false }),
    'Could not load the certificates.',
  )
}

export function createCertificate(values: CertificateValues): Promise<Certificate> {
  return fetchOneOrThrow<'certificates'>(
    () =>
      getSupabaseClient()
        .from('certificates')
        .insert(toDatabaseRow<'certificates'>(values))
        .select()
        .limit(1),
    'Could not save the certificate.',
  )
}

export function updateCertificate(id: string, values: CertificateValues): Promise<Certificate> {
  return fetchOneOrThrow<'certificates'>(
    () =>
      getSupabaseClient()
        .from('certificates')
        .update(toDatabaseRow<'certificates'>(values))
        .eq('id', id)
        .select()
        .limit(1),
    'Could not save the certificate.',
  )
}

export async function deleteCertificate(id: string): Promise<void> {
  await fetchRows<'certificates'>(
    () => getSupabaseClient().from('certificates').delete().eq('id', id).select(),
    'Could not delete the certificate.',
  )
}
