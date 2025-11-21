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
}

export function HomePage({
  laps,
  currentPage,
  onPageChange,
  onDelete,
  onEdit,
  onSelectLap,
}: HomePageProps) {
  return (
    <>
      <Header />
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

