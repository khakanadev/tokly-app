import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Content } from '../components/Layout'
import { Header } from '../components/Header'
import { type Lap } from '../components/MainHeader'
import { componentSections, sectionClassMap } from '../constants/componentSections'
import { getGroupImages, getLaps, getGroupsFromLapData, type GroupImagesResponse, type LapsResponse, type Detection } from '../services/api'
import { API_BASE_URL } from '../services/api'
import arrowIcon from '../assets/arrow.svg'

const MASK_BASE_URL = 'http://91.109.146.20:8080'

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

const SectionHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const ToggleText = styled.span`
  font-size: 16px;
  font-weight: 400;
  color: #9d9b97;
  font-family: 'Inter', sans-serif;
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

const ImageContainer = styled.div`
  position: relative;
  width: 286px;
  height: 184px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 220, 52, 0.3);
`

const BaseImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const MaskLayer = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  mix-blend-mode: multiply;
  opacity: 0.6;
`

const LoadingText = styled.div`
  color: #9d9b97;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  margin-top: 24px;
`

type LapIssuesPageProps = {
  laps: Lap[]
}

type ImageWithDetections = {
  imageUid: string
  detections: Detection[]
}

type SectionImages = {
  [sectionId: string]: {
    images: ImageWithDetections[]
    loading: boolean
    error: string | null
  }
}

type ImageWithMasksProps = {
  imageUrl: string
  detections: Detection[]
}

function ImageWithMasks({ imageUrl, detections }: ImageWithMasksProps) {
  return (
    <ImageContainer>
      <BaseImage src={imageUrl} alt="Фото" loading="lazy" />
      {detections.map((detection) => (
        <MaskLayer
          key={detection.id}
          src={`${MASK_BASE_URL}/mask/${detection.id}.png`}
          alt={`Маска для проблемы ${detection.id}`}
        />
      ))}
    </ImageContainer>
  )
}

const transformLapsData = (data: LapsResponse): Lap[] => {
  const lapIds = Object.keys(data)
  return lapIds.map((lapId) => {
    const lapData = data[lapId]
    let have_problems: boolean | undefined
    
    if (lapData && typeof lapData === 'object' && 'have_problems' in lapData) {
      have_problems = lapData.have_problems
    }
    
    return {
      id: lapId,
      label: lapId,
      have_problems,
    }
  })
}

export function LapIssuesPage({ laps }: LapIssuesPageProps) {
  const { lapId } = useParams()
  const [currentLap, setCurrentLap] = useState<Lap | null>(laps.find((item) => item.id === lapId) || null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [sectionImages, setSectionImages] = useState<SectionImages>({})
  const [groupId, setGroupId] = useState<number | null>(null)

  const title = currentLap ? `Неисправности ЛЭП № ${currentLap.label}` : 'ЛЭП не найдена'

  useEffect(() => {
    const loadLapAndGroupId = async () => {
      if (!lapId) return
      
      try {
        console.log('[LapIssuesPage] Loading lap and group ID for lapId:', lapId)
        const data = await getLaps()
        const transformedLaps = transformLapsData(data)
        const foundLap = transformedLaps.find((item) => item.id === lapId)
        
        if (foundLap) {
          console.log('[LapIssuesPage] Found lap:', foundLap)
          setCurrentLap(foundLap)
        } else {
          console.log('[LapIssuesPage] Lap not found in transformed laps')
        }
        
        const lapData = data[lapId]
        console.log('[LapIssuesPage] Lap data:', lapData)
        
        let foundGroupId: number | null = null
        
        if (lapData && typeof lapData === 'object' && 'last_group' in lapData && lapData.last_group) {
          foundGroupId = lapData.last_group as number
          console.log('[LapIssuesPage] Found last_group:', foundGroupId)
        } else {
          const groups = getGroupsFromLapData(lapData)
          console.log('[LapIssuesPage] Groups:', groups)
          if (groups.length > 0) {
            foundGroupId = groups[groups.length - 1].id
            console.log('[LapIssuesPage] Using last group from array:', foundGroupId)
          }
        }
        
        if (foundGroupId) {
          console.log('[LapIssuesPage] Setting groupId:', foundGroupId)
          setGroupId(foundGroupId)
        } else {
          console.log('[LapIssuesPage] No groupId found for lap')
        }
      } catch (error) {
        console.error('[LapIssuesPage] Failed to load lap and group ID:', error)
      }
    }
    void loadLapAndGroupId()
  }, [lapId])

  const toggleSection = async (sectionId: string) => {
    const isOpening = !openSections[sectionId]
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))

    if (!isOpening) {
      return
    }

    if (sectionImages[sectionId]) {
      return
    }

    if (!groupId) {
      console.log('[LapIssuesPage] No groupId available for section:', sectionId)
      setSectionImages((prev) => ({
        ...prev,
        [sectionId]: { images: [], loading: false, error: 'Группа не найдена' },
      }))
      return
    }

    const section = componentSections.find((s) => s.id === sectionId)
    if (!section) {
      console.log('[LapIssuesPage] Section not found:', sectionId)
      return
    }

    console.log('[LapIssuesPage] Loading images for section:', sectionId, 'groupId:', groupId)
    setSectionImages((prev) => ({
      ...prev,
      [sectionId]: { images: [], loading: true, error: null },
    }))

    try {
      const data: GroupImagesResponse = await getGroupImages(groupId)
      console.log('[LapIssuesPage] Received group images:', data)
      const sectionClasses = sectionClassMap[sectionId] || []

      const matchingImages: ImageWithDetections[] = []
      Object.entries(data.images).forEach(([imageUid, detections]) => {
        const relevantDetections = detections.filter((detection) => {
          return sectionClasses.includes(detection.class)
        })
        if (relevantDetections.length > 0) {
          matchingImages.push({
            imageUid,
            detections: relevantDetections,
          })
        }
      })

      setSectionImages((prev) => ({
        ...prev,
        [sectionId]: { images: matchingImages, loading: false, error: null },
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Не удалось загрузить фотографии'
      setSectionImages((prev) => ({
        ...prev,
        [sectionId]: { images: [], loading: false, error: errorMessage },
      }))
    }
  }

  return (
    <>
      <Header title={title} />
      <Content>
        <ComponentSectionsWrapper>
          {componentSections.map((section) => (
            <SectionWrapper key={section.id}>
              <SectionHeader type="button" onClick={() => toggleSection(section.id)}>
                {section.title}
                <SectionHeaderRight>
                  <ToggleText>{openSections[section.id] ? 'свернуть' : 'развернуть'}</ToggleText>
                  <ArrowIcon src={arrowIcon} alt="" $isOpen={Boolean(openSections[section.id])} />
                </SectionHeaderRight>
              </SectionHeader>
              <SectionDivider />
              {openSections[section.id] && (
                <>
                  {sectionImages[section.id]?.loading && (
                    <LoadingText>Загрузка фотографий...</LoadingText>
                  )}
                  {sectionImages[section.id]?.error && (
                    <LoadingText style={{ color: '#de6f6d' }}>{sectionImages[section.id].error}</LoadingText>
                  )}
                  {sectionImages[section.id] && !sectionImages[section.id].loading && !sectionImages[section.id].error && (
                    <PhotoPlaceholderGrid>
                      {sectionImages[section.id].images.length > 0 ? (
                        sectionImages[section.id].images.map((imageData) => (
                          <ImageWithMasks
                            key={imageData.imageUid}
                            imageUrl={`${API_BASE_URL}/image/${groupId}/${imageData.imageUid}.jpeg`}
                            detections={imageData.detections}
                          />
                        ))
                      ) : (
                        <LoadingText style={{ width: '100%' }}>Фотографий не найдено</LoadingText>
                      )}
                    </PhotoPlaceholderGrid>
                  )}
                  {!sectionImages[section.id] && (
                    <PhotoPlaceholderGrid>
                      {[1, 2, 3, 4].map((item) => (
                        <PhotoPlaceholder key={`${section.id}-${item}`}>фото</PhotoPlaceholder>
                      ))}
                    </PhotoPlaceholderGrid>
                  )}
                </>
              )}
            </SectionWrapper>
          ))}
        </ComponentSectionsWrapper>
      </Content>
    </>
  )
}

