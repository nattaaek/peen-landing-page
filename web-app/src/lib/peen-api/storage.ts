import { apiJson } from './client'

export interface StorageUploadResult {
  public_url: string
  path: string
}

export async function uploadFile(
  accessToken: string,
  bucket: 'avatars' | 'route-photos' | 'approach-gpx',
  path: string,
  contentType: string,
  base64Data: string,
): Promise<StorageUploadResult> {
  return apiJson<StorageUploadResult>('/v1/storage/upload', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({
      bucket,
      path,
      content_type: contentType,
      data_base64: base64Data,
    }),
  })
}
