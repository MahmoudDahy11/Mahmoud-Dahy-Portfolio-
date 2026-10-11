import { useMemo, useState } from 'react'
import { BadgeCheck, ExternalLink } from 'lucide-react'
import { ImageLightbox, type LightboxImage } from '@/components/common/ImageLightbox'
import { Container, Section } from '@/components/common/Section'
import { SectionHeading } from '@/components/common/SectionHeading'
import { QueryState } from '@/components/common/QueryState'
import { FieldSelector } from '@/components/common/FieldSelector'
import { useCertificates, filterCertificatesByField } from '@/features/certificates'
import { FIELD_LABELS, FIELD_OPTIONS, ALL_FIELDS, type FieldFilter } from '@/constants/fields'
import { usePageSeo } from '@/hooks/useSeo'
import { imageUrl } from '@/services/mediaUrls'
import { formatDate } from '@/utils/formatDate'

/** One certificate, with its credential image and verification link. */
function CertificateCard({
  certificate,
  previewIndex,
  onPreview,
}: {
  certificate: {
    id: string
    title: string
    issuer: string | null
    issuedOn: string | null
    credentialId: string | null
    credentialUrl: string | null
    imagePath: string | null
  }
  previewIndex: number | null
  onPreview: (index: number) => void
}) {
  const image = imageUrl(certificate.imagePath)
  const issued = formatDate(certificate.issuedOn, { year: 'numeric', month: 'long' })

  return (
    <article className="flex flex-col gap-4 border-b border-border py-7 first:border-t sm:flex-row sm:gap-6">
      {image && previewIndex !== null ? (
        <button
          type="button"
          className="group w-full shrink-0 rounded text-left focus-visible:outline-ring sm:w-44"
          onClick={() => onPreview(previewIndex)}
          aria-label={`Preview ${certificate.title} certificate`}
        >
          <img
            src={image}
            alt={`${certificate.title} certificate`}
            className="border-border w-full rounded border object-contain transition duration-(--motion-duration) group-hover:brightness-95"
            loading="lazy"
          />
        </button>
      ) : null}

      <div className="space-y-1">
        <h2 className="flex items-start gap-2 text-lg font-semibold tracking-tight">
          <BadgeCheck className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
          {certificate.title}
        </h2>

        {certificate.issuer ? (
          <p className="text-muted-foreground text-sm">{certificate.issuer}</p>
        ) : null}

        {issued ? <p className="text-muted-foreground text-sm">Issued {issued}</p> : null}

        {certificate.credentialId ? (
          <p className="text-muted-foreground font-mono text-xs">
            Credential ID: {certificate.credentialId}
          </p>
        ) : null}

        {certificate.credentialUrl ? (
          <a
            href={certificate.credentialUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary inline-flex items-center gap-1.5 pt-1 text-sm font-medium hover:underline"
          >
            Verify credential
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </article>
  )
}

/** Published certificates, newest first. */
export default function CertificatesPage() {
  const [field, setField] = useState<FieldFilter>(ALL_FIELDS)
  const certificates = useCertificates()
  const allCertificates = certificates.data ?? []

  const availableFields = FIELD_OPTIONS.filter((option) =>
    allCertificates.some((certificate) => certificate.field === option),
  )
  const filterOptions: FieldFilter[] = [ALL_FIELDS, ...availableFields]
  const activeField = filterOptions.includes(field) ? field : ALL_FIELDS
  const visibleCertificates = filterCertificatesByField(allCertificates, activeField)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const certificateImages = useMemo<LightboxImage[]>(() => {
    return (certificates.data ?? []).flatMap((certificate) => {
      const src = imageUrl(certificate.imagePath)
      if (!src) return []

      return [
        {
          src,
          alt: `${certificate.title} certificate`,
          label: certificate.title,
        },
      ]
    })
  }, [certificates.data])

  const previewIndexesByCertificateId = useMemo(() => {
    const indexes = new Map<string, number>()

    ;(certificates.data ?? []).forEach((certificate) => {
      if (!imageUrl(certificate.imagePath)) return
      indexes.set(certificate.id, indexes.size)
    })

    return indexes
  }, [certificates.data])

  usePageSeo({
    section: 'Certificates',
    description: 'Professional certifications and credentials.',
  })

  return (
    <Section>
      <Container>
        <SectionHeading
          title="Certificates"
          description="Professional certifications and credentials."
          headingLevel="h1"
        />

        {availableFields.length > 0 ? (
          <div className="mb-6 space-y-2">
            <FieldSelector
              includeAll
              options={filterOptions}
              value={activeField}
              onChange={setField}
              ariaLabel="Filter certificates by field"
            />
            {activeField !== ALL_FIELDS ? (
              <p className="text-muted-foreground text-sm">
                Showing certificates in {FIELD_LABELS[activeField]}.
              </p>
            ) : null}
          </div>
        ) : null}

        <QueryState
          isLoading={certificates.isLoading}
          isError={certificates.isError}
          error={certificates.error}
          data={visibleCertificates}
          skeletonRows={3}
          emptyTitle={
            activeField === ALL_FIELDS
              ? 'No certificates added yet'
              : `No ${FIELD_LABELS[activeField]} certificates added yet`
          }
          emptyDescription={
            activeField === ALL_FIELDS
              ? 'Certificates will appear here once they are published.'
              : `Certificates in ${FIELD_LABELS[activeField]} will appear here once they are published.`
          }
          emptyIcon={BadgeCheck}
          onRetry={() => void certificates.refetch()}
        >
          {(data) => (
            <div>
              {data.map((certificate) => (
                <CertificateCard
                  key={certificate.id}
                  certificate={certificate}
                  previewIndex={previewIndexesByCertificateId.get(certificate.id) ?? null}
                  onPreview={setPreviewIndex}
                />
              ))}
            </div>
          )}
        </QueryState>

        <ImageLightbox
          images={certificateImages}
          currentIndex={previewIndex}
          onChange={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      </Container>
    </Section>
  )
}
