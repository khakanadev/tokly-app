import { Content } from '../components/Layout'
import { Header } from '../components/Header'
import { MainHeader, type Lap } from '../components/MainHeader'

type HomePageProps = {
  laps: Lap[]
  currentPage: number
  onPageChange: (page: number) => void
  onDelete: (index: number) => void
  onEdit: (index: number) => void
  onSelectLap: (lap: Lap) => void
  onAddLap: () => void
}

export function HomePage({
  laps,
  currentPage,
  onPageChange,
  onDelete,
  onEdit,
  onSelectLap,
  onAddLap,
}: HomePageProps) {
  const resolveIndex = (lap: Lap) => laps.findIndex((item) => item.id === lap.id)

  const handleHeaderSelectLap = (lap: Lap) => {
    onSelectLap(lap)
  }

  const handleHeaderEditLap = (lap: Lap) => {
    const index = resolveIndex(lap)
    if (index >= 0) {
      onEdit(index)
    }
  }

  const handleHeaderDeleteLap = (lap: Lap) => {
    const index = resolveIndex(lap)
    if (index >= 0) {
      onDelete(index)
    }
  }

  return (
    <>
      <Header
        laps={laps}
        onAddLap={onAddLap}
        onSelectLap={handleHeaderSelectLap}
        onEditLap={handleHeaderEditLap}
        onDeleteLap={handleHeaderDeleteLap}
      />
      <Content>
        <MainHeader
          laps={laps}
          onDelete={onDelete}
          onEdit={onEdit}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onSelectLap={onSelectLap}
        />
      </Content>
    </>
  )
}

