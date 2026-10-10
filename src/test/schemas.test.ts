import { describe, expect, it } from 'vitest'
import {
  certificateSchema,
  contactSchema,
  loginSchema,
  mediaDetailsSchema,
  optionalNumberField,
  profileSchema,
  siteSettingsSchema,
} from '@/schemas'

describe('loginSchema', () => {
  it('accepts a well-formed email and password', () => {
    const result = loginSchema.safeParse({ email: 'admin@example.com', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email with a readable message', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Enter a valid email address.')
    }
  })

  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'admin@example.com', password: '' }).success).toBe(false)
  })
})

describe('contactSchema', () => {
  const valid = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    subject: 'Hello',
    message: 'This is a message long enough to pass validation.',
    website: '',
  }

  it('accepts a complete submission', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a too-short message', () => {
    const result = contactSchema.safeParse({ ...valid, message: 'hi' })
    expect(result.success).toBe(false)
  })

  it('treats the honeypot field as optional', () => {
    const withoutHoneypot: Record<string, unknown> = { ...valid }
    delete withoutHoneypot.website

    expect(contactSchema.safeParse(withoutHoneypot).success).toBe(true)
  })
})

describe('profileSchema', () => {
  const valid = {
    fullName: 'Mahmoud Dahy',
    headline: 'Flutter & Front-End Developer',
    shortBio: 'A short bio.',
    bio: 'A longer bio.',
    location: 'Cairo, Egypt',
    email: 'owner@example.com',
    phone: '+20 100 000 0000',
    availabilityStatus: 'Available for new projects',
    avatarPath: '',
    coverPath: '',
    resumePath: '',
  }

  it('accepts a profile with no media uploaded', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts the storage paths the upload fields write', () => {
    const result = profileSchema.safeParse({
      ...valid,
      avatarPath: 'profile/me-1a2b3c4d.png',
      coverPath: 'profile/cover-9f8e7d6c.jpg',
      resumePath: 'profile/cv-5f4e3d2c.pdf',
    })

    expect(result.success).toBe(true)
  })

  it('rejects a URL pasted into a storage path field', () => {
    // The columns hold object keys. A URL here would render as a broken image, because
    // `imageUrl` builds an address from the path rather than using one that was given.
    const result = profileSchema.safeParse({
      ...valid,
      avatarPath: 'https://example.supabase.co/storage/v1/object/public/portfolio-media/me.png',
    })

    expect(result.success).toBe(false)
  })

  it('rejects a storage path longer than the column allows', () => {
    const result = profileSchema.safeParse({ ...valid, avatarPath: 'a'.repeat(301) })
    expect(result.success).toBe(false)
  })

  it('treats a blank email as valid, since email is optional', () => {
    expect(profileSchema.safeParse({ ...valid, email: '' }).success).toBe(true)
  })

  it('rejects a malformed email', () => {
    expect(profileSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('parses a cleared years-of-experience field to an explicit null', () => {
    // `undefined` is dropped by the service layer, so a save would leave the old value in
    // place and appear to do nothing. The cleared field must reach the row as `null`.
    const result = profileSchema.safeParse({ ...valid, yearsOfExperience: '' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.yearsOfExperience).toBeNull()
    }
  })

  it('leaves an absent years-of-experience key undefined, so an untouched form cannot clear it', () => {
    const result = profileSchema.safeParse(valid)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.yearsOfExperience).toBeUndefined()
    }
  })
})

describe('optionalNumberField', () => {
  const field = optionalNumberField('Test', { min: 0, max: 100 })

  it('accepts a number', () => {
    const result = field.safeParse(6)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe(6)
    }
  })

  it('turns the browser empty string into an explicit null', () => {
    const result = field.safeParse('')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeNull()
    }
  })

  it('turns a null input into null, since the form can receive one from a row', () => {
    const result = field.safeParse(null)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeNull()
    }
  })

  it('leaves an absent key undefined, so an untouched form is not treated as a clear', () => {
    const result = field.safeParse(undefined)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeUndefined()
    }
  })

  it('rejects a value over the maximum', () => {
    expect(field.safeParse(150).success).toBe(false)
  })

  it('rejects text that is not a number', () => {
    expect(field.safeParse('soon').success).toBe(false)
  })
})

describe('siteSettingsSchema', () => {
  const valid = {
    siteTitle: 'Mahmoud Dahy — Portfolio',
    metaDescription: 'A portfolio.',
    footerText: 'Built with React and Supabase.',
    copyrightText: '',
    ogImagePath: '',
    defaultTheme: 'system',
    showAvailabilityBadge: true,
  }

  it('accepts settings with no social preview image', () => {
    expect(siteSettingsSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts each of the three themes', () => {
    for (const defaultTheme of ['light', 'dark', 'system'] as const) {
      expect(siteSettingsSchema.safeParse({ ...valid, defaultTheme }).success).toBe(true)
    }
  })

  it('rejects a theme the database check constraint would refuse', () => {
    expect(siteSettingsSchema.safeParse({ ...valid, defaultTheme: 'sepia' }).success).toBe(false)
  })

  it('requires a site title, because every page title is built from it', () => {
    expect(siteSettingsSchema.safeParse({ ...valid, siteTitle: '' }).success).toBe(false)
  })

  it('rejects a social preview path that is really a URL', () => {
    const result = siteSettingsSchema.safeParse({
      ...valid,
      ogImagePath: 'https://example.com/og.png',
    })

    expect(result.success).toBe(false)
  })
})

describe('certificateSchema', () => {
  const valid = {
    title: 'Flutter Certified',
    issuer: 'Google',
    issuedOn: '2025-03-01',
    credentialId: 'ABC123',
    credentialUrl: '',
    imagePath: '',
    sortOrder: 0,
    isPublished: false,
  }

  it('accepts a certificate with neither a badge nor a credential link', () => {
    expect(certificateSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a certificate with no title', () => {
    expect(certificateSchema.safeParse({ ...valid, title: '' }).success).toBe(false)
  })

  it('rejects a credential URL that is not absolute, so a typo cannot become a dead link', () => {
    const result = certificateSchema.safeParse({ ...valid, credentialUrl: 'example.com/verify' })
    expect(result.success).toBe(false)
  })
})

describe('mediaDetailsSchema', () => {
  it('accepts a blank alt text, because documents have none', () => {
    expect(mediaDetailsSchema.safeParse({ altText: '' }).success).toBe(true)
  })

  it('rejects alt text past the column limit', () => {
    expect(mediaDetailsSchema.safeParse({ altText: 'a'.repeat(201) }).success).toBe(false)
  })
})
