import { fetchOneOrThrow, fetchRows, getSupabaseClient, toDatabaseRow } from './base'
import type { ServiceValues } from '@/schemas/service'
import type { Service } from '@/types/entities'

/** The services offered, in owner-defined order. */
export async function getServices(): Promise<Service[]> {
  return fetchRows<'services'>(
    () =>
      getSupabaseClient()
        .from('services')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true }),
    'Could not load the services.',
  )
}

/** Every service, including drafts, for the admin table. */
export async function getAllServices(): Promise<Service[]> {
  return fetchRows<'services'>(
    () =>
      getSupabaseClient()
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true }),
    'Could not load the services.',
  )
}

export function createService(values: ServiceValues): Promise<Service> {
  return fetchOneOrThrow<'services'>(
    () =>
      getSupabaseClient().from('services').insert(toDatabaseRow<'services'>(values)).select().limit(1),
    'Could not save the service.',
  )
}

export function updateService(id: string, values: ServiceValues): Promise<Service> {
  return fetchOneOrThrow<'services'>(
    () =>
      getSupabaseClient()
        .from('services')
        .update(toDatabaseRow<'services'>(values))
        .eq('id', id)
        .select()
        .limit(1),
    'Could not save the service.',
  )
}

export async function deleteService(id: string): Promise<void> {
  await fetchRows<'services'>(
    () => getSupabaseClient().from('services').delete().eq('id', id).select(),
    'Could not delete the service.',
  )
}
