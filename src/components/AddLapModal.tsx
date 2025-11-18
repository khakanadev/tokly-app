import { type FormEvent, useState } from 'react'
import styled from 'styled-components'

type AddLapModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (lapId: string) => void
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
  width: 420px;
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

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
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
    filter: brightness(1.05);
  }
`

export const AddLapModal = ({ isOpen, onClose, onSubmit }: AddLapModalProps) => {
  const [value, setValue] = useState('')

  if (!isOpen) {
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Разрешаем только цифры
    const numericValue = inputValue.replace(/[^0-9]/g, '')
    setValue(numericValue)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!value.trim()) {
      return
    }
    onSubmit(value.trim())
    setValue('')
  }

  const handleCancel = () => {
    setValue('')
    onClose()
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
          <Actions>
            <ActionButton type="button" onClick={handleCancel}>
              Отмена
            </ActionButton>
            <ActionButton $variant="primary" type="submit">
              Добавить
            </ActionButton>
          </Actions>
        </Form>
      </Modal>
    </Overlay>
  )
}

