import { describe, expect, it } from 'vitest'
import { filterCertificatesByField } from '@/features/certificates/filter'
import { certificateToFormValues, EMPTY_CERTIFICATE } from '@/features/certificates/CertificateDialog'
import type { Certificate } from '@/types/entities'

const makeCert = (field: 'software' | 'elv'): Certificate => {
  return {
    id: 'c1',
    title: 'Cert',
    issuer: null,
    issuedOn: null,
    credentialId: null,
    credentialUrl: null,
    imagePath: null,
    sortOrder: 0,
    isPublished: true,
    createdAt: '2026-10-06T14:41:38Z',
    updatedAt: '2026-10-06T14:41:38Z',
    field,
  } as unknown as Certificate
}

describe('certificate field filter', () => {
  it('returns all when "all"', () => {
    const list = [makeCert('software'), makeCert('elv')]
    expect(filterCertificatesByField(list, 'all')).toHaveLength(2)
  })
  it('filters by field', () => {
    const list = [makeCert('software'), makeCert('elv')]
    expect(filterCertificatesByField(list, 'elv')).toHaveLength(1)
    expect(filterCertificatesByField(list, 'software')).toHaveLength(1)
  })
})

describe('certificate form defaults', () => {
  it('sets EMPTY_CERTIFICATE.field to software', () => {
    expect(EMPTY_CERTIFICATE.field).toBe('software')
  })
  it('maps field from stored cert', () => {
    const cert = makeCert('elv')
    const vals = certificateToFormValues(cert)
    expect(vals.field).toBe('elv')
  })
})
