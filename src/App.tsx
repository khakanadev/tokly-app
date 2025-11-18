import { useState } from 'react'
import styled from 'styled-components'
import { GlobalStyle } from './styles/GlobalStyles'
import { Header } from './components/Header'
import { MainHeader, type Lap } from './components/MainHeader'
import { AddLapModal } from './components/AddLapModal'

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
  margin-top: 32px;
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

function App() {
  const [laps, setLaps] = useState<Lap[]>(generateMockLaps())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

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

  return (
    <>
      <GlobalStyle />
      <Page>
        <Container>
          <Header onAddClick={() => setIsModalOpen(true)} />
          <Content>
            <MainHeader 
              laps={laps} 
              onDelete={handleDeleteLap} 
              onEdit={handleEditLap}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </Content>
        </Container>
      </Page>
      <AddLapModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddLap} />
    </>
  )
}

export default App
