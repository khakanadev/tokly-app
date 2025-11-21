import { useEffect, useState, type MouseEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Content } from '../components/Layout'
import { Header } from '../components/Header'
import { type Lap } from '../components/MainHeader'
import { componentSections, sectionClassMap } from '../constants/componentSections'
import {
  getGroupImages,
  getLaps,
  getGroupsFromLapData,
  type GroupImagesResponse,
  type LapsResponse,
  type Detection,
  API_BASE_URL,
} from '../services/api'
import arrowIcon from '../assets/arrow.svg'

const MASK_BASE_URL = API_BASE_URL

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

const IMAGE_WIDTH = 286
const IMAGE_HEIGHT = 184
const MAGNIFIER_SIZE = 180
const MAGNIFIER_ZOOM = 3

const ImageContainer = styled.div`
  position: relative;
  width: ${IMAGE_WIDTH}px;
  height: ${IMAGE_HEIGHT}px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 220, 52, 0.3);
  cursor: zoom-in;
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

const NoPhotosText = styled(LoadingText)`
  margin-top: 0;
  width: 100%;
`

const MagnifierLens = styled.div<{ $visible: boolean }>`
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  border: 2px solid rgba(255, 220, 52, 0.85);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  transition: opacity 120ms ease;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  background: rgba(14, 12, 10, 0.85);
  z-index: 5;
`

const LensContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

const LensImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  object-fit: cover;
  user-select: none;
  pointer-events: none;
`

const LensMask = styled(LensImage)`
  mix-blend-mode: multiply;
  opacity: 0.6;
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
  onOpenEditor: () => void
}

function ImageWithMasks({ imageUrl, detections, onOpenEditor }: ImageWithMasksProps) {
  const [lensState, setLensState] = useState({
    visible: false,
    x: IMAGE_WIDTH / 2,
    y: IMAGE_HEIGHT / 2,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  })

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width)
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height)

    setLensState({
      visible: true,
      x,
      y,
      width: rect.width,
      height: rect.height,
    })
  }

  const handleMouseLeave = () => {
    setLensState((prev) => ({
      ...prev,
      visible: false,
    }))
  }

  const lensHalf = MAGNIFIER_SIZE / 2
  const scaledWidth = lensState.width * MAGNIFIER_ZOOM
  const scaledHeight = lensState.height * MAGNIFIER_ZOOM
  const offsetX = lensState.x * MAGNIFIER_ZOOM - lensHalf
  const offsetY = lensState.y * MAGNIFIER_ZOOM - lensHalf

  return (
    <ImageContainer onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={onOpenEditor}>
      <BaseImage src={imageUrl} alt="Фото" loading="lazy" />
      {detections.map((detection) => (
        <MaskLayer
          key={detection.id}
          src={`${MASK_BASE_URL}/mask/${detection.id}.png`}
          alt={`Маска для проблемы ${detection.id}`}
        />
      ))}
      <MagnifierLens
        $visible={lensState.visible}
        style={{
          width: `${MAGNIFIER_SIZE}px`,
          height: `${MAGNIFIER_SIZE}px`,
          top: `${lensState.y - lensHalf}px`,
          left: `${lensState.x - lensHalf}px`,
        }}
      >
        <LensContent>
          <LensImage
            src={imageUrl}
            alt=""
            style={{
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              left: `${-offsetX}px`,
              top: `${-offsetY}px`,
            }}
          />
          {detections.map((detection) => (
            <LensMask
              key={`lens-${detection.id}`}
              src={`${MASK_BASE_URL}/mask/${detection.id}.png`}
              alt=""
              style={{
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`,
                left: `${-offsetX}px`,
                top: `${-offsetY}px`,
              }}
            />
          ))}
        </LensContent>
      </MagnifierLens>
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
  const navigate = useNavigate()
  const { lapId } = useParams()
  const [currentLap, setCurrentLap] = useState<Lap | null>(laps.find((item) => item.id === lapId) || null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [sectionImages, setSectionImages] = useState<SectionImages>({})
  const [groupId, setGroupId] = useState<number | null>(null)
  const [isLapLoading, setIsLapLoading] = useState(true)

  const title = isLapLoading
    ? 'Загрузка ЛЭП...'
    : currentLap
      ? `Неисправности ЛЭП № ${currentLap.label}`
      : 'ЛЭП не найдена'

  useEffect(() => {
    const loadLapAndGroupId = async () => {
      if (!lapId) return
      setIsLapLoading(true)
      
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
      } finally {
        setIsLapLoading(false)
      }
    }
    void loadLapAndGroupId()
  }, [lapId])

  const toggleSection = async (sectionId: string) => {
    if (isLapLoading) {
      console.log('[LapIssuesPage] Preventing section toggle while lap is loading')
      return
    }
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
                            onOpenEditor={() =>
                              navigate('/editor', {
                                state: {
                                  imageUrl: `${API_BASE_URL}/image/${groupId}/${imageData.imageUid}.jpeg`,
                                  maskUrls: imageData.detections.map(
                                    (detection) => `${MASK_BASE_URL}/mask/${detection.id}.png`,
                                  ),
                                },
                              })
                            }
                          />
                        ))
                      ) : (
                        <NoPhotosText>Фотографий не найдено</NoPhotosText>
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

