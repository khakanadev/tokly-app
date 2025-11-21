import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Content } from '../components/Layout'
import { UploadDropzone } from '../components/UploadDropzone'
import { WelcomeLapModal } from '../components/WelcomeLapModal'
import toklyLogo from '../assets/tokly11.svg'
import { Header } from '../components/Header'

const WelcomeContent = styled(Content)<{ $withHeader?: boolean }>`
  margin-top: ${({ $withHeader }) => ($withHeader ? '30px' : '0')};
  margin-bottom: 100px;
`

const WelcomeHeader = styled.header`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`

const WelcomeTitle = styled.div`
  width: 100%;
  height: 100%;
  color: white;
  font-size: 40px;
  font-family: 'Nunito', sans-serif;
  font-weight: 400;
  word-wrap: break-word;
`

const Logo = styled.img`
  height: 60px;
  width: auto;
  flex-shrink: 0;
`

const DropzoneSection = styled.section`
  width: 100%;
`

const LargeDropzoneWrapper = styled.div`
  width: 100%;
  min-height: 794px;
  
  > * {
    min-height: 794px;
  }
`

export function WelcomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromHeader = Boolean(location.state?.fromHeader)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFilesDrop = (droppedFiles: File[]) => {
    console.log(`[WelcomePage] Files dropped: ${droppedFiles.length} files`)
    droppedFiles.forEach((f, idx) => {
      console.log(`[WelcomePage] File ${idx + 1}: ${f.name}, size: ${f.size}, type: ${f.type}`)
    })
    
    if (droppedFiles.length > 0) {
      // Если один файл, используем старую логику для обратной совместимости
      if (droppedFiles.length === 1) {
        setSelectedFile(droppedFiles[0])
        setSelectedFiles([])
      } else {
        // Если несколько файлов, используем новую логику
        setSelectedFile(null)
        setSelectedFiles(droppedFiles)
      }
      setIsModalOpen(true)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedFile(null)
    setSelectedFiles([])
  }

  const handleSuccess = async (lapId: string) => {
    navigate(`/line/${lapId}/issues`)
  }

  return (
    <>
      {fromHeader && <Header />}
      <WelcomeContent $withHeader={fromHeader}>
        {!fromHeader && (
          <WelcomeHeader>
            <WelcomeTitle>Добро пожаловать!</WelcomeTitle>
            <Logo src={toklyLogo} alt="Tokly" />
          </WelcomeHeader>
        )}
        <DropzoneSection>
          <LargeDropzoneWrapper>
            <UploadDropzone onFilesDrop={handleFilesDrop} />
          </LargeDropzoneWrapper>
        </DropzoneSection>
      </WelcomeContent>
      <WelcomeLapModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        file={selectedFile}
        files={selectedFiles.length > 0 ? selectedFiles : undefined}
        onSuccess={handleSuccess}
      />
    </>
  )
}

