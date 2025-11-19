const API_BASE_URL = import.meta.env.DEV ? '/api' : 'http://91.109.146.20:8080'

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

export async function createGroup(lapId: string): Promise<number> {
  const url = `${API_BASE_URL}/groups/create?lap_id=${lapId}`
  
  console.log('[API] Creating group:', {
    method: 'POST',
    url,
    lapId,
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
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
          try {
            errorJson = JSON.parse(errorText)
            console.error('[API] Error response JSON:', errorJson)
          } catch {
            void 0
          }
        }
      } catch (e) {
        console.error('[API] Failed to read error response:', e)
      }
      
      const errorMessage = errorJson?.message || errorText || response.statusText
      throw new Error(`Failed to create group (${response.status}): ${errorMessage}`)
    }

    const data: CreateGroupResponse = await response.json()
    console.log('[API] Group created successfully:', data)
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
          try {
            errorJson = JSON.parse(errorText)
            console.error('[API] Error response JSON:', errorJson)
          } catch {
            void 0
          }
        }
      } catch (e) {
        console.error('[API] Failed to read error response:', e)
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
          try {
            errorJson = JSON.parse(errorText)
            console.error('[API] Error response JSON:', errorJson)
          } catch {
            void 0
          }
        }
      } catch (e) {
        console.error('[API] Failed to read error response:', e)
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

