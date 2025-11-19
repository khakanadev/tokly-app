import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { GlobalStyle } from './styles/GlobalStyles'
import { Header } from './components/Header'
import { MainHeader, type Lap } from './components/MainHeader'
import { AddLapModal } from './components/AddLapModal'
import { UploadDropzone } from './components/UploadDropzone'
import { createGroup, deleteGroup, getLaps, type LapsResponse } from './services/api'

const Page = styled.div`
  min-height: 100vh;
  background-color: #1B1B1B;
  padding: 32px 0;
`

const Container = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
`

const Content = styled.main`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`

const DropzoneSection = styled.section`
  width: 100%;
`

const RequestButton = styled.button`
  width: 100%;
  height: 112px;
  border-radius: 15px;
  border: 1px solid #FFDC34;
  background: #0E0C0A;
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 300;
  line-height: 1;
  word-wrap: break-word;
  cursor: pointer;
  transition: background 200ms ease, color 200ms ease, transform 200ms ease;

  &:hover {
    background: #FFDC34;
    color: #0E0C0A;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`

const HistoryButton = styled(RequestButton)`
  width: 100%;
`

const StatusButtonsContainer = styled.div`
  width: 100%;
  display: flex;
  gap: 20px;
`

const StatusButton = styled(RequestButton)`
  flex: 1;
  width: auto;
`

const StatsGrid = styled.section`
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 20px;
  align-items: stretch;
`

const StatsCard = styled.div`
  width: 100%;
  height: 583px;
  background: #0E0C0A;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
`

const StatsCardContent = styled.div`
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
`

const GeneralStatsCardContent = styled.div`
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  color: #CAC8C6;
  font-family: 'Inter', sans-serif;
`

const GeneralStatsItem = styled.div`
  font-size: 24px;
  font-weight: 400;
  line-height: 1.4;
  word-wrap: break-word;
`

const StatsTitle = styled.h3`
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  color: #fff;
`

const StatsSubtitle = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 300;
  color: #9d9b97;
`

const StatsHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ChartSection = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 32px;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-height: 0;
`

const ChartCircle = styled.div`
  width: 260px;
  height: 260px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  background: #1f1c19;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
`

const ChartCenter = styled.div`
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: #0E0C0A;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 12px;
`

const ChartTotal = styled.span`
  font-size: 40px;
  font-weight: 600;
  color: #fff;
`

const ChartLabel = styled.span`
  font-size: 14px;
  color: #9d9b97;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`

const LegendList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, auto);
  gap: 14px;
  flex: 1;
  align-content: center;
  min-height: 0;
`

const LegendItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
`

const LegendColor = styled.span<{ $color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
`

const LegendText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    color: #f5f2ef;
    font-size: 16px;
    font-weight: 400;
  }

  strong {
    color: #9d9b97;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
`

const transformLapsData = (data: LapsResponse): Lap[] => {
  const lapIds = Object.keys(data)
  console.log('[transformLapsData] LEP IDs from server:', lapIds)
  console.log('[transformLapsData] Full data structure:', data)
  
  const transformed = lapIds.map((lapId) => {
    const groups = data[lapId]
    console.log(`[transformLapsData] LEP ${lapId} has ${groups.length} groups:`, groups)
    return {
      id: lapId,
      label: lapId,
    }
  })
  
  console.log('[transformLapsData] Transformed result:', transformed)
  return transformed
}

type IssueStat = {
  id: string
  title: string
  count: number
  color: string
  caption?: string
}

const mockIssueStats: IssueStat[] = [
  { id: 'normal', title: 'Норма (без дефектов)', count: 72, color: '#50E3A4', caption: '72 без проблем' },
  { id: 'chip_insulator', title: 'Сколы изолятора', count: 9, color: '#BAF7CE' },
  { id: 'wire_break', title: 'Разрывы проводов', count: 7, color: '#FDF08A' },
  { id: 'corrosion', title: 'Коррозия опор', count: 6, color: '#DE6F6D' },
  { id: 'insulation', title: 'Пробой изоляции', count: 5, color: '#A5C7FF' },
  { id: 'hardware', title: 'Ослабление крепежа', count: 4, color: '#F7B267' },
]

const generalStats = [
  { label: 'всего фото', value: '600' },
  { label: 'всего повреждений', value: '46' },
  { label: 'последний осмотр', value: '14.02.2025 г.' },
  { label: 'всего объектов', value: '652' },
]

const buildConicGradient = (stats: IssueStat[]) => {
  const total = stats.reduce((acc, stat) => acc + stat.count, 0)
  if (total === 0) return '#2f2c29'
  let cumulative = 0
  const segments = stats.map((stat) => {
    const start = (cumulative / total) * 360
    cumulative += stat.count
    const end = (cumulative / total) * 360
    return `${stat.color} ${start}deg ${end}deg`
  })
  return segments.join(', ')
}

type LapDetailsRouteProps = {
  laps: Lap[]
  onFilesDrop: (files: File[]) => void
}

const LapDetailsRoute = ({ laps, onFilesDrop }: LapDetailsRouteProps) => {
  const { lapId } = useParams()
  const navigate = useNavigate()
  const lapIndex = laps.findIndex((lap) => lap.id === lapId)
  const lap = lapIndex >= 0 ? laps[lapIndex] : null
  const totalIssues = mockIssueStats.reduce((acc, stat) => acc + stat.count, 0)
  const gradient = buildConicGradient(mockIssueStats)

  const title = lap ? `ЛЭП № ${lap.label}` : 'ЛЭП не найдена'

  return (
    <>
      <Header title={title} onBack={() => navigate('/')} />
      <Content>
        <DropzoneSection>
          <UploadDropzone onFilesDrop={onFilesDrop} />
        </DropzoneSection>
        <RequestButton type="button">Запросить бригаду</RequestButton>
        <StatsGrid>
          <StatsCard>
            <StatsCardContent>
              <StatsHeader>
                <StatsTitle>Проблемы ЛЭП</StatsTitle>
                <StatsSubtitle>Обнаружено за последний облёт</StatsSubtitle>
              </StatsHeader>
              <ChartSection>
                <ChartCircle style={{ background: `conic-gradient(${gradient})` }}>
                  <ChartCenter>
                    <ChartTotal>{totalIssues}</ChartTotal>
                    <ChartLabel>дефектов</ChartLabel>
                  </ChartCenter>
                </ChartCircle>
                <LegendList>
                  {mockIssueStats.map((stat) => (
                    <LegendItem key={stat.id}>
                      <LegendColor $color={stat.color} />
                      <LegendText>
                        <span>{stat.title}</span>
                        <strong>{stat.caption ?? `${stat.count} случаев`}</strong>
                      </LegendText>
                    </LegendItem>
                  ))}
                </LegendList>
              </ChartSection>
            </StatsCardContent>
          </StatsCard>
          <StatsCard>
            <GeneralStatsCardContent>
              {generalStats.map((stat) => (
                <GeneralStatsItem key={stat.label}>
                  {stat.label}:<br />
                  {stat.value}
                </GeneralStatsItem>
              ))}
            </GeneralStatsCardContent>
          </StatsCard>
        </StatsGrid>
        <HistoryButton type="button">История</HistoryButton>
        <StatusButtonsContainer>
          <StatusButton type="button">Норма</StatusButton>
          <StatusButton type="button">Неисправности</StatusButton>
        </StatusButtonsContainer>
      </Content>
    </>
  )
}

function App() {
  const [laps, setLaps] = useState<Lap[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    const loadLaps = async () => {
      try {
        console.log('[App] Loading laps on mount...')
        const data = await getLaps()
        console.log('[App] Successfully loaded laps:', data)
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

    loadLaps()
  }, [])

  const handleFilesDrop = (files: File[]) => {
    console.log('Dropped files:', files)
  }

  const handleAddLap = async (lapId: string) => {
    try {
      console.log('[App] Creating group for LEP:', lapId)
      
      setLaps((prevLaps) => {
        const exists = prevLaps.some((lap) => lap.id === lapId)
        if (exists) {
          console.log('[App] LEP already exists in list, will refresh from server')
          return prevLaps
        }
        console.log('[App] Adding LEP optimistically to list:', lapId)
        const newLap: Lap = {
          id: lapId,
          label: lapId,
        }
        return [...prevLaps, newLap]
      })

      setIsModalOpen(false)

      const groupId = await createGroup(lapId)
      console.log('[App] Group created with ID:', groupId)

      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log('[App] Refreshing laps list from server...')
      try {
        const data = await getLaps()
        console.log('[App] Received data from server:', data)
        
        const transformedLaps = transformLapsData(data)
        console.log('[App] Transformed laps:', transformedLaps)
        console.log('[App] Previous laps count:', laps.length, 'New laps count:', transformedLaps.length)
        
        setLaps(transformedLaps)

        const itemsPerPage = 10
        const lapIndex = transformedLaps.findIndex((lap) => lap.id === lapId)
        if (lapIndex >= 0) {
          const targetPage = Math.floor(lapIndex / itemsPerPage) + 1
          console.log('[App] Setting page to:', targetPage, 'for LEP at index', lapIndex)
          setCurrentPage(targetPage)
        } else {
          const newTotalPages = Math.ceil(transformedLaps.length / itemsPerPage)
          console.log('[App] Setting page to last page:', newTotalPages)
          setCurrentPage(newTotalPages)
        }

        console.log('[App] Group creation completed successfully')
      } catch (refreshError) {
        console.error('[App] Failed to refresh laps after group creation:', refreshError)
        console.warn('[App] Could not sync with server, but LEP is already in the list')
      }
    } catch (error) {
      console.error('[App] Failed to create group:', error)
      
      setLaps((prevLaps) => {
        const filtered = prevLaps.filter((lap) => lap.id !== lapId)
        console.log('[App] Rolled back optimistic update, removed LEP:', lapId)
        return filtered
      })
      
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      alert(`Не удалось создать группу: ${errorMessage}\n\nПроверьте, что сервер доступен и попробуйте еще раз.`)
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
      const groupsForLap = data[lapToDelete.id] || []
      
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
            <Route
              path="/"
              element={
                <>
          <Header onAddClick={() => setIsModalOpen(true)} />
          <Content>
            <MainHeader 
              laps={laps} 
              onDelete={handleDeleteLap} 
              onEdit={handleEditLap}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
                      onSelectLap={handleSelectLap}
                    />
                  </Content>
                </>
              }
            />
            <Route
              path="/line/:lapId"
              element={<LapDetailsRoute laps={laps} onFilesDrop={handleFilesDrop} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Page>
      <AddLapModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddLap} />
    </>
  )
}

export default App
