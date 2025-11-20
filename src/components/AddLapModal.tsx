import { type FormEvent, useState } from 'react'
import styled from 'styled-components'
import { UploadDropzone } from './UploadDropzone'
import { createGroup, detectPhoto } from '../services/api'

type AddLapModalProps = {
  isOpen: boolean
  onClose: () => void
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
  border-radius: 24px;
  background: #0e0c0a;
  border: 1px solid #2a2723;
  display: flex;
  flex-direction: column;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const Title = styled.h2`
  margin: 0;
  color: #ffffff;
  font-size: 24px;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
`

const Input = styled.input`
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #3a3834;
  background: #1b1b1b;
  color: #ffffff;
  font-size: 18px;
  font-family: 'Inter', sans-serif;
  outline: none;

  &:focus {
    border-color: #ffdc34;
  }
`

const DropzoneLabel = styled.p`
  margin: 0;
  font-size: 16px;
  color: #cac8c6;
  font-family: 'Inter', sans-serif;
`

const DropzoneWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const FileInfo = styled.div`
  font-size: 14px;
  color: #9d9b97;
  font-family: 'Inter', sans-serif;
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

export const AddLapModal = ({ isOpen, onClose, onSuccess }: AddLapModalProps) => {
  const [value, setValue] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  const resetState = () => {
    setValue('')
    setFile(null)
    setError(null)
    setIsSubmitting(false)
    setProgress(0)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const numericValue = inputValue.replace(/[^0-9]/g, '')
    setValue(numericValue)
  }

  const handleFilesDrop = (files: File[]) => {
    setFile(files[0] ?? null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!value.trim()) {
      setError('Введите ID ЛЭП')
      return
    }
    if (!file) {
      setError('Прикрепите фотографию для обработки')
      return
    }

    setError(null)
    setIsSubmitting(true)
    setProgress(10)

    const lapId = value.trim()

    try {
      const groupId = await createGroup(lapId)
      setProgress(55)

      await detectPhoto(groupId, file)
      setProgress(100)

      if (onSuccess) {
        await onSuccess(lapId)
      }

      setTimeout(() => {
        resetState()
        onClose()
      }, 300)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось создать группу'
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
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="ID линии"
            value={value}
            onChange={handleChange}
            autoFocus
          />
          <DropzoneWrapper>
            <DropzoneLabel>Прикрепите фото для обработки</DropzoneLabel>
            <UploadDropzone onFilesDrop={handleFilesDrop} />
            {file && <FileInfo>Выбран файл: {file.name}</FileInfo>}
          </DropzoneWrapper>
          {error && <ErrorText>{error}</ErrorText>}
          {isSubmitting && (
            <ProgressWrapper>
              <ProgressLabel>Загрузка и обработка…</ProgressLabel>
              <ProgressTrack>
                <ProgressBar $value={progress} />
              </ProgressTrack>
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

