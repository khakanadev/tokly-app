import { Content } from '../components/Layout'
import { Header } from '../components/Header'
import { MainHeader, type Lap } from '../components/MainHeader'

type LapListPageProps = {
  laps: Lap[]
  currentPage: number
  onPageChange: (page: number) => void
  onDelete: (index: number) => void
  onEdit: (index: number) => void
  onSelectLap: (lap: Lap) => void
}

export function LapListPage({
  laps,
  currentPage,
  onPageChange,
  onDelete,
  onEdit,
  onSelectLap,
}: LapListPageProps) {
  return (
    <>
      <Header title="Список ЛЭП" />
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

