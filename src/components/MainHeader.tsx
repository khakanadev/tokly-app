import { useRef, useEffect, useState } from 'react'
import styled from 'styled-components'
import trashIcon from '../assets/Trash Can.svg'
import pencilIcon from '../assets/Edit Pencil.svg'

export type Lap = {
  id: string
  label: string
  have_problems?: boolean
}

type MainHeaderProps = {
  laps: Lap[]
  onDelete: (index: number) => void
  onEdit: (index: number) => void
  currentPage: number
  onPageChange: (page: number) => void
  onSelectLap?: (lap: Lap, globalIndex: number) => void
}

const MainHeaderWrapper = styled.section`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
`

const SequencePanel = styled.div`
  width: 64px;
  min-height: 872px;
  border-radius: 15px;
  background: #0E0C0A;
  flex-shrink: 0;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 38px;
`

const SequenceItem = styled.div`
  width: 100%;
  height: 53px;
  border-radius: 12px;
  background: transparent;
  color: #CAC8C6;
  font-family: 'Inter', sans-serif;
  font-size: 36px;
  font-weight: 300;
  word-wrap: break-word;
  display: flex;
  align-items: center;
  justify-content: center;
`

const TablePanel = styled.div`
  flex: 1;
  min-height: 872px;
  border-radius: 15px;
  background: #0E0C0A;
  padding: 24px 24px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
`

const RowsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 38px;
  min-height: 872px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`

const RowButton = styled.button`
  display: flex;
  align-items: center;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  flex: 1;
  gap: 0;

  &:focus-visible {
    outline: 2px solid #FFDC34;
    border-radius: 15px;
  }
`

const LapInfo = styled.div`
  width: 862px;
  height: 53px;
  min-height: 53px;
  max-height: 53px;
  border-radius: 15px;
  background: #ffffff;
  display: flex;
  align-items: center;
  padding: 0 24px;
  font-family: 'Inter', sans-serif;
  font-size: 36px;
  font-weight: 300;
  color: black;
  word-wrap: break-word;
  flex-shrink: 0;
  overflow: hidden;
  box-sizing: border-box;
`

const Status = styled.div<{ $bgColor?: string; $borderColor?: string }>`
  width: 147px;
  height: 53px;
  min-height: 53px;
  max-height: 53px;
  border-radius: 15px;
  background: ${({ $bgColor }) => $bgColor || '#FFF5C7'};
  border: 3px solid ${({ $borderColor }) => $borderColor || '#FFDC34'};
  margin-left: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0E0C0A;
  font-size: 24px;
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  word-wrap: break-word;
  flex-shrink: 0;
  overflow: hidden;
  box-sizing: border-box;
`

const IconButton = styled.button`
  width: 55px;
  height: 53px;
  border-radius: 15px;
  background: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 200ms ease;

  &:hover {
    filter: brightness(0.9);
  }
`

const DeleteButton = styled(IconButton)`
  margin-left: 31px;
`

const EditButton = styled(IconButton)`
  margin-left: 17px;
`

const Icon = styled.img`
  width: 31px;
  height: 31px;
  display: block;
`

const EmptyState = styled.div`
  color: #5a5854;
  font-family: 'Inter', sans-serif;
  font-size: 18px;
`

const PaginationWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
`

const PaginationContainer = styled.div`
  width: 476px;
  height: 40px;
  background: white;
  border-radius: 45px;
  border: 1px solid white;
  padding: 0 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
`

const ActivePageFill = styled.div<{ $left: number; $right: number; $isFirst: boolean; $isLast: boolean }>`
  position: absolute;
  left: ${({ $left }) => $left}px;
  right: ${({ $right }) => $right}px;
  top: 0;
  height: 100%;
  background: #FFDC34;
  z-index: 0;
  transition: left 300ms ease, right 300ms ease, border-radius 300ms ease;
  border-radius: ${({ $isFirst, $isLast }) => {
    if ($isFirst && $isLast) return '45px'
    if ($isFirst) return '45px 10px 10px 45px'
    if ($isLast) return '10px 45px 45px 10px'
    return '10px'
  }};
`

const PageButton = styled.button<{ $active?: boolean }>`
  width: ${({ $active }) => ($active ? '46px' : '40px')};
  height: 40px;
  border-radius: ${({ $active }) => ($active ? '10px' : '50%')};
  border: none;
  background: transparent;
  color: ${({ $active }) => ($active ? '#0E0C0A' : '#5a5854')};
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 400;
  cursor: pointer;
  transition: color 200ms ease, width 200ms ease, border-radius 200ms ease;
  position: relative;
  z-index: 1;

  &:hover {
    background: ${({ $active }) => ($active ? 'transparent' : '#f0f0f0')};
  }
`

const Ellipsis = styled.span`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5a5854;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 400;
  position: relative;
  z-index: 1;
`

const ArrowButton = styled.button<{ $disabled?: boolean }>`
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 45px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  padding: 0;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: opacity 200ms ease, filter 200ms ease;

  &:hover:not(:disabled) {
    filter: brightness(0.95);
  }

  &:disabled {
    cursor: not-allowed;
  }
`


export const MainHeader = ({ laps, onDelete, onEdit, currentPage, onPageChange, onSelectLap }: MainHeaderProps) => {
  const itemsPerPage = 10
  const totalPages = Math.ceil(laps.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentLaps = laps.slice(startIndex, endIndex)
  const paginationRef = useRef<HTMLDivElement>(null)
  const [fillLeft, setFillLeft] = useState(24)
  const [fillRight, setFillRight] = useState(24)

  const handleDelete = (localIndex: number) => {
    const globalIndex = startIndex + localIndex
    onDelete(globalIndex)
    if (currentLaps.length === 1 && currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleEdit = (localIndex: number) => {
    const globalIndex = startIndex + localIndex
    onEdit(globalIndex)
  }

  const handleSelect = (localIndex: number) => {
    if (!onSelectLap) return
    const globalIndex = startIndex + localIndex
    onSelectLap(laps[globalIndex], globalIndex)
  }

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 10) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []

    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, 2, 3, 4, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }

    return pages
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  useEffect(() => {
    const updateFillPosition = () => {
      if (paginationRef.current) {
        const container = paginationRef.current
        const activeButton = container.querySelector(`[data-page="${currentPage}"]`) as HTMLElement
        
        if (activeButton) {
          const containerRect = container.getBoundingClientRect()
          const buttonRect = activeButton.getBoundingClientRect()
          
          const buttonLeft = buttonRect.left - containerRect.left
          const buttonWidth = buttonRect.width
          const buttonRight = containerRect.width - (buttonLeft + buttonWidth)
          
          const left = Math.round(buttonLeft)
          const right = Math.round(buttonRight)
          
          if (currentPage === 1) {
            setFillLeft(0)
            setFillRight(right)
          } else if (currentPage === totalPages) {
            setFillLeft(left)
            setFillRight(0)
          } else {
            setFillLeft(left)
            setFillRight(right)
          }
        }
      }
    }
    
    let rafId: number
    let timeoutId: NodeJS.Timeout
    
    const scheduleUpdate = () => {
      rafId = requestAnimationFrame(() => {
        timeoutId = setTimeout(updateFillPosition, 50)
      })
    }
    
    scheduleUpdate()
    window.addEventListener('resize', updateFillPosition)
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (timeoutId) clearTimeout(timeoutId)
      window.removeEventListener('resize', updateFillPosition)
    }
  }, [currentPage, totalPages])

  const arrowSvg = (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5L15 11L8 17" stroke="#5a5854" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  return (
    <>
      <MainHeaderWrapper>
        <SequencePanel>
          {laps.length === 0 && <EmptyState></EmptyState>}
          {currentLaps.map((_, index) => (
            <SequenceItem key={startIndex + index}>{startIndex + index + 1}</SequenceItem>
          ))}
          {Array.from({ length: itemsPerPage - currentLaps.length }).map((_, index) => (
            <SequenceItem key={`placeholder-${index}`} style={{ visibility: 'hidden', pointerEvents: 'none' }}>
              {startIndex + currentLaps.length + index + 1}
            </SequenceItem>
          ))}
        </SequencePanel>
        <TablePanel>
          {laps.length === 0 ? (
            <EmptyState>Добавьте линию электропередачи</EmptyState>
          ) : (
            <RowsContainer>
              {currentLaps.map((lap, index) => {
                const getStatusColors = () => {
                  if (lap.have_problems === false) {
                    return { bg: '#DE6F6D', border: '#C85A58' } // красный
                  }
                  // Если true или undefined - желтая подложка (как была)
                  return { bg: '#FFF5C7', border: '#FFDC34' } // желтый
                }
                const colors = getStatusColors()
                return (
                  <Row key={lap.id}>
                    <RowButton type="button" onClick={() => handleSelect(index)}>
                      <LapInfo>ЛЭП № {lap.label}</LapInfo>
                      <Status $bgColor={colors.bg} $borderColor={colors.border}>
                        {lap.have_problems === false ? 'не норма' : lap.have_problems === true ? 'норма' : 'статус'}
                      </Status>
                    </RowButton>
                    <DeleteButton type="button" onClick={() => handleDelete(index)}>
                      <Icon src={trashIcon} alt="Удалить" />
                    </DeleteButton>
                    <EditButton type="button" onClick={() => handleEdit(index)}>
                      <Icon src={pencilIcon} alt="Редактировать" />
                    </EditButton>
                  </Row>
                )
              })}
              {Array.from({ length: itemsPerPage - currentLaps.length }).map((_, index) => (
                <Row key={`placeholder-${index}`} style={{ visibility: 'hidden', pointerEvents: 'none' }}>
                  <LapInfo>ЛЭП № </LapInfo>
                  <Status>статус</Status>
                </Row>
              ))}
            </RowsContainer>
          )}
        </TablePanel>
      </MainHeaderWrapper>
      {laps.length > itemsPerPage && (
        <PaginationWrapper>
          <ArrowButton
            type="button"
            $disabled={currentPage === 1}
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <div style={{ width: '22px', height: '22px', transform: 'rotate(-180deg)', transformOrigin: 'center' }}>
              {arrowSvg}
            </div>
          </ArrowButton>
          <PaginationContainer ref={paginationRef}>
            <ActivePageFill 
              $left={fillLeft} 
              $right={fillRight}
              $isFirst={currentPage === 1}
              $isLast={currentPage === totalPages}
            />
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return <Ellipsis key={`ellipsis-${index}`}>...</Ellipsis>
              }
              return (
                <PageButton
                  key={page}
                  type="button"
                  $active={page === currentPage}
                  onClick={() => onPageChange(page as number)}
                  data-page={page}
                >
                  {page}
                </PageButton>
              )
            })}
          </PaginationContainer>
          <ArrowButton
            type="button"
            $disabled={currentPage === totalPages}
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            {arrowSvg}
          </ArrowButton>
        </PaginationWrapper>
      )}
    </>
  )
}

