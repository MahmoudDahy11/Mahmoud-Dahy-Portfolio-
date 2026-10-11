import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/constants/validation'
import { FIELD_OPTIONS } from '@/constants/fields'
import { optionalDate, optionalText, optionalUrl, requiredText, sortOrderField } from './fields'

/**
 * A certificate.
 *
 * `imagePath` holds the badge image shown on the public page, and `credentialUrl` links to
 * the issuing body's own verification page. Both are optional — plenty of certificates
 * have neither — so the form never requires a link the owner does not have.
 */
export const certificateSchema = z.object({
  title: requiredText('Title', VALIDATION_LIMITS.certificateTitle),
  issuer: optionalText(VALIDATION_LIMITS.issuer.max, 'Issuer'),
  issuedOn: optionalDate('Issue date'),
  credentialId: optionalText(VALIDATION_LIMITS.credentialId.max, 'Credential ID'),
  credentialUrl: optionalUrl('Credential URL'),
  imagePath: optionalText(VALIDATION_LIMITS.url.max, 'Image'),
  sortOrder: sortOrderField,
  isPublished: z.boolean(),
  field: z.enum(FIELD_OPTIONS),
})

export type CertificateValues = z.infer<typeof certificateSchema>
