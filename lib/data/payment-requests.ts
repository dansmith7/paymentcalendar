import {
  createRequest,
  duplicateOwnRequest,
  getAllRequests,
  getFinanceGroupsService,
  getMyRequests,
  getOwnRequestById,
  addPaymentToRequest,
  cancelPaymentInRequest,
  softDeleteRequest,
  updateManagerFields,
  updateOwnRequest,
  type ManagerRequestsFilters,
  type MyRequestsFilters,
} from "@/lib/services/requests-service"

export type { ManagerRequestsFilters, MyRequestsFilters }

export const getFinanceGroups = getFinanceGroupsService
export const createPaymentRequest = createRequest
export const duplicateMyPaymentRequest = duplicateOwnRequest
export const getMyPaymentRequests = getMyRequests
export const getMyPaymentRequestById = getOwnRequestById
export const getAllPaymentRequests = getAllRequests
export const updateMyPaymentRequest = updateOwnRequest
export const managerUpdatePaymentRequest = updateManagerFields
export const softDeletePaymentRequest = softDeleteRequest
export const addPaymentToPaymentRequest = addPaymentToRequest
export const cancelPaymentRequestPayment = cancelPaymentInRequest
