import type { FieldFilter } from '@/constants/fields'
import type { Certificate } from '@/types/entities'

export function filterCertificatesByField(
  certificates: Certificate[],
  filter: FieldFilter,
): Certificate[] {
  if (filter === 'all') return certificates
  return certificates.filter((certificate) => certificate.field === filter)
}
