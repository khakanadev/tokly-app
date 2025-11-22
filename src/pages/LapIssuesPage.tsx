import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { Content } from '../components/Layout'
import { Header } from '../components/Header'
import { type Lap } from '../components/MainHeader'
import greenDot from '../assets/green.svg'
import redDot from '../assets/red.svg'
import orangesDot from '../assets/oranges.svg'
import yellowDot from '../assets/yellow.svg'
import dividerLine from '../assets/Line 9.svg'
import {
  getLaps,
  getGroupsFromLapData,
  getGroupImages,
  getGroupsByLap,
  type LapsResponse,
  type GroupImagesResponse,
  type Detection,
  type Group,
  API_BASE_URL,
} from '../services/api'
import { sectionClassMap } from '../constants/componentSections'

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
  justify-content: center;
  align-items: flex-start;
  gap: 30px;
  flex-wrap: nowrap;
`

const MetricItem = styled.div`
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

const FilterButton = styled.button<{ $active?: boolean }>`
  width: 100%;
  border-radius: 48px;
  border: 2px solid #ffe670;
  background: ${({ $active }) => ($active ? '#ffe670' : '#1b1b1b')};
  color: ${({ $active }) => ($active ? '#1b1b1b' : '#ffe670')};
  font-size: 22px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 220ms ease, color 220ms ease;
  outline: 2px solid #ffe670;
  outline-offset: -2px;

  &:hover {
    background: #ffe670;
    color: #1b1b1b;
  }
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

const PhotoCard = styled.div<{ $borderColor: string }>`
  position: relative;
  width: 100%;
  padding-top: 64%;
  border-radius: 16px;
  border: 3px solid ${({ $borderColor }) => $borderColor};
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
  mix-blend-mode: normal;
  opacity: 0.95;
  pointer-events: none;
  filter: contrast(1.1) brightness(1.05);
`

const PhotoStatusText = styled.div`
  margin-top: 12px;
  color: #cac8c6;
  font-size: 18px;
  font-family: 'Inter', sans-serif;
`

const PhotoSkeleton = styled.div`
  position: relative;
  width: 100%;
  padding-top: 64%;
  border-radius: 16px;
  border: 3px solid rgba(255, 220, 52, 0.3);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  animation: pulse 2s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 220, 52, 0.2),
      transparent
    );
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.6;
      border-color: rgba(255, 220, 52, 0.3);
    }
    50% {
      opacity: 0.8;
      border-color: rgba(255, 220, 52, 0.5);
    }
  }
`

const MetricSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  opacity: 0.6;
  width: 100%;
`

const SkeletonIcon = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 220, 52, 0.4);
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 0.7;
    }
  }
`

const SkeletonText = styled.div`
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 0.6;
    }
    50% {
      opacity: 0.3;
    }
  }
`

const SkeletonLabel = styled(SkeletonText)`
  width: 100%;
  max-width: 180px;
  margin-bottom: 4px;
  height: 28px;
`

const SkeletonValue = styled(SkeletonText)`
  width: 100%;
  max-width: 80px;
  height: 24px;
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
  mix-blend-mode: normal;
  opacity: 0.95;
  filter: contrast(1.1) brightness(1.05);
`

// Функция форматирования даты
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  } catch {
    return dateString
  }
}

const filterItems = [
  'Все фото',
  'Виброгаситель',
  'Гирлянда стекло',
  'Гирлянда полимер',
  'Траверс',
  'Критическая поломка',
  'Поломка',
  'Птичьи гнезда',
]

// Маппинг названий фильтров на id секций
const filterToSectionId: Record<string, string> = {
  'Все фото': '',
  'Виброгаситель': 'vibration_damper',
  'Гирлянда стекло': 'glass_garland',
  'Гирлянда полимер': 'polymer_garland',
  'Траверс': 'travers',
  'Критическая поломка': 'isolator_minus',
  'Поломка': 'isolator_plus',
  'Птичьи гнезда': 'nests',
}

const MASK_BASE_URL = API_BASE_URL
const IMAGE_WIDTH = 286
const IMAGE_HEIGHT = 184
const MAGNIFIER_SIZE = 180
const MAGNIFIER_ZOOM = 3

type ImageWithDetections = {
  imageUid: string
  detections: Detection[]
  maxDamageLevel: number
}

// Функция для получения цвета обводки на основе максимального damage_level
const getBorderColor = (maxDamageLevel: number): string => {
  if (maxDamageLevel === 0) {
    return '#FFDC34' // желтая
  } else if (maxDamageLevel > 0 && maxDamageLevel <= 3) {
    return '#FF8C42' // оранжевая
  } else {
    return '#DF6F6D' // красная
  }
}

function ImageWithMasks({
  imageUrl,
  detections,
  maxDamageLevel,
  onOpenEditor,
}: {
  imageUrl: string
  detections: Detection[]
  maxDamageLevel: number
  onOpenEditor: () => void
}) {
  const borderColor = getBorderColor(maxDamageLevel)
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
      $borderColor={borderColor}
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
  const [searchParams] = useSearchParams()
  const [currentLap, setCurrentLap] = useState<Lap | null>(laps.find((lap) => lap.id === lapId) || null)
  
  // Восстанавливаем groupId из кеша сразу при монтировании
  const initialGroupId = useMemo(() => {
    if (!lapId) return null
    const groupIdParam = searchParams.get('group_id')
    if (groupIdParam) {
      const parsed = Number.parseInt(groupIdParam, 10)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
    // Пытаемся восстановить из кеша
    const lastGroupKey = `lap-${lapId}-last-group`
    const cachedGroupId = sessionStorage.getItem(lastGroupKey)
    if (cachedGroupId) {
      const parsed = Number.parseInt(cachedGroupId, 10)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
    return null
  }, [lapId, searchParams])
  
  const [groupId, setGroupId] = useState<number | null>(initialGroupId)
  const [isLapLoading, setIsLapLoading] = useState(true)
  const [isImagesLoading, setIsImagesLoading] = useState(false)
  const [imagesError, setImagesError] = useState<string | null>(null)
  const [groupData, setGroupData] = useState<GroupImagesResponse | null>(null)
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<string>('Все фото')
  const [allImages, setAllImages] = useState<ImageWithDetections[]>([])

  // Восстанавливаем состояние фильтра из кеша при загрузке
  useEffect(() => {
    if (groupId && lapId) {
      const cacheKey = `lap-${lapId}-group-${groupId}`
      const cachedData = sessionStorage.getItem(cacheKey)
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          if (parsed.selectedFilter) {
            setSelectedFilter(parsed.selectedFilter)
          }
        } catch {
          // Игнорируем ошибки
        }
      }
    }
  }, [groupId, lapId])

  // Сохраняем состояние фильтра в кеш при изменении
  useEffect(() => {
    if (groupId && lapId) {
      const cacheKey = `lap-${lapId}-group-${groupId}`
      const cachedData = sessionStorage.getItem(cacheKey)
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          parsed.selectedFilter = selectedFilter
          sessionStorage.setItem(cacheKey, JSON.stringify(parsed))
        } catch {
          // Игнорируем ошибки
        }
      }
    }
  }, [selectedFilter, groupId, lapId])

  const getTitle = () => {
    if (isLapLoading) return 'Загрузка ЛЭП...'
    if (!currentLap || !lapId) return 'ЛЭП не найдена'
    
    // Проверяем, является ли lapId числом
    const lapIdNumber = Number.parseInt(lapId, 10)
    const isNumeric = !Number.isNaN(lapIdNumber) && lapIdNumber.toString() === lapId
    
    if (isNumeric) {
      return `ЛЭП №${lapId} - Неисправности`
    } else {
      return `ЛЭП ${lapId} - Неисправности`
    }
  }

  const title = getTitle()

  useEffect(() => {
    const loadLapAndGroup = async () => {
      if (!lapId) return
      setIsLapLoading(true)
      try {
        // Проверяем query параметр group_id
        const groupIdParam = searchParams.get('group_id')
        
        let targetGroupId: number | null = null
        
        if (groupIdParam) {
          const parsedGroupId = Number.parseInt(groupIdParam, 10)
          if (!Number.isNaN(parsedGroupId)) {
            targetGroupId = parsedGroupId
            // Сохраняем groupId в sessionStorage для восстановления при возврате назад
            const lastGroupKey = `lap-${lapId}-last-group`
            sessionStorage.setItem(lastGroupKey, parsedGroupId.toString())
            setGroupId(parsedGroupId) // Обновляем сразу
          }
        } else if (groupId) {
          // Если groupId уже восстановлен из кеша при монтировании, используем его
          targetGroupId = groupId
          // Сохраняем в кеш для будущего использования
          const lastGroupKey = `lap-${lapId}-last-group`
          sessionStorage.setItem(lastGroupKey, groupId.toString())
        } else {
          // Если нет query параметра и нет в начальном состоянии, пытаемся восстановить из кеша
          const lastGroupKey = `lap-${lapId}-last-group`
          const cachedGroupId = sessionStorage.getItem(lastGroupKey)
          if (cachedGroupId) {
            const parsedGroupId = Number.parseInt(cachedGroupId, 10)
            if (!Number.isNaN(parsedGroupId)) {
              targetGroupId = parsedGroupId
              setGroupId(parsedGroupId) // Обновляем сразу
            }
          }
        }
        
        if (targetGroupId) {
          setIsLapLoading(false)
          // Все равно загружаем информацию о ЛЭП
          const data = await getLaps()
          const transformedLaps = transformLapsData(data)
          const foundLap = transformedLaps.find((lap) => lap.id === lapId) || null
          setCurrentLap(foundLap)
          return
        }

        // Если group_id не указан, используем логику по умолчанию
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
      } catch {
        // Игнорируем ошибки загрузки
      } finally {
        setIsLapLoading(false)
      }
    }

    void loadLapAndGroup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lapId, searchParams])

  useEffect(() => {
    const loadImages = async () => {
      if (!groupId) return

      // Проверяем кеш в sessionStorage ПЕРЕД установкой состояния загрузки
      const cacheKey = `lap-${lapId}-group-${groupId}`
      const cachedData = sessionStorage.getItem(cacheKey)
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          // Проверяем, что кеш не слишком старый (например, не старше 5 минут)
          const cacheAge = Date.now() - (parsed.timestamp || 0)
          const MAX_CACHE_AGE = 5 * 60 * 1000 // 5 минут
          
          if (cacheAge < MAX_CACHE_AGE && parsed.groupData && parsed.allImages) {
            setGroupData(parsed.groupData)
            setAllImages(parsed.allImages)
            if (parsed.currentGroup) {
              setCurrentGroup(parsed.currentGroup)
            }
            if (parsed.selectedFilter) {
              setSelectedFilter(parsed.selectedFilter)
            }
            setIsImagesLoading(false)
            setImagesError(null)
            return // Выходим, не делая запрос
          } else {
            sessionStorage.removeItem(cacheKey) // Удаляем устаревший кеш
          }
        } catch {
          sessionStorage.removeItem(cacheKey) // Удаляем поврежденный кеш
        }
      }

      // Если кеша нет или он невалиден, загружаем данные
      setIsImagesLoading(true)
      setImagesError(null)

      try {
        const data: GroupImagesResponse = await getGroupImages(groupId)
        setGroupData(data)
        const mappedImages: ImageWithDetections[] = Object.entries(data.images).map(([imageUid, detections]) => {
          // Вычисляем максимальный damage_level для этого изображения
          const maxDamageLevel = detections.length > 0
            ? Math.max(...detections.map((d) => d.damage_level))
            : 0
          return {
          imageUid,
          detections,
            maxDamageLevel,
          }
        })
        // Сортируем по максимальному damage_level от большего к меньшему
        mappedImages.sort((a, b) => b.maxDamageLevel - a.maxDamageLevel)
        setAllImages(mappedImages)

        // Сохраняем в кеш (currentGroup будет добавлен позже в loadGroupInfo)
        const cacheData = {
          groupData: data,
          allImages: mappedImages,
          currentGroup: null,
          selectedFilter: selectedFilter,
          timestamp: Date.now(),
        }
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить фотографии'
        setImagesError(message)
      } finally {
        setIsImagesLoading(false)
      }
    }

    void loadImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, lapId])

  useEffect(() => {
    const loadGroupInfo = async () => {
      if (!groupId || !lapId) return

      // Проверяем кеш
      const cacheKey = `lap-${lapId}-group-${groupId}`
      const cachedData = sessionStorage.getItem(cacheKey)
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          // Проверяем возраст кеша
          const cacheAge = Date.now() - (parsed.timestamp || 0)
          const MAX_CACHE_AGE = 5 * 60 * 1000 // 5 минут
          
          if (cacheAge < MAX_CACHE_AGE && parsed.currentGroup) {
            setCurrentGroup(parsed.currentGroup)
            return // Не делаем запрос, если данные в кеше
          }
        } catch {
          // Продолжаем загрузку, если кеш поврежден
        }
      }

      // Загружаем только если кеша нет или он устарел
      try {
        const groups = await getGroupsByLap(lapId)
        const foundGroup = groups.find((g) => g.id === groupId)
        if (foundGroup) {
          setCurrentGroup(foundGroup)
          // Обновляем кеш с информацией о группе
          if (cachedData) {
            try {
              const parsed = JSON.parse(cachedData)
              parsed.currentGroup = foundGroup
              parsed.timestamp = Date.now()
              sessionStorage.setItem(cacheKey, JSON.stringify(parsed))
            } catch {
              // Игнорируем ошибки обновления кеша
            }
          }
        }
      } catch {
        // Игнорируем ошибки загрузки
      }
    }

    void loadGroupInfo()
  }, [groupId, lapId])

  // Вычисление метрик из реальных данных
  const getMetrics = () => {
    if (!groupData) {
      return [
        {
          icon: greenDot,
          label: 'Всего фото',
          value: '-',
        },
        {
          icon: redDot,
          label: 'Критических повреждений',
          value: '-',
        },
        {
          icon: orangesDot,
          label: 'Простых повреждений',
          value: '-',
        },
        {
          icon: yellowDot,
          label: 'Последний осмотр',
          value: '-',
        },
      ]
    }

    // Подсчет критических повреждений (damage_level > 3)
    let criticalDamagesCount = 0
    // Подсчет простых повреждений (damage_level > 0 && <= 3)
    let simpleDamagesCount = 0
    
    Object.values(groupData.images).forEach((detections) => {
      detections.forEach((detection) => {
        if (detection.damage_level > 3) {
          criticalDamagesCount++
        } else if (detection.damage_level > 0 && detection.damage_level <= 3) {
          simpleDamagesCount++
        }
      })
    })

    return [
      {
        icon: greenDot,
        label: 'Всего фото',
        value: groupData.image_count.toString(),
      },
      {
        icon: redDot,
        label: 'Критических повреждений',
        value: criticalDamagesCount.toString(),
      },
      {
        icon: orangesDot,
        label: 'Простых повреждений',
        value: simpleDamagesCount.toString(),
      },
      {
        icon: yellowDot,
        label: 'Последний осмотр',
        value: currentGroup ? formatDate(currentGroup.create_at) : '-',
      },
    ]
  }

  const metrics = getMetrics()

  // Функция фильтрации изображений по выбранному фильтру
  const getFilteredImages = (): ImageWithDetections[] => {
    if (selectedFilter === 'Все фото') {
      return allImages
    }

    const sectionId = filterToSectionId[selectedFilter]
    if (!sectionId) {
      return allImages
    }

    const allowedClasses = sectionClassMap[sectionId]
    if (!allowedClasses || allowedClasses.length === 0) {
      return allImages
    }

    // Фильтруем изображения, оставляя только те, у которых есть детекции с соответствующим классом
    return allImages.filter((image) => {
      return image.detections.some((detection) => 
        allowedClasses.includes(detection.class)
      )
    })
  }

  const filteredImages = getFilteredImages()

  return (
    <>
      <Header title={title} titleColor="#CAC8C6" titleFontSize="28px" titleFontWeight="400" />
      <Content>
        <ContentSection>
          <MetricsContainer>
            {isLapLoading || isImagesLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <MetricSkeleton key={`metric-skeleton-${index}`}>
                  <SkeletonIcon />
                  <MetricTextGroup style={{ width: '100%', alignItems: 'center', textAlign: 'center' }}>
                    <SkeletonLabel />
                    <SkeletonValue />
                  </MetricTextGroup>
                </MetricSkeleton>
              ))
            ) : (
              metrics.map((metric) => (
              <MetricItem key={metric.label}>
                <MetricIcon src={metric.icon} alt="" />
                <MetricTextGroup>
                  <MetricLabel>{metric.label}</MetricLabel>
                  <MetricValue>{metric.value}</MetricValue>
                </MetricTextGroup>
              </MetricItem>
              ))
            )}
          </MetricsContainer>
          <Divider src={dividerLine} alt="" />
          <FiltersTitle>Фильтры</FiltersTitle>
          <FiltersGrid>
            {filterItems.map((filter) => (
              <FilterButton
                key={filter}
                $active={selectedFilter === filter}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </FilterButton>
            ))}
          </FiltersGrid>
          <PhotosTitle>Фотографии</PhotosTitle>
          {isImagesLoading || (allImages.length === 0 && !imagesError && !groupData) ? (
            <PhotosGrid>
              {Array.from({ length: 6 }).map((_, index) => (
                <PhotoSkeleton key={`skeleton-${index}`} />
              ))}
            </PhotosGrid>
          ) : imagesError ? (
            <PhotoStatusText style={{ color: '#DF6F6D' }}>{imagesError}</PhotoStatusText>
          ) : filteredImages.length === 0 && groupData ? (
            <PhotoStatusText>Фотографии не найдены</PhotoStatusText>
          ) : (
            <PhotosGrid>
              {filteredImages.map((image) => (
                <ImageWithMasks
                  key={image.imageUid}
                  imageUrl={`${API_BASE_URL}/image/${groupId}/${image.imageUid}.jpeg`}
                  detections={image.detections}
                  maxDamageLevel={image.maxDamageLevel}
                  onOpenEditor={() => {
                    if (!groupId || !image.imageUid) return
                    
                    // Обновляем кеш перед переходом, чтобы сохранить текущее состояние
                    if (groupId && lapId && groupData && allImages.length > 0) {
                      const cacheKey = `lap-${lapId}-group-${groupId}`
                      const lastGroupKey = `lap-${lapId}-last-group`
                      
                      // Сохраняем groupId для восстановления при возврате назад
                      sessionStorage.setItem(lastGroupKey, groupId.toString())
                      
                      const cacheData = {
                        groupData,
                        allImages,
                        currentGroup,
                        selectedFilter,
                        timestamp: Date.now(),
                      }
                      try {
                        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
                      } catch {
                        // Игнорируем ошибки сохранения кеша
                      }
                    }

                    const state = {
                        imageUrl: `${API_BASE_URL}/image/${groupId}/${image.imageUid}.jpeg`,
                        maskUrls: image.detections.map((detection) => `${MASK_BASE_URL}/mask/${detection.id}.png`),
                        detections: image.detections,
                      groupId: groupId,
                      imageUid: image.imageUid,
                  }
                    navigate('/editor', { state })
                  }}
                />
              ))}
            </PhotosGrid>
          )}
        </ContentSection>
      </Content>
    </>
  )
}

