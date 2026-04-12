import {
  createRequest,
  getAllRequests,
  getFinanceGroupsService,
  getMyRequests,
  getOwnRequestById,
  updateManagerFields,
  updateOwnRequest,
  type ManagerRequestsFilters,
  type MyRequestsFilters,
} from "@/lib/services/requests-service"

export type { ManagerRequestsFilters, MyRequestsFilters }

export const getFinanceGroups = getFinanceGroupsService
export const createPaymentRequest = createRequest
export const getMyPaymentRequests = getMyRequests
export const getMyPaymentRequestById = getOwnRequestById
export const getAllPaymentRequests = getAllRequests
export const updateMyPaymentRequest = updateOwnRequest
export const managerUpdatePaymentRequest = updateManagerFields
