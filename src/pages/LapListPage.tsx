import { useState, useEffect } from 'react'
import { Content } from '../components/Layout'
import { Header } from '../components/Header'
import { MainHeader, type Lap } from '../components/MainHeader'
import styled from 'styled-components'
import { getLapConfig, saveLapConfig, type LapConfig } from '../services/api'

type SettingItem = {
  label: string
  value: number
}

type LapListPageProps = {
  laps: Lap[]
  currentPage: number
  onPageChange: (page: number) => void
  onDelete: (index: number) => void
  onEdit: (index: number) => void
  onSelectLap: (lap: Lap) => void
}

const SettingsModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  backdrop-filter: blur(4px);
`

const SettingsModal = styled.div`
  width: 100%;
  max-width: 800px;
  background: #1b1b1b;
  border-radius: 15px;
  border: 1px solid #ffdc34;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 0;
`

const ModalHeader = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
`

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`

const HeaderRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
`

const HeaderTitle = styled.div`
  color: #cac8c6;
  font-size: 32px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  word-wrap: break-word;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: #d9d9d9;
  outline: 1px solid #ffdc34;
  outline-offset: -0.5px;
  margin: 16px 0;
`

const SettingsItem = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 148px;
  align-items: center;
  gap: 24px;
  padding: 16px 0;
`

const ItemLabel = styled.div`
  color: white;
  font-size: 28px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  word-wrap: break-word;
`

const ItemValueWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
`

const ItemValueInput = styled.input`
  width: 100px;
  background: #d9d9d9;
  border-radius: 10px;
  border: none;
  padding: 8px 24px;
  color: #0e0c0a;
  font-size: 32px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  text-align: center;
  outline: none;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  -moz-appearance: textfield;

  &:focus {
    outline: 2px solid #ffdc34;
    outline-offset: 2px;
  }
`

const SaveButton = styled.button`
  width: 100%;
  margin-top: 24px;
  padding: 16px 0;
  background: #ffdc34;
  border: none;
  border-radius: 10px;
  color: #0e0c0a;
  font-size: 28px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  cursor: pointer;
  transition: background 150ms ease, transform 150ms ease;

  &:hover {
    background: #ffe670;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`

// Маппинг полей настроек на ключи API
const SETTINGS_MAP = {
  'Отсутствующий виброгаситель': 'bad_insulator',
  'Поврежденный виброгаситель': 'damaged_insulator',
  'Критическая сумма': 'sum',
} as const

const initialSettingsData: SettingItem[] = [
  { label: 'Отсутствующий виброгаситель', value: 0 },
  { label: 'Поврежденный виброгаситель', value: 0 },
  { label: 'Критическая сумма', value: 0 },
]

export function LapListPage({
  laps,
  currentPage,
  onPageChange,
  onDelete,
  onEdit,
  onSelectLap,
}: LapListPageProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsData, setSettingsData] = useState<SettingItem[]>(initialSettingsData)
  const [selectedLapId, setSelectedLapId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = (index: number) => {
    const globalIndex = (currentPage - 1) * 10 + index
    const lap = laps[globalIndex]
    if (lap) {
      setSelectedLapId(lap.id)
      setIsSettingsOpen(true)
      onEdit(globalIndex)
    }
  }

  // Загрузка настроек при открытии модального окна
  useEffect(() => {
    const loadSettings = async () => {
      if (!isSettingsOpen || !selectedLapId) return

      setIsLoading(true)
      try {
        const config = await getLapConfig(selectedLapId)
        
        // Маппим данные из API в поля формы
        const mappedData: SettingItem[] = initialSettingsData.map((item) => {
          const apiKey = SETTINGS_MAP[item.label as keyof typeof SETTINGS_MAP]
          if (apiKey && apiKey in config) {
            return { ...item, value: config[apiKey as keyof LapConfig] as number }
          }
          return item
        })
        
        setSettingsData(mappedData)
      } catch (error) {
        console.error('[LapListPage] Failed to load settings:', error)
        // Оставляем начальные значения при ошибке
      } finally {
        setIsLoading(false)
      }
    }

    void loadSettings()
  }, [isSettingsOpen, selectedLapId])

  const handleCloseSettings = () => {
    setIsSettingsOpen(false)
    setSelectedLapId(null)
    setSettingsData(initialSettingsData)
  }

  const handleValueChange = (index: number, value: string) => {
    const numValue = Number.parseInt(value, 10) || 0
    setSettingsData((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], value: numValue }
      return updated
    })
  }

  const handleSave = async () => {
    if (!selectedLapId) return

    setIsSaving(true)
    try {
      // Загружаем текущую конфигурацию, чтобы сохранить все поля
      const currentConfig = await getLapConfig(selectedLapId)
      
      // Обновляем только измененные поля
      const updatedConfig: LapConfig = { ...currentConfig }
      
      settingsData.forEach((item) => {
        const apiKey = SETTINGS_MAP[item.label as keyof typeof SETTINGS_MAP]
        if (apiKey && apiKey in updatedConfig) {
          updatedConfig[apiKey as keyof LapConfig] = item.value as number
        }
      })
      
      await saveLapConfig(selectedLapId, updatedConfig)
      setIsSettingsOpen(false)
      setSelectedLapId(null)
    } catch (error) {
      console.error('[LapListPage] Failed to save settings:', error)
      alert('Не удалось сохранить настройки. Попробуйте еще раз.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Header title="Список ЛЭП" />
      <Content>
        <MainHeader
          laps={laps}
          onDelete={onDelete}
          onEdit={handleEdit}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onSelectLap={onSelectLap}
        />
      </Content>
      {isSettingsOpen && (
        <SettingsModalOverlay onClick={handleCloseSettings}>
          <SettingsModal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <HeaderLeft>
                <HeaderTitle>Название</HeaderTitle>
              </HeaderLeft>
              <HeaderRight>
                <HeaderTitle>Баллы</HeaderTitle>
              </HeaderRight>
            </ModalHeader>
            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#cac8c6' }}>
                Загрузка настроек...
              </div>
            ) : (
              <>
                {settingsData.map((item, index) => (
                  <div key={index}>
                    <Divider />
                    <SettingsItem>
                      <ItemLabel>{item.label}</ItemLabel>
                      <ItemValueWrapper>
                        <ItemValueInput
                          type="number"
                          value={item.value}
                          onChange={(e) => handleValueChange(index, e.target.value)}
                          min="0"
                          disabled={isSaving}
                        />
                      </ItemValueWrapper>
                    </SettingsItem>
                  </div>
                ))}
                <Divider />
                <SaveButton type="button" onClick={handleSave} disabled={isSaving || isLoading}>
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </SaveButton>
              </>
            )}
          </SettingsModal>
        </SettingsModalOverlay>
      )}
    </>
  )
}
