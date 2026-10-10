import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useCrudMutations } from '@/lib/crudMutations'
import { createService, deleteService, getAllServices, getServices, updateService } from '@/services/services'
import type { ServiceValues } from '@/schemas/service'

/** Published services, in owner-defined order. */
export function useServices() {
  return useQuery({
    queryKey: queryKeys.services.list(),
    queryFn: getServices,
  })
}

/** Every service, drafts included. The admin table is the only caller. */
export function useAllServices() {
  return useQuery({
    queryKey: queryKeys.services.all(),
    queryFn: getAllServices,
  })
}

/** Create, update, and delete for services. */
export function useServiceMutations() {
  return useCrudMutations<ServiceValues, { id: string; values: ServiceValues }>({
    queryKey: queryKeys.services.all(),
    relatedKeys: [queryKeys.services.list()],
    create: createService,
    update: ({ id, values }) => updateService(id, values),
    remove: deleteService,
    messages: {
      created: 'Service added.',
      updated: 'Service saved.',
      deleted: 'Service deleted.',
    },
  })
}
