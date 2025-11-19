import { useRef, useState } from 'react'
import styled from 'styled-components'

type UploadDropzoneProps = {
  onFilesDrop?: (files: File[]) => void
}

const Dropzone = styled.div<{ $isActive: boolean }>`
  width: 100%;
  min-height: 397px;
  background: ${({ $isActive }) => ($isActive ? '#1A170F' : '#0E0C0A')};
  border-radius: 15px;
  border: 2px dashed ${({ $isActive }) => ($isActive ? '#FFE766' : '#FFDC34')};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: background 200ms ease, border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
  transform: ${({ $isActive }) => ($isActive ? 'scale(0.995)' : 'scale(1)')};
  box-shadow: ${({ $isActive }) => ($isActive ? '0 0 24px rgba(255, 220, 52, 0.2)' : 'none')};

  &:hover {
    background: #1A170F;
    box-shadow: 0 0 16px rgba(255, 220, 52, 0.15);
  }
`

const UploadIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 220, 52, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffdc34;
`

const UploadText = styled.p`
  margin: 0;
  font-size: 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  color: #cac8c6;
`

const HiddenInput = styled.input`
  display: none;
`

export const UploadDropzone = ({ onFilesDrop }: UploadDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const resetDragState = () => {
    dragCounterRef.current = 0
    setIsDragging(false)
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragCounterRef.current += 1
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      resetDragState()
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files ?? [])
    resetDragState()
    if (files.length > 0) {
      onFilesDrop?.(files)
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) {
      onFilesDrop?.(files)
      event.target.value = ''
    }
  }

  return (
    <>
      <Dropzone
        $isActive={isDragging}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <UploadText>загрузить фото</UploadText>
        <UploadIcon>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 16V4M12 4L7 9M12 4L17 9"
              stroke="#FFDC34"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 16.5V18C4 19.105 4.895 20 6 20H18C19.105 20 20 19.105 20 18V16.5"
              stroke="#FFDC34"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </UploadIcon>
      </Dropzone>
      <HiddenInput ref={inputRef} type="file" onChange={handleFileChange} multiple />
    </>
  )
}

