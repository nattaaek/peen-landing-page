import { apiJson } from './client'
import type { ApiArea, ApiGym, ApiRoute } from '../../types/api'

export async function catalogAreas(): Promise<ApiArea[]> {
  return apiJson<ApiArea[]>('/v1/catalog/areas')
}

export async function catalogGyms(): Promise<ApiGym[]> {
  return apiJson<ApiGym[]>('/v1/catalog/gyms')
}

export async function catalogRoutes(page = 0, limit = 50): Promise<ApiRoute[]> {
  const q = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  return apiJson<ApiRoute[]>(`/v1/catalog/routes?${q}`)
}

export async function catalogRoute(id: string): Promise<ApiRoute> {
  return apiJson<ApiRoute>(`/v1/catalog/routes/${id}`)
}
