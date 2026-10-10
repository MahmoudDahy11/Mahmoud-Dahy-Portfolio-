import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useCrudMutations } from '@/lib/crudMutations'
import {
  createCertificate,
  deleteCertificate,
  getAllCertificates,
  getCertificates,
  updateCertificate,
} from '@/services/certificates'
import type { CertificateValues } from '@/schemas/certificate'

/** Published certificates, newest first. */
export function useCertificates() {
  return useQuery({
    queryKey: queryKeys.certificates.list(),
    queryFn: getCertificates,
  })
}

/** Every certificate, drafts included. The admin table is the only caller. */
export function useAllCertificates() {
  return useQuery({
    queryKey: queryKeys.certificates.all(),
    queryFn: getAllCertificates,
  })
}

/** Create, update, and delete for certificates. */
export function useCertificateMutations() {
  return useCrudMutations<CertificateValues, { id: string; values: CertificateValues }>({
    queryKey: queryKeys.certificates.all(),
    relatedKeys: [queryKeys.certificates.list()],
    create: createCertificate,
    update: ({ id, values }) => updateCertificate(id, values),
    remove: deleteCertificate,
    messages: {
      created: 'Certificate added.',
      updated: 'Certificate saved.',
      deleted: 'Certificate deleted.',
    },
  })
}
