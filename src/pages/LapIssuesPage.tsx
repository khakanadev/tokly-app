import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Content } from '../components/Layout'
import { Header } from '../components/Header'
import { type Lap } from '../components/MainHeader'
import { componentSections } from '../constants/componentSections'
import arrowIcon from '../assets/arrow.svg'

const ComponentSectionsWrapper = styled.section`
  width: 100%;
  border-radius: 15px;
  background: #0e0c0a;
  padding: 16px 32px;
  display: flex;
  flex-direction: column;
`

const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px 0;
`

const SectionDivider = styled.div`
  height: 1px;
  background: #ffdc34;
  width: 100%;
`

const SectionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 22px;
  font-weight: 500;
  color: #fff;
  font-family: 'Inter', sans-serif;
  text-align: left;
  margin-bottom: 10px;
`

const ArrowIcon = styled.img<{ $isOpen: boolean }>`
  width: 32px;
  height: 20px;
  transition: transform 200ms ease;
  transform: rotate(${({ $isOpen }) => ($isOpen ? '0deg' : '180deg')});
`

const PhotoPlaceholderGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 35px;
  margin-top: 24px;
`

const PhotoPlaceholder = styled.div`
  width: 286px;
  height: 184px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 220, 52, 0.35);
  background: linear-gradient(135deg, rgba(255, 220, 52, 0.12), rgba(255, 220, 52, 0.02));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffdc34;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
`

type LapIssuesPageProps = {
  laps: Lap[]
}

export function LapIssuesPage({ laps }: LapIssuesPageProps) {
  const { lapId } = useParams()
  const navigate = useNavigate()
  const lap = laps.find((item) => item.id === lapId) || null
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const title = lap ? `Неисправности ЛЭП № ${lap.label}` : 'ЛЭП не найдена'

  const handleBack = () => {
    if (lap) {
      navigate(`/line/${lap.id}`)
      return
    }
    navigate('/')
  }

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  return (
    <>
      <Header title={title} onBack={handleBack} />
      <Content>
        <ComponentSectionsWrapper>
          {componentSections.map((section) => (
            <SectionWrapper key={section.id}>
              <SectionHeader type="button" onClick={() => toggleSection(section.id)}>
                {section.title}
                <ArrowIcon src={arrowIcon} alt="" $isOpen={Boolean(openSections[section.id])} />
              </SectionHeader>
              <SectionDivider />
              {openSections[section.id] && (
                <PhotoPlaceholderGrid>
                  {[1, 2, 3, 4].map((item) => (
                    <PhotoPlaceholder key={`${section.id}-${item}`}>фото</PhotoPlaceholder>
                  ))}
                </PhotoPlaceholderGrid>
              )}
            </SectionWrapper>
          ))}
        </ComponentSectionsWrapper>
      </Content>
    </>
  )
}

