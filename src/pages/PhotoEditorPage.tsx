import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import styled from 'styled-components'
import { useLocation, useNavigate } from 'react-router-dom'
import { Content } from '../components/Layout'
import paletteIcon from '../assets/Palette.svg'
import penIcon from '../assets/pen.svg'
import textIcon from '../assets/txt.svg'
import logo from '../assets/tokly11.svg'
import backArrow from '../assets/Arrow 3.svg'
import undoIcon from '../assets/undo.svg'
import { API_BASE_URL } from '../services/api'

type ToolType = 'color' | 'rectangle' | 'text'

type RectangleShape = {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: string
  createdAt: number
}

type TextShape = {
  id: string
  x: number
  y: number
  color: string
  value: string
  createdAt: number
}

type TextModalState = {
  x: number
  y: number
}

type Detection = {
  id: number
  class: string
  damage_level: number
}

type LocationState = {
  imageUrl?: string
  maskUrls?: string[]
  detections?: Detection[]
  groupId?: number
  imageUid?: string
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80'

export function PhotoEditorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [activeTool, setActiveTool] = useState<ToolType>('rectangle')
  const [selectedColor, setSelectedColor] = useState('#FFDC34')
  const [rectangles, setRectangles] = useState<RectangleShape[]>([])
  const [texts, setTexts] = useState<TextShape[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingOrigin, setDrawingOrigin] = useState<{ x: number; y: number } | null>(null)
  const [previewRect, setPreviewRect] = useState<RectangleShape | null>(null)
  const [textModalState, setTextModalState] = useState<TextModalState | null>(null)
  const [textInputValue, setTextInputValue] = useState('')
  const textInputRef = useRef<HTMLInputElement | null>(null)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [showPolygons, setShowPolygons] = useState(false)
  const [showCustomMask, setShowCustomMask] = useState(true) // Включено по умолчанию
  const [showCriticalMasks, setShowCriticalMasks] = useState(true) // Критические повреждения
  const [showDamageMasks, setShowDamageMasks] = useState(true) // Простые повреждения
  const [showObjectMasks, setShowObjectMasks] = useState(true) // Объекты
  const [customMaskUrl, setCustomMaskUrl] = useState<string | null>(null)
  const [isSavingMask, setIsSavingMask] = useState(false)
  const [maskKey, setMaskKey] = useState(0) // Ключ для принудительной перезагрузки маски
  const basePhotoRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (textModalState && textInputRef.current) {
      textInputRef.current.focus()
    }
  }, [textModalState])

  const colorOptions = useMemo(
    () => ['#FFDC34', '#FF8C00', '#22C55E', '#38BDF8', '#F472B6', '#94A3B8', '#FFFFFF', '#D946EF'],
    [],
  )

  const locationState = useMemo(() => (location.state as LocationState | undefined) ?? {}, [location.state])
  const imageUrl = locationState.imageUrl ?? DEFAULT_IMAGE
  const allMaskUrls = useMemo(() => locationState.maskUrls ?? [], [locationState.maskUrls])
  const detections = useMemo(() => locationState.detections ?? [], [locationState.detections])
  const groupId = locationState.groupId
  const imageUid = locationState.imageUid

  // Логирование для отладки
  useEffect(() => {
    console.log('[PhotoEditorPage] Location state:', {
      groupId,
      imageUid,
      hasImageUrl: !!locationState.imageUrl,
      hasMaskUrls: !!locationState.maskUrls,
      fullState: locationState,
    })
  }, [groupId, imageUid, locationState])

  // Вычисляем URL полигона (всегда, независимо от showPolygons, для предзагрузки)
  const polygonUrl = useMemo(() => {
    if (groupId && imageUid) {
      return `${API_BASE_URL}/polygon/${groupId}/${imageUid}.png`
    }
    return null
  }, [groupId, imageUid])

  // Предзагрузка полигона в кэш браузера при загрузке страницы
  useEffect(() => {
    if (polygonUrl) {
      const img = new Image()
      img.src = polygonUrl
    }
  }, [polygonUrl])

  // Загрузка пользовательской маски при загрузке страницы (предзагрузка)
  useEffect(() => {
    const loadCustomMask = async () => {
      if (!groupId || !imageUid) return

      const maskUrl = `${API_BASE_URL}/image/${groupId}/${imageUid}_mask.png`
      
      // Предзагружаем маску в кэш браузера через Image объект для мгновенного отображения
      const maskImg = new Image()
      await new Promise<void>((resolve) => {
        maskImg.onload = () => {
          // Маска успешно загружена, устанавливаем URL
          const urlWithTimestamp = `${maskUrl}?t=${Date.now()}`
          setCustomMaskUrl(urlWithTimestamp)
          setShowCustomMask(true)
          resolve()
        }
        maskImg.onerror = () => {
          // Маска не существует, это нормально
          setCustomMaskUrl(null)
          setShowCustomMask(true) // Переключатель остается включенным
          resolve()
        }
        maskImg.src = maskUrl
      })
    }

    void loadCustomMask()
  }, [groupId, imageUid])

  // Создаем мапу для связи масок с детекциями по индексу
  // maskUrls и detections должны быть в одинаковом порядке
  const maskToDetectionMap = useMemo(() => {
    const map = new Map<string, Detection>()
    allMaskUrls.forEach((maskUrl, index) => {
      if (detections[index]) {
        map.set(maskUrl, detections[index])
      }
    })
    return map
  }, [allMaskUrls, detections])

  // Фильтруем маски на основе включенных переключателей
  const filteredMaskUrls = useMemo(() => {
    // Если все переключатели выключены, не показываем маски
    if (!showCriticalMasks && !showDamageMasks && !showObjectMasks) {
      return []
    }

    return allMaskUrls.filter((maskUrl) => {
      const detection = maskToDetectionMap.get(maskUrl)
      if (!detection) return false

      const damageLevel = detection.damage_level

      // Проверяем каждый тип маски независимо
      if (damageLevel > 3 && showCriticalMasks) {
        return true
      }
      if (damageLevel > 0 && damageLevel <= 3 && showDamageMasks) {
        return true
      }
      if (damageLevel === 0 && showObjectMasks) {
        return true
      }

      return false
    })
  }, [allMaskUrls, showCriticalMasks, showDamageMasks, showObjectMasks, maskToDetectionMap])

  const getRelativePosition = (event: MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) {
      return { x: 0, y: 0 }
    }
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width)
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height)
    return { x, y }
  }

  const resetDrawingState = () => {
    setIsDrawing(false)
    setDrawingOrigin(null)
    setPreviewRect(null)
  }

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'rectangle') {
      return
    }
    if (textModalState) {
      return
    }
    const position = getRelativePosition(event)
    setDrawingOrigin(position)
    setIsDrawing(true)
    setPreviewRect({
      id: 'preview',
      x: position.x,
      y: position.y,
      width: 0,
      height: 0,
      color: selectedColor,
      createdAt: Date.now(),
    })
  }

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || activeTool !== 'rectangle' || !drawingOrigin || textModalState) {
      return
    }
    const current = getRelativePosition(event)
    const width = Math.abs(current.x - drawingOrigin.x)
    const height = Math.abs(current.y - drawingOrigin.y)
    const x = Math.min(current.x, drawingOrigin.x)
    const y = Math.min(current.y, drawingOrigin.y)
    setPreviewRect((prev) => ({
      id: 'preview',
      x,
      y,
      width,
      height,
      color: selectedColor,
      createdAt: prev?.createdAt ?? Date.now(),
    }))
  }

  const handleMouseUp = () => {
    if (!isDrawing || !previewRect || previewRect.width < 4 || previewRect.height < 4) {
      resetDrawingState()
      return
    }
    setRectangles((prev) => [
      ...prev,
      { ...previewRect, id: `rect-${Date.now()}-${prev.length}`, createdAt: Date.now() },
    ])
    resetDrawingState()
  }

  const handleCanvasClick = (event: MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'text' || textModalState) {
      return
    }
    const position = getRelativePosition(event)
    setTextModalState(position)
    setTextInputValue('')
  }

  const handleConfirmText = () => {
    const value = textInputValue.trim()
    if (!value || !textModalState) {
      return
    }
    setTexts((prev) => [
      ...prev,
      {
        id: `text-${Date.now()}-${prev.length}`,
        x: textModalState.x,
        y: textModalState.y,
        color: selectedColor,
        value,
        createdAt: Date.now(),
      },
    ])
    setTextModalState(null)
    setTextInputValue('')
  }

  const handleCancelText = () => {
    setTextModalState(null)
    setTextInputValue('')
  }

  const handleSave = async () => {
    if (!groupId || !imageUid || (rectangles.length === 0 && texts.length === 0)) {
      return
    }

    setIsSavingMask(true)

    try {
      // Получаем размеры исходного изображения
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imageUrl
      })

      const imgWidth = img.naturalWidth
      const imgHeight = img.naturalHeight

      // Создаем canvas для маски
      const canvas = document.createElement('canvas')
      canvas.width = imgWidth
      canvas.height = imgHeight
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Заполняем прозрачным фоном
      ctx.clearRect(0, 0, imgWidth, imgHeight)

      // Получаем размеры отображаемого изображения для масштабирования
      const canvasElement = canvasRef.current
      if (!canvasElement) {
        throw new Error('Failed to get canvas element')
      }

      const basePhotoElement = basePhotoRef.current
      if (!basePhotoElement) {
        throw new Error('Failed to get base photo element')
      }

      const canvasRect = canvasElement.getBoundingClientRect()

      // Вычисляем реальные размеры изображения с учетом object-fit: contain
      const imgAspectRatio = imgWidth / imgHeight
      const containerAspectRatio = canvasRect.width / canvasRect.height

      let displayedWidth: number
      let displayedHeight: number
      let offsetX = 0
      let offsetY = 0

      if (imgAspectRatio > containerAspectRatio) {
        // Изображение масштабируется по ширине
        displayedWidth = canvasRect.width
        displayedHeight = canvasRect.width / imgAspectRatio
        offsetY = (canvasRect.height - displayedHeight) / 2
      } else {
        // Изображение масштабируется по высоте
        displayedHeight = canvasRect.height
        displayedWidth = canvasRect.height * imgAspectRatio
        offsetX = (canvasRect.width - displayedWidth) / 2
      }

      // Масштабируем координаты с учетом реального размера изображения
      const scaleX = imgWidth / displayedWidth
      const scaleY = imgHeight / displayedHeight

      // Рисуем контуры прямоугольников на canvas с цветом из палитры
      ctx.lineWidth = 2 // Толщина линии
      rectangles.forEach((rect) => {
        // Вычитаем offset, чтобы координаты были относительно изображения, а не контейнера
        const x = (rect.x - offsetX) * scaleX
        const y = (rect.y - offsetY) * scaleY
        const width = rect.width * scaleX
        const height = rect.height * scaleY
        
        // Проверяем, что прямоугольник находится в пределах изображения
        if (x >= 0 && y >= 0 && x + width <= imgWidth && y + height <= imgHeight) {
          // Используем цвет прямоугольника из палитры
          ctx.strokeStyle = rect.color
          ctx.strokeRect(x, y, width, height)
        }
      })

      // Рисуем тексты на canvas
      ctx.font = `${Math.round(16 * scaleX)}px Inter, sans-serif` // Масштабируем размер шрифта
      ctx.textBaseline = 'top'
      texts.forEach((text) => {
        // Вычитаем offset, чтобы координаты были относительно изображения, а не контейнера
        const x = (text.x - offsetX) * scaleX
        const y = (text.y - offsetY) * scaleY
        
        // Проверяем, что текст находится в пределах изображения
        if (x >= 0 && y >= 0 && x <= imgWidth && y <= imgHeight) {
          ctx.fillStyle = text.color
          ctx.fillText(text.value, x, y)
        }
      })

      // Конвертируем canvas в PNG blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to convert canvas to blob'))
            }
          },
          'image/png',
        )
      })

      // Отправляем маску на сервер
      const maskUrl = `${API_BASE_URL}/image/${groupId}/${imageUid}_mask.png`
      const maskResponse = await fetch(maskUrl, {
        method: 'POST',
        body: blob,
        headers: {
          'Content-Type': 'image/png',
        },
      })

      if (!maskResponse.ok) {
        throw new Error(`Failed to save mask: ${maskResponse.statusText}`)
      }

      // Пытаемся сохранить тексты в JSON файл (опционально, не критично)
      // Тексты уже нарисованы на canvas и сохранены в изображении маски
      if (texts.length > 0) {
        try {
          const textsUrl = `${API_BASE_URL}/image/${groupId}/${imageUid}_texts.json`
          const textsResponse = await fetch(textsUrl, {
            method: 'POST',
            body: JSON.stringify(texts),
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!textsResponse.ok) {
            // Не критичная ошибка - тексты уже в изображении маски
            console.warn('[PhotoEditorPage] Failed to save texts JSON, but texts are already in mask image')
          }
        } catch (error) {
          // Не критичная ошибка - тексты уже в изображении маски
          console.warn('[PhotoEditorPage] Failed to save texts JSON, but texts are already in mask image:', error)
        }
      }

      // Обновляем URL маски с timestamp для обновления кеша и принудительной перезагрузки
      const urlWithTimestamp = `${maskUrl}?t=${Date.now()}`
      
      // Предзагружаем маску, чтобы убедиться, что она загрузилась
      const maskImg = new Image()
      await new Promise<void>((resolve, reject) => {
        maskImg.onload = () => resolve()
        maskImg.onerror = reject
        maskImg.src = urlWithTimestamp
      })

      // После успешной загрузки маски очищаем разметку и показываем маску
      setRectangles([])
      setTexts([])
      setCustomMaskUrl(urlWithTimestamp)
      setShowCustomMask(true)
      setMaskKey((prev) => prev + 1) // Обновляем ключ для принудительной перезагрузки изображения
    } catch (error) {
      console.error('[PhotoEditorPage] Failed to save custom mask:', error)
    } finally {
      setIsSavingMask(false)
    }
  }

  const handleUndo = () => {
    const lastRectangle = rectangles[rectangles.length - 1]
    const lastText = texts[texts.length - 1]

    if (!lastRectangle && !lastText) {
      return
    }

    if (lastRectangle && (!lastText || lastRectangle.createdAt >= lastText.createdAt)) {
      setRectangles((prev) => prev.slice(0, -1))
      return
    }

    if (lastText) {
      setTexts((prev) => prev.slice(0, -1))
    }
  }

  return (
    <Content>
      <EditorWrapper>
        <EditorHeader>
          <BackButton type="button" onClick={() => navigate(-1)} aria-label="Назад">
            <BackArrow src={backArrow} alt="Назад" draggable={false} />
          </BackButton>
          <HeaderTitle>Просмотр</HeaderTitle>
          <HeaderLogo src={logo} alt="Tokly" />
        </EditorHeader>
        <EditorBody>
          <CanvasContainer>
            <CanvasSurface
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleCanvasClick}
              $tool={activeTool}
            >
              <BasePhotoWrapper>
                <BasePhoto ref={basePhotoRef} src={imageUrl} alt="Редактируемое фото" draggable={false} />
                {filteredMaskUrls.map((maskUrl, index) => (
                  <MaskImage key={`${maskUrl}-${index}`} src={maskUrl} alt="Маска" draggable={false} />
                ))}
                {showPolygons && polygonUrl && (
                  <PolygonImage src={polygonUrl} alt="Полигон" draggable={false} />
                )}
                {showCustomMask && customMaskUrl && (
                  <MaskImage key={maskKey} src={customMaskUrl} alt="Моя маска" draggable={false} />
                )}
              </BasePhotoWrapper>
              <OverlayLayer>
                {rectangles.map((rect) => (
                  <Rectangle
                    key={rect.id}
                    style={{
                      top: rect.y,
                      left: rect.x,
                      width: rect.width,
                      height: rect.height,
                      borderColor: rect.color,
                    }}
                  />
                ))}
                {previewRect && (
                  <Rectangle
                    style={{
                      top: previewRect.y,
                      left: previewRect.x,
                      width: previewRect.width,
                      height: previewRect.height,
                      borderColor: previewRect.color,
                      borderStyle: 'dashed',
                    }}
                  />
                )}
                {texts.map((item) => (
                  <TextMark
                    key={item.id}
                    style={{ top: item.y, left: item.x, color: item.color }}
                  >
                    {item.value}
                  </TextMark>
                ))}
              </OverlayLayer>
            </CanvasSurface>
          </CanvasContainer>
          <ToolsColumn>
            <ToolsPanel>
              <UndoButton 
                type="button" 
                onClick={handleUndo} 
                aria-label="Отменить последнее действие"
                disabled={rectangles.length === 0 && texts.length === 0}
              >
                <UndoIcon src={undoIcon} alt="" />
                <UndoButtonText>Отменить</UndoButtonText>
              </UndoButton>
              <ToolsStack>
                <ToolButton
                  type="button"
                  onClick={() => setIsColorPickerOpen(true)}
                  $active={false}
                >
                  <ToolIconWrapper>
                    <ToolIcon src={paletteIcon} alt="Выбор цвета" />
                    <SelectedColorIndicator $color={selectedColor} />
                  </ToolIconWrapper>
                </ToolButton>
                <ToolButton
                  type="button"
                  onClick={() => setActiveTool('rectangle')}
                  $active={activeTool === 'rectangle'}
                >
                  <ToolIcon src={penIcon} alt="Нарисовать" />
                </ToolButton>
                <ToolButton
                  type="button"
                  onClick={() => setActiveTool('text')}
                  $active={activeTool === 'text'}
                >
                  <ToolIcon src={textIcon} alt="Добавить текст" />
                </ToolButton>
              </ToolsStack>
              <SaveButton type="button" onClick={handleSave} disabled={isSavingMask || rectangles.length === 0 || !groupId || !imageUid}>
                <span>{isSavingMask ? 'Сохранение...' : 'Сохранить'}</span>
              </SaveButton>
            </ToolsPanel>
            <PanelContainer>
              <ProblemsTitle>Маски</ProblemsTitle>
              <FilterButtons>
                <MaskToggleItem>
                  <MaskToggleLabel>Критические проблемы</MaskToggleLabel>
                  <MaskToggleSwitch
                    type="button"
                    $active={showCriticalMasks}
                    onClick={() => setShowCriticalMasks(!showCriticalMasks)}
                  >
                    <MaskToggleSlider $active={showCriticalMasks} />
                  </MaskToggleSwitch>
                </MaskToggleItem>
                <MaskToggleItem>
                  <MaskToggleLabel>Простые повреждения</MaskToggleLabel>
                  <MaskToggleSwitch
                    type="button"
                    $active={showDamageMasks}
                    onClick={() => setShowDamageMasks(!showDamageMasks)}
                  >
                    <MaskToggleSlider $active={showDamageMasks} />
                  </MaskToggleSwitch>
                </MaskToggleItem>
                <MaskToggleItem>
                  <MaskToggleLabel>Объекты</MaskToggleLabel>
                  <MaskToggleSwitch
                    type="button"
                    $active={showObjectMasks}
                    onClick={() => setShowObjectMasks(!showObjectMasks)}
                  >
                    <MaskToggleSlider $active={showObjectMasks} />
                  </MaskToggleSwitch>
                </MaskToggleItem>
                <MaskToggleItem>
                  <MaskToggleLabel>Моя маска</MaskToggleLabel>
                  <MaskToggleSwitch
                    type="button"
                    $active={showCustomMask}
                    onClick={() => setShowCustomMask(!showCustomMask)}
                    disabled={!customMaskUrl}
                  >
                    <MaskToggleSlider $active={showCustomMask} />
                  </MaskToggleSwitch>
                </MaskToggleItem>
              </FilterButtons>
              <PolygonSection>
                <MaskToggleItem>
                  <MaskToggleLabel>Выделить объекты</MaskToggleLabel>
                  <MaskToggleSwitch
                    type="button"
                    $active={showPolygons}
                    onClick={() => setShowPolygons(!showPolygons)}
                    disabled={!polygonUrl}
                  >
                    <MaskToggleSlider $active={showPolygons} />
                  </MaskToggleSwitch>
                </MaskToggleItem>
              </PolygonSection>
            </PanelContainer>
          </ToolsColumn>
        </EditorBody>
        {textModalState && (
          <TextModalOverlay>
            <TextModal>
              <TextModalTitle>Добавить текст</TextModalTitle>
              <TextModalInput
                ref={textInputRef}
                type="text"
                placeholder="Введите текст для отметки"
                value={textInputValue}
                onChange={(event) => setTextInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleConfirmText()
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    handleCancelText()
                  }
                }}
              />
              <TextModalActions>
                <TextModalButton type="button" onClick={handleCancelText}>
                  Отмена
                </TextModalButton>
                <TextModalButton type="button" $variant="primary" onClick={handleConfirmText}>
                  Добавить
                </TextModalButton>
              </TextModalActions>
            </TextModal>
          </TextModalOverlay>
        )}
        {isColorPickerOpen && (
          <ColorPickerOverlay onClick={() => setIsColorPickerOpen(false)}>
            <ColorPickerModal onClick={(e) => e.stopPropagation()}>
              <ColorPickerTitle>Выберите цвет</ColorPickerTitle>
              <ColorPickerGrid>
                {colorOptions.map((color) => (
                  <ColorSwatch
                    key={color}
                    type="button"
                    $color={color}
                    $selected={selectedColor === color}
                    $size={48}
                    onClick={() => {
                      setSelectedColor(color)
                      setIsColorPickerOpen(false)
                    }}
                    aria-label={`Выбрать цвет ${color}`}
                  />
                ))}
              </ColorPickerGrid>
              <ColorPickerActions>
                <ColorPickerButton type="button" onClick={() => setIsColorPickerOpen(false)}>
                  Закрыть
                </ColorPickerButton>
              </ColorPickerActions>
            </ColorPickerModal>
          </ColorPickerOverlay>
        )}
      </EditorWrapper>
    </Content>
  )
}

const EditorWrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`

const EditorHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0e0c0a;
  border-radius: 15px;
  padding: 16px 32px;
  height: 80px;
  min-height: 80px;
  max-height: 80px;
`

const BackButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: transform 150ms ease, filter 150ms ease;

  &:hover {
    transform: translateX(-4px);
    filter: drop-shadow(0 6px 16px rgba(255, 220, 52, 0.3));
  }
`

const BackArrow = styled.img`
  width: 110px;
  height: auto;
  user-select: none;
  pointer-events: none;
`

const HeaderTitle = styled.div`
  width: 100%;
  text-align: center;
  color: #cac8c6;
  font-size: 28px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
`

const HeaderLogo = styled.img`
  height: 50px;
  width: auto;
  display: block;
`

const EditorBody = styled.div`
  display: flex;
  gap: 24px;
  align-items: stretch;
  height: calc(100vh - 260px);
  min-height: 420px;
`

const CanvasContainer = styled.div`
  flex: 1;
  background: #0e0c0a;
  border-radius: 15px;
  padding: 24px;
  display: flex;
  min-height: 0;
`

const CanvasSurface = styled.div<{ $tool: ToolType }>`
  position: relative;
  flex: 1;
  min-height: 0;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #050505;
  cursor: ${({ $tool }) => {
    switch ($tool) {
      case 'rectangle':
        return 'crosshair'
      case 'text':
        return 'text'
      default:
        return 'default'
    }
  }};
`

const BasePhotoWrapper = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`

const BasePhoto = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  -webkit-user-select: none;
`

const MaskImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: normal;
  opacity: 0.95;
  user-select: none;
  pointer-events: none;
  filter: contrast(1.1) brightness(1.05);
`

const PolygonImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  z-index: 10;
`

const OverlayLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`

const Rectangle = styled.div`
  position: absolute;
  border: 2px solid #ffdc34;
  border-radius: 6px;
  pointer-events: none;
`

const TextMark = styled.span`
  position: absolute;
  pointer-events: none;
  font-size: 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
`

const ToolsColumn = styled.div`
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const ToolsPanel = styled.aside`
  width: 100%;
  background: #0e0c0a;
  border-radius: 15px;
  padding: 24px;
  padding-bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: fit-content;
`

const PanelContainer = styled.div`
  width: 100%;
  background: #0e0c0a;
  border-radius: 15px;
  flex: 1;
  min-height: 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const ProblemsTitle = styled.div`
  width: 100%;
  color: #cac8c6;
  font-size: 18px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  word-wrap: break-word;
`

const FilterButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const MaskToggleItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const MaskToggleLabel = styled.span`
  color: #cac8c6;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  flex: 1;
`

const MaskToggleSwitch = styled.button<{ $active: boolean; $disabled?: boolean }>`
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: ${({ $active, $disabled }) =>
    $disabled ? '#3a3834' : $active ? '#ffdc34' : '#5a5854'};
  border: none;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: background 150ms ease;
  flex-shrink: 0;
  padding: 0;
  outline: none;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
`

const MaskToggleSlider = styled.span<{ $active: boolean }>`
  position: absolute;
  top: 2px;
  left: ${({ $active }) => ($active ? '22px' : '2px')};
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0e0c0a;
  transition: left 150ms ease;
`

const PolygonSection = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 220, 52, 0.1);
`


const ToolsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const ToolButton = styled.button<{ $active: boolean }>`
  width: 100%;
  background: ${({ $active }) => ($active ? 'rgba(255, 220, 52, 0.15)' : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? '#ffdc34' : 'rgba(255, 220, 52, 0.35)')};
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;

  &:hover {
    border-color: #ffdc34;
  }
`

const UndoButton = styled.button`
  width: 100%;
  background: rgba(255, 220, 52, 0.12);
  border: 2px solid #ffdc34;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover:not(:disabled) {
    background: rgba(255, 220, 52, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 220, 52, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    border-color: rgba(255, 220, 52, 0.3);
  }
`

const UndoButtonText = styled.span`
  color: #ffdc34;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const UndoIcon = styled.img`
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4));
`

const TextModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  backdrop-filter: blur(4px);
`

const TextModal = styled.div`
  width: 420px;
  padding: 28px;
  border-radius: 20px;
  background: #0e0c0a;
  border: 1px solid #2a2723;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const TextModalTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  color: #ffffff;
`

const TextModalInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #3a3834;
  background: #1b1b1b;
  color: #ffffff;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  outline: none;

  &:focus {
    border-color: #ffdc34;
  }
`

const TextModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`

const TextModalButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  min-width: 120px;
  padding: 12px 16px;
  border-radius: 12px;
  border: ${({ $variant }) => ($variant === 'primary' ? 'none' : '1px solid #3a3834')};
  background: ${({ $variant }) => ($variant === 'primary' ? '#ffdc34' : 'transparent')};
  color: ${({ $variant }) => ($variant === 'primary' ? '#1b1b1b' : '#ffffff')};
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  cursor: pointer;
  transition: filter 150ms ease;

  &:hover {
    filter: brightness(1.05);
  }
`

const ToolIconWrapper = styled.div`
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ToolIcon = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
`

const SelectedColorIndicator = styled.div<{ $color: string }>`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: 2px solid #0e0c0a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`

const ColorSwatch = styled.button<{ $color: string; $selected: boolean; $size?: number }>`
  width: ${({ $size }) => $size ?? 36}px;
  height: ${({ $size }) => $size ?? 36}px;
  border-radius: 50%;
  border: 2px solid ${({ $selected }) => ($selected ? '#ffdc34' : 'transparent')};
  background: ${({ $color }) => $color};
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease;

  &:hover {
    transform: scale(1.05);
  }
`

const SaveButton = styled.button`
  width: 100%;
  border: none;
  border-radius: 10px;
  background: #ffdc34;
  color: #000;
  font-size: 14px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  padding: 14px 0;
  cursor: pointer;
  transition: transform 150ms ease, opacity 150ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  span {
    word-wrap: break-word;
  }
`

const ColorPickerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  backdrop-filter: blur(4px);
`

const ColorPickerModal = styled.div`
  width: 400px;
  padding: 28px;
  border-radius: 20px;
  background: #0e0c0a;
  border: 1px solid #2a2723;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const ColorPickerTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  color: #ffffff;
`

const ColorPickerGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
`

const ColorPickerActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`

const ColorPickerButton = styled.button`
  min-width: 120px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #3a3834;
  background: transparent;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  cursor: pointer;
  transition: filter 150ms ease;

  &:hover {
    filter: brightness(1.05);
    border-color: #ffdc34;
  }
`


