import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import JSZip from 'jszip'

// Типы для FileSystem API
interface FileSystemDirectoryEntry {
  isDirectory: boolean
  isFile: boolean
  name: string
  createReader: () => FileSystemDirectoryReader
}

interface FileSystemFileEntry {
  isDirectory: boolean
  isFile: boolean
  name: string
  file: (callback: (file: File) => void) => void
}

interface FileSystemDirectoryReader {
  readEntries: (callback: (entries: (FileSystemDirectoryEntry | FileSystemFileEntry)[]) => void) => void
}

type UploadDropzoneProps = {
  onFilesDrop?: (files: File[]) => void
}

const Dropzone = styled.div<{ $isActive: boolean }>`
  width: 100%;
  min-height: 794px;
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
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }
`

const UploadIcon = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 9999px;
  background: rgba(255, 220, 52, 0.20);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffdc34;
  transition: transform 300ms ease, background 300ms ease;
  
  svg {
    transition: transform 300ms ease;
  }
  
  ${Dropzone}:hover & {
    transform: scale(1.1);
    background: rgba(255, 220, 52, 0.30);
    
    svg {
      animation: bounce 1s ease-in-out infinite;
    }
  }
`

const UploadText = styled.div`
  width: 100%;
  height: 100%;
  color: white;
  font-size: 40px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  word-wrap: break-word;
  text-align: center;
`

const UploadFormats = styled.div`
  width: 100%;
  height: 100%;
  color: #cac8c6;
  font-size: 32px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  word-wrap: break-word;
  text-align: center;
`

const HiddenInput = styled.input`
  display: none;
`

export const UploadDropzone = ({ onFilesDrop }: UploadDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  // Устанавливаем атрибут webkitdirectory для поддержки выбора папок
  // Но не устанавливаем его постоянно, чтобы не блокировать выбор ZIP файлов
  useEffect(() => {
    if (inputRef.current) {
      // Убираем webkitdirectory, чтобы можно было выбирать и ZIP файлы
      // Папки все равно можно перетаскивать через drag and drop
      inputRef.current.removeAttribute('webkitdirectory')
      inputRef.current.removeAttribute('directory')
    }
  }, [])

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

  const isValidImageFile = (file: File): boolean => {
    // Пропускаем служебные файлы macOS (начинаются с ._)
    if (file.name.startsWith('._')) {
      console.log(`[UploadDropzone] Skipping macOS metadata file: ${file.name}`)
      return false
    }
    
    // Пропускаем файлы с очень маленьким размером (вероятно служебные)
    if (file.size < 1000) {
      console.log(`[UploadDropzone] Skipping suspiciously small file: ${file.name} (${file.size} bytes)`)
      return false
    }
    
    // Проверяем, что это файл изображения
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff']
    const validExtensions = ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.bmp', '.tiff']
    
    // Проверяем тип MIME
    if (file.type && validTypes.includes(file.type.toLowerCase())) {
      return true
    }
    
    // Проверяем расширение файла
    const fileName = file.name.toLowerCase()
    if (validExtensions.some(ext => fileName.endsWith(ext))) {
      return true
    }
    
    return false
  }

  const isZipFile = (file: File): boolean => {
    const validTypes = ['application/zip', 'application/x-zip-compressed']
    const validExtensions = ['.zip']
    
    if (file.type && validTypes.includes(file.type.toLowerCase())) {
      return true
    }
    
    const fileName = file.name.toLowerCase()
    if (validExtensions.some(ext => fileName.endsWith(ext))) {
      return true
    }
    
    return false
  }

  const extractImagesFromZip = async (zipFile: File): Promise<File[]> => {
    console.log(`[UploadDropzone] Extracting images from ZIP: ${zipFile.name}`)
    const images: File[] = []
    
    try {
      const zip = await JSZip.loadAsync(zipFile)
      const validExtensions = ['.png', '.jpeg', '.jpg', '.gif', '.webp', '.bmp', '.tiff']
      
      // Обрабатываем все файлы в архиве
      const filePromises = Object.keys(zip.files).map(async (fileName) => {
        const zipEntry = zip.files[fileName]
        
        // Пропускаем папки
        if (zipEntry.dir) {
          return null
        }
        
        // Пропускаем служебные файлы macOS (начинаются с ._)
        if (fileName.startsWith('._') || fileName.includes('/._')) {
          console.log(`[UploadDropzone] Skipping macOS metadata file in ZIP: ${fileName}`)
          return null
        }
        
        // Проверяем, является ли файл изображением
        const lowerFileName = fileName.toLowerCase()
        const isImage = validExtensions.some(ext => lowerFileName.endsWith(ext))
        
        if (!isImage) {
          console.log(`[UploadDropzone] Skipping non-image file in ZIP: ${fileName}`)
          return null
        }
        
        try {
          // Извлекаем файл как blob
          const blob = await zipEntry.async('blob')
          
          // Получаем только имя файла без пути
          const fileNameOnly = fileName.split('/').pop() || fileName
          
          // Определяем MIME тип на основе расширения
          const lowerFileName = fileNameOnly.toLowerCase()
          let mimeType = 'image/jpeg'
          if (lowerFileName.endsWith('.png')) mimeType = 'image/png'
          else if (lowerFileName.endsWith('.gif')) mimeType = 'image/gif'
          else if (lowerFileName.endsWith('.webp')) mimeType = 'image/webp'
          else if (lowerFileName.endsWith('.bmp')) mimeType = 'image/bmp'
          else if (lowerFileName.endsWith('.tiff')) mimeType = 'image/tiff'
          
          // Создаем File объект из blob
          const extractedFile = new File([blob], fileNameOnly, {
            type: mimeType,
            lastModified: zipEntry.date?.getTime() || Date.now(),
          })
          
          console.log(`[UploadDropzone] Extracted image from ZIP: ${extractedFile.name} (${extractedFile.size} bytes)`)
          return extractedFile
        } catch (error) {
          console.error(`[UploadDropzone] Failed to extract file ${fileName} from ZIP:`, error)
          return null
        }
      })
      
      const extractedFiles = await Promise.all(filePromises)
      const validFiles = extractedFiles.filter((file): file is File => file !== null)
      images.push(...validFiles)
      
      console.log(`[UploadDropzone] Extracted ${images.length} images from ZIP`)
    } catch (error) {
      console.error(`[UploadDropzone] Failed to extract ZIP file:`, error)
      throw new Error(`Не удалось распаковать ZIP архив: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    return images
  }

  const extractFilesFromDirectory = async (directoryEntry: FileSystemDirectoryEntry): Promise<File[]> => {
    const files: File[] = []
    
    return new Promise((resolve) => {
      const reader = directoryEntry.createReader()
      const readEntries = () => {
        reader.readEntries((entries) => {
          if (entries.length === 0) {
            resolve(files)
            return
          }
          
          entries.forEach((entry) => {
            if (entry.isFile) {
              (entry as FileSystemFileEntry).file((file) => {
                if (isValidImageFile(file)) {
                  files.push(file)
                } else {
                  console.log(`[UploadDropzone] Skipping non-image file: ${file.name} (type: ${file.type})`)
                }
              })
            } else if (entry.isDirectory) {
              // Рекурсивно обрабатываем подпапки
              extractFilesFromDirectory(entry as FileSystemDirectoryEntry).then((subFiles) => {
                files.push(...subFiles)
              })
            }
          })
          
          // Читаем следующую порцию записей
          readEntries()
        })
      }
      
      readEntries()
    })
  }

  const extractFilesFromItems = async (items: DataTransferItemList): Promise<File[]> => {
    const files: File[] = []
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        
        if (entry) {
          if (entry.isDirectory && 'createReader' in entry) {
            // Если это папка, рекурсивно получаем все файлы из неё
            console.log(`[UploadDropzone] Processing directory: ${entry.name}`)
            const dirFiles = await extractFilesFromDirectory(entry as unknown as FileSystemDirectoryEntry)
            files.push(...dirFiles)
          } else {
            // Если это файл
            const file = item.getAsFile()
            if (file) {
              if (isZipFile(file)) {
                // Если это ZIP файл, распаковываем его
                try {
                  const zipImages = await extractImagesFromZip(file)
                  files.push(...zipImages)
                } catch (error) {
                  console.error(`[UploadDropzone] Failed to extract ZIP:`, error)
                }
              } else if (isValidImageFile(file)) {
                files.push(file)
              } else {
                console.log(`[UploadDropzone] Skipping non-image file: ${file.name} (type: ${file.type})`)
              }
            }
          }
        } else {
          // Fallback: если webkitGetAsEntry не поддерживается
          const file = item.getAsFile()
          if (file) {
            if (isZipFile(file)) {
              try {
                const zipImages = await extractImagesFromZip(file)
                files.push(...zipImages)
              } catch (error) {
                console.error(`[UploadDropzone] Failed to extract ZIP:`, error)
              }
            } else if (isValidImageFile(file)) {
              files.push(file)
            }
          }
        }
      }
    }
    
    return files
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    resetDragState()
    
    let files: File[] = []
    
    // Пытаемся получить файлы из items (поддерживает папки)
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      files = await extractFilesFromItems(event.dataTransfer.items)
    }
    
    // Если не получилось через items, используем files
    if (files.length === 0 && event.dataTransfer.files) {
      const droppedFiles = Array.from(event.dataTransfer.files)
      const processedFiles: File[] = []
      
      for (const file of droppedFiles) {
        if (isZipFile(file)) {
          try {
            const zipImages = await extractImagesFromZip(file)
            processedFiles.push(...zipImages)
          } catch (error) {
            console.error(`[UploadDropzone] Failed to extract ZIP:`, error)
          }
        } else if (isValidImageFile(file)) {
          processedFiles.push(file)
        }
      }
      
      files = processedFiles
    }
    
    if (files.length > 0) {
      console.log(`[UploadDropzone] Extracted ${files.length} image files`)
      onFilesDrop?.(files)
    } else {
      console.warn('[UploadDropzone] No valid image files found')
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    const processedFiles: File[] = []
    
    for (const file of selectedFiles) {
      if (isZipFile(file)) {
        try {
          const zipImages = await extractImagesFromZip(file)
          processedFiles.push(...zipImages)
        } catch (error) {
          console.error(`[UploadDropzone] Failed to extract ZIP:`, error)
        }
      } else if (isValidImageFile(file)) {
        processedFiles.push(file)
      }
    }
    
    if (processedFiles.length > 0) {
      console.log(`[UploadDropzone] Selected ${processedFiles.length} image files`)
      onFilesDrop?.(processedFiles)
      event.target.value = ''
    } else {
      console.warn('[UploadDropzone] No valid image files selected')
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
        <UploadIcon>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <UploadText>Загрузить фото</UploadText>
        <UploadFormats>(png, jpeg, jpg, gif, webp, bmp, tiff, zip)</UploadFormats>
      </Dropzone>
      <HiddenInput 
        ref={inputRef} 
        type="file" 
        onChange={handleFileChange} 
        multiple 
        accept="image/*,.zip,application/zip,application/x-zip-compressed"
      />
    </>
  )
}

