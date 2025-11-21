import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { GlobalStyle } from './styles/GlobalStyles'
import { Page, Container } from './components/Layout'
import { AddLapModal } from './components/AddLapModal'
import { WelcomePage } from './pages/WelcomePage'
import { HomePage } from './pages/HomePage'
import { LapDetailsPage } from './pages/LapDetailsPage'
import { LapIssuesPage } from './pages/LapIssuesPage'
import { PhotoEditorPage } from './pages/PhotoEditorPage'
import { deleteGroup, getGroupsFromLapData, getLaps, type Group, type LapsResponse } from './services/api'
import { type Lap } from './components/MainHeader'

const transformLapsData = (data: LapsResponse): Lap[] => {
  const lapIds = Object.keys(data)
  console.log('[transformLapsData] LEP IDs from server:', lapIds)
  console.log('[transformLapsData] Full data structure:', data)
  
  const transformed = lapIds.map((lapId) => {
    const lapData = data[lapId]
    let have_problems: boolean | undefined
    let groups: Group[] = []
    
    // Проверяем, является ли значение массивом (старая структура) или объектом (новая структура)
    if (Array.isArray(lapData)) {
      groups = lapData
    } else if (lapData && typeof lapData === 'object' && 'have_problems' in lapData) {
      have_problems = lapData.have_problems
      groups = lapData.groups || []
    }
    
    console.log(`[transformLapsData] LEP ${lapId} has ${groups.length} groups, have_problems: ${have_problems}`)
    return {
      id: lapId,
      label: lapId,
      have_problems,
    }
  })
  
  console.log('[transformLapsData] Transformed result:', transformed)
  return transformed
}

function App() {
  const [laps, setLaps] = useState<Lap[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  const loadLaps = async () => {
    try {
      console.log('[App] Loading laps...')
      const data = await getLaps()
      const transformedLaps = transformLapsData(data)
      setLaps(transformedLaps)
      console.log('[App] Laps set in state:', transformedLaps.length, 'items')
    } catch (error) {
      console.error('[App] Failed to load laps:', error)
      setLaps([])
      if (error instanceof Error) {
        console.error('[App] Error details:', error.message)
      }
    }
  }

  useEffect(() => {
    void loadLaps()
  }, [])

  const handleLapCreationSuccess = async (lapId: string) => {
    try {
      console.log('[App] Refreshing laps after creation...')
      const data = await getLaps()
      const transformedLaps = transformLapsData(data)
      setLaps(transformedLaps)

      const itemsPerPage = 10
      const lapIndex = transformedLaps.findIndex((lap) => lap.id === lapId)
      if (lapIndex >= 0) {
        const targetPage = Math.floor(lapIndex / itemsPerPage) + 1
        setCurrentPage(targetPage)
      } else {
        const newTotalPages = Math.ceil(transformedLaps.length / itemsPerPage)
        setCurrentPage(newTotalPages > 0 ? newTotalPages : 1)
      }
    } catch (error) {
      console.error('[App] Failed to refresh laps after creation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      alert(`ЛЭП создана, но не удалось обновить список: ${errorMessage}`)
    } finally {
      setIsModalOpen(false)
    }
  }

  const handleDeleteLap = async (index: number) => {
    const lapToDelete = laps[index]
    if (!lapToDelete) {
      return
    }

    setLaps((prev) => {
      const newLaps = prev.filter((_, i) => i !== index)
      const itemsPerPage = 10
      const newTotalPages = Math.ceil(newLaps.length / itemsPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }
      return newLaps
    })

    try {
      console.log('[App] Deleting groups for LEP:', lapToDelete.id)
      
      const data = await getLaps()
      const groupsForLap = getGroupsFromLapData(data[lapToDelete.id] || [])
      
      if (groupsForLap.length === 0) {
        console.log('[App] No groups found for LEP')
        return
      }

      console.log('[App] Found', groupsForLap.length, 'groups to delete')
      
      await Promise.all(
        groupsForLap.map((group) =>
          deleteGroup(group.id).catch((error) => {
            console.error('[App] Failed to delete group:', group.id, error)
            throw error
          })
        )
      )

      const updatedData = await getLaps()
      const transformedLaps = transformLapsData(updatedData)
      setLaps(transformedLaps)

      const itemsPerPage = 10
      const newTotalPages = Math.ceil(transformedLaps.length / itemsPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }

      console.log('[App] Groups deletion completed successfully')
    } catch (error) {
      console.error('[App] Failed to delete groups:', error)
      
      const data = await getLaps()
      const transformedLaps = transformLapsData(data)
      setLaps(transformedLaps)

      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      alert(`Не удалось удалить группу: ${errorMessage}\n\nПроверьте, что сервер доступен и попробуйте еще раз.`)
    }
  }

  const handleEditLap = (index: number) => {
    if (typeof window === 'undefined') {
      return
    }
    const current = laps[index]
    const nextLabel = window.prompt('Новый ID ЛЭПа', current.label)
    if (!nextLabel) {
      return
    }
    setLaps((prev) =>
      prev.map((lap, i) => (i === index ? { ...lap, label: nextLabel } : lap)),
    )
  }

  const handleSelectLap = (lap: Lap) => {
    navigate(`/line/${lap.id}`)
  }

  return (
    <>
      <GlobalStyle />
      <Page>
        <Container>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route
              path="/home"
              element={
                <HomePage
                  laps={laps}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  onDelete={handleDeleteLap}
                  onEdit={handleEditLap}
                  onSelectLap={handleSelectLap}
                  onAddClick={() => setIsModalOpen(true)}
                />
              }
            />
            <Route
              path="/line/:lapId"
              element={<LapDetailsPage laps={laps} />}
            />
            <Route
              path="/line/:lapId/issues"
              element={<LapIssuesPage laps={laps} />}
            />
            <Route path="/editor" element={<PhotoEditorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Page>
      <AddLapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleLapCreationSuccess}
      />
    </>
  )
}

export default App
