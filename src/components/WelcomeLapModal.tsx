import { type FormEvent, useState } from 'react'
import styled from 'styled-components'
import { createGroup, detectPhoto } from '../services/api'

type WelcomeLapModalProps = {
  isOpen: boolean
  onClose: () => void
  file: File | null
  files?: File[]
  onSuccess?: (lapId: string) => Promise<void> | void
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  z-index: 1000;
`

const Modal = styled.div`
  width: 520px;
  padding: 32px;
  border-radius: 15px;
  background: #0e0c0a;
  display: flex;
  flex-direction: column;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const Title = styled.div`
  width: 100%;
  height: 100%;
  color: white;
  font-size: 32px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  word-wrap: break-word;
`

const InputWrapper = styled.div`
  width: 100%;
  height: 100%;
  background: #1b1b1b;
  border-radius: 15px;
  border: 1px solid #ffdc34;
  padding: 14px 16px;
`

const Input = styled.input`
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  color: #cac8c6;
  font-size: 28px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  word-wrap: break-word;
  outline: none;

  &::placeholder {
    color: #cac8c6;
  }
`

const ErrorText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #de6f6d;
  font-family: 'Inter', sans-serif;
`

const ProgressWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 220, 52, 0.2);
  overflow: hidden;
`

const ProgressBar = styled.div<{ $value: number }>`
  height: 100%;
  border-radius: 999px;
  background: #ffdc34;
  width: ${({ $value }) => `${$value}%`};
  transition: width 200ms ease;
`

const ProgressLabel = styled.span`
  font-size: 13px;
  color: #cac8c6;
  font-family: 'Inter', sans-serif;
`

const ProgressPercent = styled.div`
  width: 100%;
  height: 100%;
  color: #cac8c6;
  font-size: 24px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  word-wrap: break-word;
  text-align: left;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary'; disabled?: boolean }>`
  min-width: 120px;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background-color 200ms ease, color 200ms ease;

  ${({ $variant }) =>
    $variant === 'primary'
      ? `
    background: #ffdc34;
    color: #1b1b1b;
  `
      : `
    background: transparent;
    color: #ffffff;
    border: 1px solid #3a3834;
  `}

  &:hover {
    filter: ${({ disabled }) => (disabled ? 'none' : 'brightness(1.05)')};
  }

  ${({ disabled }) =>
    disabled
      ? `
    opacity: 0.6;
    cursor: not-allowed;
  `
      : ''}
`

export const WelcomeLapModal = ({ isOpen, onClose, file, files, onSuccess }: WelcomeLapModalProps) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  // Используем files, если они есть, иначе используем file как массив из одного элемента
  const filesToProcess = files && files.length > 0 ? files : (file ? [file] : [])

  const resetState = () => {
    setValue('')
    setError(null)
    setIsSubmitting(false)
    setProgress(0)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const numericValue = inputValue.replace(/[^0-9]/g, '')
    setValue(numericValue)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!value.trim()) {
      setError('Введите ID ЛЭП')
      return
    }
    if (filesToProcess.length === 0) {
      setError('Файлы не найдены')
      return
    }

    console.log(`[WelcomeLapModal] Starting upload: ${filesToProcess.length} files`)
    filesToProcess.forEach((f, idx) => {
      console.log(`[WelcomeLapModal] File ${idx + 1}: ${f.name}, size: ${f.size}, type: ${f.type}`)
    })

    setError(null)
    setIsSubmitting(true)
    setProgress(10)

    const lapId = value.trim()

    try {
      // Создаем группу один раз для всех файлов
      const groupId = await createGroup(lapId)
      
      // Обрабатываем файлы последовательно
      const totalFiles = filesToProcess.length
      console.log(`[WelcomeLapModal] Processing ${totalFiles} files for group ${groupId}`)
      
      let successCount = 0
      let errorCount = 0
      
      for (let i = 0; i < totalFiles; i++) {
        const currentFile = filesToProcess[i]
        console.log(`[WelcomeLapModal] Processing file ${i + 1}/${totalFiles}: ${currentFile.name} (${currentFile.size} bytes, type: ${currentFile.type})`)
        
        // Прогресс: 10% за создание группы + 90% за обработку файлов
        const baseProgress = 10
        const fileProgress = (90 / totalFiles) * (i + 1)
        setProgress(baseProgress + fileProgress)

        try {
          // Пропускаем служебные файлы macOS
          if (currentFile.name.startsWith('._') || currentFile.size < 1000) {
            console.log(`[WelcomeLapModal] Skipping system file: ${currentFile.name}`)
            continue
          }
          
          const result = await detectPhoto(groupId, currentFile)
          console.log(`[WelcomeLapModal] Successfully processed file ${currentFile.name}:`, result)
          successCount++
        } catch (err) {
          // Пропускаем ошибки для служебных файлов
          if (currentFile.name.startsWith('._') || currentFile.size < 1000) {
            console.log(`[WelcomeLapModal] Skipping error for system file: ${currentFile.name}`)
            continue
          }
          
          const message = err instanceof Error ? err.message : 'Не удалось обработать фото'
          console.error(`[WelcomeLapModal] Failed to process file ${currentFile.name}:`, err)
          errorCount++
          // Продолжаем обработку остальных файлов, но запоминаем ошибку
          setError((prev) => {
            const errorMsg = `Ошибка при обработке ${currentFile.name}: ${message}`
            return prev ? `${prev}\n${errorMsg}` : errorMsg
          })
        }
      }
      
      console.log(`[WelcomeLapModal] Processing complete: ${successCount} successful, ${errorCount} errors`)

      setProgress(100)
      
      // Даем серверу время обработать все файлы перед редиректом
      console.log(`[WelcomeLapModal] Waiting 2 seconds for server to process files...`)
      await new Promise(resolve => setTimeout(resolve, 2000))

      if (onSuccess) {
        await onSuccess(lapId)
      }

      setTimeout(() => {
        resetState()
        onClose()
      }, 300)
    } catch (err) {
      let message = 'Не удалось создать группу'
      if (err instanceof Error) {
        if (err.message.includes('500')) {
          message = 'Ошибка сервера. Проверьте подключение и попробуйте позже.'
        } else {
          message = err.message
        }
      }
      setError(message)
      setIsSubmitting(false)
      setProgress(0)
    }
  }

  const handleCancel = () => {
    resetState()
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <Overlay>
      <Modal>
        <Form onSubmit={handleSubmit}>
          <Title>Добавить ЛЭП</Title>
          <InputWrapper>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="ID линии"
              value={value}
              onChange={handleChange}
              autoFocus
            />
          </InputWrapper>
          {error && <ErrorText>{error}</ErrorText>}
          {isSubmitting && (
            <ProgressWrapper>
              <ProgressTrack>
                <ProgressBar $value={progress} />
              </ProgressTrack>
              <ProgressPercent>{progress}% загрузки...</ProgressPercent>
            </ProgressWrapper>
          )}
          <Actions>
            <ActionButton type="button" onClick={handleCancel} disabled={isSubmitting}>
              Отмена
            </ActionButton>
            <ActionButton $variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Отправляем…' : 'Добавить'}
            </ActionButton>
          </Actions>
        </Form>
      </Modal>
    </Overlay>
  )
}

