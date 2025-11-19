import styled from 'styled-components'
import toklyLogo from '../assets/tokly11.svg'

type HeaderProps = {
  onAddClick?: () => void
  title?: string
  subtitle?: string
  onBack?: () => void
}

const HeaderWrapper = styled.div`
  width: 100%;
  height: 80px;
  background: #0E0C0A;
  border-radius: 15px;
  padding: 0 32px;
  display: flex;
  align-items: center;
`

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const Logo = styled.img`
  height: 50px;
  width: auto;
  display: block;
`

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 314px;
  height: 52px;
  border-radius: 15px;
  border: none;
  outline: 2px #FFDC34 solid;
  outline-offset: -2px;
  background-color: transparent;
  color: #CAC8C6;
  font-size: 24px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  line-height: 1;
  word-wrap: break-word;
  cursor: pointer;
  transition: background-color 220ms ease, color 220ms ease;
  will-change: background-color, color;
  backface-visibility: visible;
  -webkit-backface-visibility: visible;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  &:hover {
    background-color: #FFDC34;
    color: #1B1B1B;
  }

  &:focus-visible {
    outline-color: #FFDC34;
  }
`

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #CAC8C6;
  font-family: 'Inter', sans-serif;
`

const Title = styled.span`
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

const Subtitle = styled.span`
  font-size: 18px;
  font-weight: 300;
  line-height: 1.2;
  color: #9d9b97;
`

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid #FFDC34;
  background-color: transparent;
  color: #FFDC34;
  font-size: 18px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  cursor: pointer;
  transition: background-color 220ms ease, color 220ms ease;
  margin-right: 16px;

  &:hover {
    background-color: #FFDC34;
    color: #0E0C0A;
  }

  &:focus-visible {
    outline: 2px solid #FFDC34;
    outline-offset: 2px;
  }
`

export const Header = ({ onAddClick, title, subtitle, onBack }: HeaderProps) => {
  return (
    <HeaderWrapper>
      <HeaderContainer>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {onBack && (
            <BackButton type="button" onClick={onBack}>
              ← Назад
            </BackButton>
          )}
          {!title && <Logo src={toklyLogo} alt="Tokly" />}
        </div>
        {title ? (
          <TitleWrapper>
            <Title>{title}</Title>
            {subtitle && <Subtitle>{subtitle}</Subtitle>}
          </TitleWrapper>
        ) : (
          onAddClick && (
            <AddButton type="button" onClick={onAddClick}>
              добавить
            </AddButton>
          )
        )}
      </HeaderContainer>
    </HeaderWrapper>
  )
}

