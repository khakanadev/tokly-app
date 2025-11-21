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
  const [activeFilter, setActiveFilter] = useState<'critical' | 'damage' | 'objects' | 'custom' | null>(null)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [showPolygons, setShowPolygons] = useState(false)

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
      console.log('[PhotoEditorPage] Preloading polygon:', polygonUrl)
    }
  }, [polygonUrl])

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

  // Фильтруем маски на основе выбранного фильтра
  const filteredMaskUrls = useMemo(() => {
    if (!activeFilter) {
      return allMaskUrls
    }

    return allMaskUrls.filter((maskUrl) => {
      const detection = maskToDetectionMap.get(maskUrl)
      if (!detection) return false

      switch (activeFilter) {
        case 'critical':
          return detection.damage_level > 3
        case 'damage':
          return detection.damage_level > 0 && detection.damage_level <= 3
        case 'objects':
          return detection.damage_level === 0
        case 'custom':
          return true
        default:
          return true
      }
    })
  }, [allMaskUrls, activeFilter, maskToDetectionMap])

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

  const handleSave = () => {
    console.log('[PhotoEditorPage] Save clicked', {
      rectangles,
      texts,
      selectedColor,
      imageUrl,
    })
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
                <BasePhoto src={imageUrl} alt="Редактируемое фото" draggable={false} />
                {filteredMaskUrls.map((maskUrl, index) => (
                  <MaskImage key={`${maskUrl}-${index}`} src={maskUrl} alt="Маска" draggable={false} />
                ))}
                {showPolygons && polygonUrl && (
                  <PolygonImage src={polygonUrl} alt="Полигон" draggable={false} />
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
              <SaveButton type="button" onClick={handleSave}>
                <span>Сохранить</span>
              </SaveButton>
            </ToolsPanel>
            <PanelContainer>
              <ProblemsTitle>Проблемы</ProblemsTitle>
              <FilterButtons>
                <FilterButton
                  type="button"
                  $active={activeFilter === 'critical'}
                  onClick={() => setActiveFilter(activeFilter === 'critical' ? null : 'critical')}
                >
                  Критические проблемы
                </FilterButton>
                <FilterButton
                  type="button"
                  $active={activeFilter === 'damage'}
                  onClick={() => setActiveFilter(activeFilter === 'damage' ? null : 'damage')}
                >
                  Повреждение
                </FilterButton>
                <FilterButton
                  type="button"
                  $active={activeFilter === 'objects'}
                  onClick={() => setActiveFilter(activeFilter === 'objects' ? null : 'objects')}
                >
                  Объекты
                </FilterButton>
                <FilterButton
                  type="button"
                  $active={activeFilter === 'custom'}
                  onClick={() => setActiveFilter(activeFilter === 'custom' ? null : 'custom')}
                >
                  Пользовательская маска
                </FilterButton>
              </FilterButtons>
              <PolygonSwitchContainer>
                <PolygonSwitchLabel>Выделить объекты</PolygonSwitchLabel>
                {(() => {
                  const isDisabled = groupId === undefined || groupId === null || !imageUid || imageUid === ''
                  if (isDisabled) {
                    console.log('[PhotoEditorPage] Switch disabled because:', {
                      groupId,
                      imageUid,
                      groupIdType: typeof groupId,
                      imageUidType: typeof imageUid,
                      locationState,
                    })
                  }
                  return (
                    <PolygonSwitch
                      type="button"
                      $active={showPolygons}
                      onClick={() => setShowPolygons(!showPolygons)}
                      disabled={isDisabled}
                      title={isDisabled ? `Требуются groupId и imageUid для загрузки полигонов. groupId: ${groupId}, imageUid: ${imageUid}` : ''}
                    >
                      <PolygonSwitchSlider $active={showPolygons} />
                    </PolygonSwitch>
                  )
                })()}
              </PolygonSwitchContainer>
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
  width: 140px;
  height: auto;
  object-fit: contain;
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
  gap: 12px;
`

const FilterButton = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid ${({ $active }) => ($active ? '#ffdc34' : 'rgba(255, 220, 52, 0.35)')};
  background: ${({ $active }) => ($active ? 'rgba(255, 220, 52, 0.15)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffdc34' : '#cac8c6')};
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  cursor: pointer;
  transition: all 150ms ease;
  text-align: left;

  &:hover {
    border-color: #ffdc34;
    background: rgba(255, 220, 52, 0.1);
  }
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
  transition: transform 150ms ease;

  &:hover {
    transform: translateY(-2px);
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

const PolygonSwitchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 220, 52, 0.1);
`

const PolygonSwitchLabel = styled.span`
  color: #cac8c6;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  flex: 1;
`

const PolygonSwitch = styled.button<{ $active: boolean }>`
  position: relative;
  width: 48px;
  height: 24px;
  border-radius: 12px;
  border: 1px solid ${({ $active }) => ($active ? '#ffdc34' : 'rgba(255, 220, 52, 0.35)')};
  background: ${({ $active }) => ($active ? 'rgba(255, 220, 52, 0.15)' : 'transparent')};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 150ms ease;
  padding: 0;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    border-color: #ffdc34;
    background: rgba(255, 220, 52, 0.1);
  }

  &:disabled {
    opacity: 0.4;
  }
`

const PolygonSwitchSlider = styled.div<{ $active: boolean }>`
  position: absolute;
  top: 2px;
  left: ${({ $active }) => ($active ? '26px' : '2px')};
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#ffdc34' : 'rgba(255, 220, 52, 0.5)')};
  transition: left 150ms ease, background 150ms ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`

