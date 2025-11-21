export const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://lusciously-magnetic-lamprey.cloudpub.ru/'

console.log('[API] Base URL:', API_BASE_URL, '(DEV:', import.meta.env.DEV, ')')

export type Group = {
  id: number
  create_at: string
}

export type LapData = {
  have_problems?: boolean
  groups?: Group[]
} | Group[]

export type LapsResponse = {
  [lapId: string]: LapData
}

export function getGroupsFromLapData(lapData: LapData): Group[] {
  if (Array.isArray(lapData)) {
    return lapData
  }
  if (lapData && typeof lapData === 'object' && 'groups' in lapData) {
    return lapData.groups || []
  }
  return []
}

export type CreateGroupResponse = {
  id: number
}

export type DetectPhotoResponse = {
  group_id?: number
  image_uid?: string
  message?: string
}

export async function detectPhoto(groupId: string | number, file: File): Promise<DetectPhotoResponse> {
  const url = `${API_BASE_URL}/detect?group_id=${encodeURIComponent(groupId)}`
  const requestContentType = file.type || 'application/octet-stream'

  try {
    const response: Response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': requestContentType,
      },
      body: file,
    })

    if (!response.ok) {
      let errorText = ''
      let errorJson = null

      try {
        errorText = await response.text()
        console.error('[API] Detect error response text:', errorText)

        if (errorText) {
          // Проверяем, является ли ответ HTML (например, страница ошибки 503)
          if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
            if (response.status === 503) {
              throw new Error('Сервис временно недоступен. Пожалуйста, попробуйте позже.')
            }
            throw new Error(`Сервер вернул ошибку ${response.status}. Сервис может быть временно недоступен.`)
          }
          
          try {
            errorJson = JSON.parse(errorText)
            console.error('[API] Detect error response JSON:', errorJson)
          } catch {
            void 0
          }
        }
      } catch (e) {
        console.error('[API] Failed to read detect error response:', e)
        if (e instanceof Error) {
          throw e
        }
      }

      // Для 503 показываем понятное сообщение
      if (response.status === 503) {
        throw new Error('Сервис временно недоступен. Пожалуйста, попробуйте позже.')
      }

      const errorMessage = errorJson?.message || errorText || response.statusText
      throw new Error(`Failed to process photo (${response.status}): ${errorMessage}`)
    }

    const responseContentType = response.headers.get('Content-Type') || ''
    const rawBody = await response.text()

    if (!rawBody.trim()) {
      return { group_id: typeof groupId === 'number' ? groupId : Number.parseInt(String(groupId), 10) }
    }

    if (!responseContentType.toLowerCase().includes('application/json')) {
      console.error('[API] Unexpected detect response body:', rawBody)
      throw new Error(`Сервер вернул данные в неподдерживаемом формате: ${responseContentType || 'unknown'}`)
    }

    let data: DetectPhotoResponse
    try {
      data = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('[API] Failed to parse detect response JSON:', parseError, rawBody)
      throw new Error('Не удалось прочитать ответ сервера (некорректный JSON)')
    }

    console.log('[API] Detect photo success:', data)
    return data
  } catch (error) {
    console.error('[API] Failed to detect photo:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to detect photo: ${String(error)}`)
  }
}

export async function createGroup(lapId: string): Promise<number> {
  const url = `${API_BASE_URL}/groups/create?lap_id=${lapId}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let errorText = ''
      let errorJson = null
      
      try {
        errorText = await response.text()
        console.error('[API] Error response text:', errorText)
        
        if (errorText) {
          // Проверяем, является ли ответ HTML (например, страница ошибки 503)
          if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
            if (response.status === 503) {
              throw new Error('Сервис временно недоступен. Пожалуйста, попробуйте позже.')
            }
            throw new Error(`Сервер вернул ошибку ${response.status}. Сервис может быть временно недоступен.`)
          }
          
          try {
            errorJson = JSON.parse(errorText)
            console.error('[API] Error response JSON:', errorJson)
          } catch {
            void 0
          }
        }
      } catch (e) {
        console.error('[API] Failed to read error response:', e)
        if (e instanceof Error) {
          throw e
        }
      }
      
      // Для 503 показываем понятное сообщение
      if (response.status === 503) {
        throw new Error('Сервис временно недоступен. Пожалуйста, попробуйте позже.')
      }
      
      const errorMessage = errorJson?.message || errorText || response.statusText
      throw new Error(`Failed to create group (${response.status}): ${errorMessage}`)
    }

    const data: CreateGroupResponse = await response.json()
    return data.id
  } catch (error) {
    console.error('[API] Failed to create group:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to create group: ${String(error)}`)
  }
}

export async function getLaps(): Promise<LapsResponse> {
  const url = `${API_BASE_URL}/metric/laps`
  
  console.log('[API] Fetching laps:', {
    method: 'GET',
    url,
  })

  try {
    const response = await fetch(url, {
      method: 'GET',
    })

    console.log('[API] Response status:', response.status, response.statusText)
    console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorText = ''
      let errorJson = null
      
      try {
        errorText = await response.text()
        console.error('[API] Error response text:', errorText)
        
        if (errorText) {
          // Проверяем, является ли ответ HTML (например, страница ошибки 503)
          if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
            if (response.status === 503) {
              throw new Error('Сервис временно недоступен. Пожалуйста, попробуйте позже.')
            }
            throw new Error(`Сервер вернул ошибку ${response.status}. Сервис может быть временно недоступен.`)
          }
          
          try {
            errorJson = JSON.parse(errorText)
            console.error('[API] Error response JSON:', errorJson)
          } catch {
            void 0
          }
        }
      } catch (e) {
        console.error('[API] Failed to read error response:', e)
        if (e instanceof Error) {
          throw e
        }
      }
      
      // Для 503 показываем понятное сообщение
      if (response.status === 503) {
        throw new Error('Сервис временно недоступен. Пожалуйста, попробуйте позже.')
      }
      
      const errorMessage = errorJson?.message || errorText || response.statusText
      throw new Error(`Failed to fetch laps (${response.status}): ${errorMessage}`)
    }

    const data: LapsResponse = await response.json()
    console.log('[API] Laps fetched successfully:', data)
    console.log('[API] Total LEPs:', Object.keys(data).length)
    Object.keys(data).forEach((lapId) => {
      const groups = getGroupsFromLapData(data[lapId])
      console.log(`[API] LEP ${lapId}: ${groups.length} groups`)
    })
    return data
  } catch (error) {
    console.error('[API] Failed to fetch laps:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to fetch laps: ${String(error)}`)
  }
}

export async function deleteGroup(groupId: number): Promise<void> {
  const url = `${API_BASE_URL}/groups/delete?id=${groupId}`
  
  console.log('[API] Deleting group:', {
    method: 'DELETE',
    url,
    groupId,
  })

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('[API] Response status:', response.status, response.statusText)
    console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorText = ''
      let errorJson = null
      
      try {
        errorText = await response.text()
        console.error('[API] Error response text:', errorText)
        
        if (errorText) {
          // Проверяем, является ли ответ HTML (например, страница ошибки 503)
          if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
            if (response.status === 503) {
              throw new Error('Сервис временно недоступен. Пожалуйста, попробуйте позже.')
            }
            throw new Error(`Сервер вернул ошибку ${response.status}. Сервис может быть временно недоступен.`)
          }
          
          try {
            errorJson = JSON.parse(errorText)
            console.error('[API] Error response JSON:', errorJson)
          } catch {
            void 0
          }
        }
      } catch (e) {
        console.error('[API] Failed to read error response:', e)
        if (e instanceof Error) {
          throw e
        }
      }
      
      // Для 503 показываем понятное сообщение
      if (response.status === 503) {
        throw new Error('Сервис временно недоступен. Пожалуйста, попробуйте позже.')
      }
      
      const errorMessage = errorJson?.message || errorText || response.statusText
      throw new Error(`Failed to delete group (${response.status}): ${errorMessage}`)
    }

    console.log('[API] Group deleted successfully')
  } catch (error) {
    console.error('[API] Failed to delete group:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to delete group: ${String(error)}`)
  }
}

export type Detection = {
  id: number
  class: string
  damage_level: number
}

export type GroupImagesResponse = {
  image_count: number
  detections_count: number
  images: {
    [imageUid: string]: Detection[]
  }
}

export async function getGroupImages(groupId: number): Promise<GroupImagesResponse> {
  const url = `${API_BASE_URL}/metric/group?group_id=${groupId}`

  try {
    const response = await fetch(url, {
      method: 'GET',
    })

    if (!response.ok) {
      let errorText = ''
      let errorJson = null

      try {
        errorText = await response.text()
        if (errorText) {
          // Проверяем, является ли ответ HTML (например, страница ошибки 503)
          if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
            if (response.status === 503) {
              throw new Error('Сервис временно недоступен. Пожалуйста, попробуйте позже.')
            }
            throw new Error(`Сервер вернул ошибку ${response.status}. Сервис может быть временно недоступен.`)
          }
          
          try {
            errorJson = JSON.parse(errorText)
          } catch {
            void 0
          }
        }
      } catch (e) {
        console.error('[API] Failed to read error response:', e)
        if (e instanceof Error) {
          throw e
        }
      }

      // Для 503 показываем понятное сообщение
      if (response.status === 503) {
        throw new Error('Сервис временно недоступен. Пожалуйста, попробуйте позже.')
      }

      const errorMessage = errorJson?.message || errorText || response.statusText
      throw new Error(`Failed to fetch group images (${response.status}): ${errorMessage}`)
    }

    const data: GroupImagesResponse = await response.json()
    return data
  } catch (error) {
    console.error('[API] Failed to fetch group images:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to fetch group images: ${String(error)}`)
  }
}

