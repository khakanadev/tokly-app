import { useEffect, useState, type MouseEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Content } from '../components/Layout'
import { Header } from '../components/Header'
import { type Lap } from '../components/MainHeader'
import greenDot from '../assets/green.svg'
import blueDot from '../assets/blue.svg'
import orangeDot from '../assets/orange.svg'
import yellowDot from '../assets/yellow.svg'
import dividerLine from '../assets/Line 9.svg'
import {
  getLaps,
  getGroupsFromLapData,
  getGroupImages,
  type LapsResponse,
  type GroupImagesResponse,
  type Detection,
  API_BASE_URL,
} from '../services/api'

type LapIssuesPageProps = {
  laps: Lap[]
}

const ContentSection = styled.section`
  width: 100%;
  border-radius: 15px;
  background: #0e0c0a;
  padding: 32px;
  display: flex;
  flex-direction: column;
`

const MetricsContainer = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: 32px;
  align-items: flex-start;
`

const MetricItem = styled.div`
  flex: 1 1 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
`

const MetricIcon = styled.img`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 6px;
`

const MetricTextGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const MetricLabel = styled.span`
  font-size: 28px;
  font-weight: 300;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
`

const MetricValue = styled.span`
  font-size: 24px;
  font-weight: 300;
  color: #cac8c6;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
`

const Divider = styled.img`
  width: 100%;
  margin-top: 27px;
`

const FiltersTitle = styled.h2`
  margin-top: 32px;
  margin-bottom: 24px;
  width: 100%;
  color: #ffffff;
  font-size: 32px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  word-wrap: break-word;
`

const FiltersGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
`

const FilterButton = styled.button`
  width: 100%;
  border-radius: 74px;
  border: 2px solid #ffe670;
  background: #fffce4;
  color: #1b1b1b;
  font-size: 28px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  padding: 16px 24px;
  cursor: pointer;
`

const PhotosTitle = styled.h2`
  margin-top: 40px;
  margin-bottom: 24px;
  width: 100%;
  color: #ffffff;
  font-size: 32px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  word-wrap: break-word;
`

const PhotosGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
`

const PhotoCard = styled.div`
  position: relative;
  width: 100%;
  padding-top: 64%;
  border-radius: 16px;
  border: 1px solid rgba(255, 220, 52, 0.3);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
  cursor: zoom-in;
  transition: transform 160ms ease, box-shadow 160ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  }
`

const PhotoBase = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const PhotoMask = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  mix-blend-mode: multiply;
  opacity: 0.6;
  pointer-events: none;
`

const PhotoStatusText = styled.div`
  margin-top: 12px;
  color: #cac8c6;
  font-size: 18px;
  font-family: 'Inter', sans-serif;
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

const metrics = [
  {
    icon: greenDot,
    label: 'Фото',
    value: '600',
  },
  {
    icon: blueDot,
    label: 'Всего объектов',
    value: '654',
  },
  {
    icon: orangeDot,
    label: 'Всего повреждений',
    value: '46',
  },
  {
    icon: yellowDot,
    label: 'Последний осмотр',
    value: '14.02.2025',
  },
]

const filterItems = [
  'Все фото',
  'Виброгаситель',
  'Гирлянда стекло',
  'Гирлянда полимер',
  'Траверс',
  'Изолятор-',
  'Изолятор+',
  'Гнезда',
  'Таблички',
]

const MASK_BASE_URL = API_BASE_URL
const IMAGE_WIDTH = 286
const IMAGE_HEIGHT = 184
const MAGNIFIER_SIZE = 180
const MAGNIFIER_ZOOM = 3

type ImageWithDetections = {
  imageUid: string
  detections: Detection[]
}

function ImageWithMasks({
  imageUrl,
  detections,
  onOpenEditor,
}: {
  imageUrl: string
  detections: Detection[]
  onOpenEditor: () => void
}) {
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
    <PhotoCard
      style={{ paddingTop: `${(IMAGE_HEIGHT / IMAGE_WIDTH) * 100}%` }}
      onClick={onOpenEditor}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <PhotoBase src={imageUrl} alt="Фото объекта" loading="lazy" />
      {detections.map((detection) => (
        <PhotoMask key={detection.id} src={`${MASK_BASE_URL}/mask/${detection.id}.png`} alt="" />
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
    </PhotoCard>
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
  const [currentLap, setCurrentLap] = useState<Lap | null>(laps.find((lap) => lap.id === lapId) || null)
  const [groupId, setGroupId] = useState<number | null>(null)
  const [isLapLoading, setIsLapLoading] = useState(true)
  const [images, setImages] = useState<ImageWithDetections[]>([])
  const [isImagesLoading, setIsImagesLoading] = useState(false)
  const [imagesError, setImagesError] = useState<string | null>(null)

  const title = isLapLoading
    ? 'Загрузка ЛЭП...'
    : currentLap
      ? `Неисправности ЛЭП № ${currentLap.label}`
      : 'ЛЭП не найдена'

  useEffect(() => {
    const loadLapAndGroup = async () => {
      if (!lapId) return
      setIsLapLoading(true)
      try {
        const data = await getLaps()
        const transformedLaps = transformLapsData(data)
        const foundLap = transformedLaps.find((lap) => lap.id === lapId) || null
        setCurrentLap(foundLap)

        const lapData = data[lapId]
        let foundGroupId: number | null = null

        if (lapData && typeof lapData === 'object' && 'last_group' in lapData && lapData.last_group) {
          foundGroupId = lapData.last_group as number
        } else {
          const groups = getGroupsFromLapData(lapData)
          if (groups.length > 0) {
            foundGroupId = groups[groups.length - 1].id
          }
        }

        setGroupId(foundGroupId)
      } catch (error) {
        console.error('[LapIssuesPage] Failed to load lap info', error)
      } finally {
        setIsLapLoading(false)
      }
    }

    void loadLapAndGroup()
  }, [lapId])

  useEffect(() => {
    const loadImages = async () => {
      if (!groupId) return
      setIsImagesLoading(true)
      setImagesError(null)

      try {
        const data: GroupImagesResponse = await getGroupImages(groupId)
        const mappedImages: ImageWithDetections[] = Object.entries(data.images).map(([imageUid, detections]) => ({
          imageUid,
          detections,
        }))
        setImages(mappedImages)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось загрузить фотографии'
        setImagesError(message)
      } finally {
        setIsImagesLoading(false)
      }
    }

    void loadImages()
  }, [groupId])

  return (
    <>
      <Header title={title} titleColor="#CAC8C6" titleFontSize="28px" titleFontWeight="400" />
      <Content>
        <ContentSection>
          <MetricsContainer>
            {metrics.map((metric) => (
              <MetricItem key={metric.label}>
                <MetricIcon src={metric.icon} alt="" />
                <MetricTextGroup>
                  <MetricLabel>{metric.label}</MetricLabel>
                  <MetricValue>{metric.value}</MetricValue>
                </MetricTextGroup>
              </MetricItem>
            ))}
          </MetricsContainer>
          <Divider src={dividerLine} alt="" />
          <FiltersTitle>Фильтры</FiltersTitle>
          <FiltersGrid>
            {filterItems.map((filter) => (
              <FilterButton key={filter}>{filter}</FilterButton>
            ))}
          </FiltersGrid>
          <PhotosTitle>Фотографии</PhotosTitle>
          {isImagesLoading && <PhotoStatusText>Загрузка фотографий...</PhotoStatusText>}
          {imagesError && <PhotoStatusText style={{ color: '#DF6F6D' }}>{imagesError}</PhotoStatusText>}
          {!isImagesLoading && !imagesError && images.length === 0 && (
            <PhotoStatusText>Фотографии не найдены</PhotoStatusText>
          )}
          {!isImagesLoading && !imagesError && images.length > 0 && (
            <PhotosGrid>
              {images.map((image) => (
                <ImageWithMasks
                  key={image.imageUid}
                  imageUrl={`${API_BASE_URL}/image/${groupId}/${image.imageUid}.jpeg`}
                  detections={image.detections}
                  onOpenEditor={() =>
                    navigate('/editor', {
                      state: {
                        imageUrl: `${API_BASE_URL}/image/${groupId}/${image.imageUid}.jpeg`,
                        maskUrls: image.detections.map((detection) => `${MASK_BASE_URL}/mask/${detection.id}.png`),
                      },
                    })
                  }
                />
              ))}
            </PhotosGrid>
          )}
        </ContentSection>
      </Content>
    </>
  )
}

