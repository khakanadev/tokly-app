import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { GlobalStyle } from './styles/GlobalStyles'
import { Header } from './components/Header'
import { MainHeader, type Lap } from './components/MainHeader'
import { AddLapModal } from './components/AddLapModal'
import { UploadDropzone } from './components/UploadDropzone'

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

const generateUid = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const generateMockLaps = (): Lap[] => {
  return Array.from({ length: 110 }, (_, i) => ({
    id: generateUid(),
    label: String(i + 1),
  }))
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
  const [laps, setLaps] = useState<Lap[]>(generateMockLaps())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()
  const handleFilesDrop = (files: File[]) => {
    // В реальном приложении здесь можно отправить файлы на сервер или инициировать обработку
    console.log('Dropped files:', files)
  }

  const handleAddLap = (label: string) => {
    setLaps((prev) => {
      const newLaps = [
        ...prev,
        {
          id: generateUid(),
          label,
        },
      ]
      // Переключаемся на последнюю страницу, если добавили элемент
      const itemsPerPage = 10
      const newTotalPages = Math.ceil(newLaps.length / itemsPerPage)
      setCurrentPage(newTotalPages)
      return newLaps
    })
    setIsModalOpen(false)
  }

  const handleDeleteLap = (index: number) => {
    setLaps((prev) => {
      const newLaps = prev.filter((_, i) => i !== index)
      // Если текущая страница стала пустой, переключаемся на предыдущую
      const itemsPerPage = 10
      const newTotalPages = Math.ceil(newLaps.length / itemsPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }
      return newLaps
    })
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
