import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Content } from '../components/Layout'
import { UploadDropzone } from '../components/UploadDropzone'
import { WelcomeLapModal } from '../components/WelcomeLapModal'
import toklyLogo from '../assets/tokly11.svg'

const WelcomeContent = styled(Content)`
  margin-top: 0;
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFilesDrop = (droppedFiles: File[]) => {
    if (droppedFiles.length > 0) {
      setSelectedFile(droppedFiles[0])
      setIsModalOpen(true)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedFile(null)
  }

  const handleSuccess = async (lapId: string) => {
    navigate(`/line/${lapId}/issues`)
  }

  return (
    <>
      <WelcomeContent>
        <WelcomeHeader>
          <WelcomeTitle>Добро пожаловать!</WelcomeTitle>
          <Logo src={toklyLogo} alt="Tokly" />
        </WelcomeHeader>
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
        onSuccess={handleSuccess}
      />
    </>
  )
}

