import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import toklyLogo from '../assets/tokly11.svg'

type HeaderProps = {
  title?: string
  subtitle?: string
  titleColor?: string
  titleFontSize?: string
  titleFontWeight?: number | string
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

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: white;
  font-family: 'Nunito', sans-serif;
`

const Title = styled.span<{
  $color?: string
  $fontSize?: string
  $fontWeight?: number | string
}>`
  font-size: ${({ $fontSize }) => $fontSize ?? '40px'};
  font-weight: ${({ $fontWeight }) => $fontWeight ?? 400};
  line-height: 1.2;
  color: ${({ $color }) => $color ?? 'white'};
  word-wrap: break-word;
`

const Subtitle = styled.span`
  font-size: 18px;
  font-weight: 300;
  line-height: 1.2;
  color: #9d9b97;
`

const BurgerButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 8px;
  border-radius: 8px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  transition: transform 150ms ease, opacity 150ms ease;
  margin-right: 16px;
  position: relative;

  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }

  &:focus-visible {
    outline: 2px solid #FFDC34;
    outline-offset: 2px;
  }
`

const BurgerLine = styled.div<{ $isOpen: boolean; $position: 'first' | 'middle' | 'last' }>`
  width: 28px;
  height: 2px;
  background-color: #FFDC34;
  border-radius: 1px;
  transition: transform 300ms ease, opacity 300ms ease;
  position: absolute;
  left: 50%;
  transform-origin: center;
  margin-left: -14px;

  ${({ $isOpen, $position }) => {
    if (!$isOpen) {
      switch ($position) {
        case 'first':
          return 'top: 12px; transform: translateX(-50%) rotate(0); opacity: 1;'
        case 'middle':
          return 'top: 19px; transform: translateX(-50%) rotate(0); opacity: 1;'
        case 'last':
          return 'top: 26px; transform: translateX(-50%) rotate(0); opacity: 1;'
        default:
          return ''
      }
    }

    switch ($position) {
      case 'first':
        return 'top: 19px; transform: translateX(-50%) rotate(45deg); opacity: 1;'
      case 'middle':
        return 'top: 19px; transform: translateX(-50%) rotate(0); opacity: 0;'
      case 'last':
        return 'top: 19px; transform: translateX(-50%) rotate(-45deg); opacity: 1;'
      default:
        return ''
    }
  }}
`

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  background: #1B1B1B;
  border: 1px solid rgba(255, 220, 52, 0.2);
  border-radius: 8px;
  padding: 4px 0;
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  flex-direction: column;
  min-width: 220px;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
`

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border: none;
  background-color: transparent;
  color: #CAC8C6;
  font-size: 15px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  cursor: pointer;
  text-align: left;
  transition: color 200ms ease, background-color 200ms ease;
  position: relative;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20px;
    right: 20px;
    height: 1px;
    background: rgba(255, 220, 52, 0.1);
  }

  &:hover {
    color: #FFDC34;
    background-color: rgba(255, 220, 52, 0.05);
  }

  &:active {
    background-color: rgba(255, 220, 52, 0.1);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    color: #9d9b97;
    
    &:hover {
      background-color: transparent;
      color: #9d9b97;
    }
  }
`

export const Header = ({ title, subtitle, titleColor, titleFontSize, titleFontWeight }: HeaderProps) => {
  const navigate = useNavigate()
  const params = useParams()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const lapId = params.lapId

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleNavigate = (path: string) => {
    setIsMenuOpen(false)
    if (path === '/') {
      navigate(path, { state: { fromHeader: true } })
    } else {
      navigate(path)
    }
  }

  const menuItems = [
    { label: 'Загрузка', path: '/', disabled: false },
    { label: 'Список ЛЭП', path: '/home', disabled: false },
    { label: 'История', path: lapId ? `/line/${lapId}` : '/home', disabled: !lapId },
    { label: 'Неисправности', path: lapId ? `/line/${lapId}/issues` : '/home', disabled: !lapId },
  ]

  return (
    <HeaderWrapper>
      <HeaderContainer>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <BurgerButton
            ref={buttonRef}
            type="button"
            onClick={handleMenuClick}
            aria-label="Меню"
          >
            <BurgerLine $isOpen={isMenuOpen} $position="first" />
            <BurgerLine $isOpen={isMenuOpen} $position="middle" />
            <BurgerLine $isOpen={isMenuOpen} $position="last" />
          </BurgerButton>
          {isMenuOpen && (
            <DropdownMenu ref={menuRef} $isOpen={isMenuOpen}>
              {menuItems.map((item, index) => (
                <MenuButton
                  key={`${item.path}-${item.label}-${index}`}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  disabled={item.disabled}
                >
                  {item.label}
                </MenuButton>
              ))}
            </DropdownMenu>
          )}
        </div>
        {title ? (
          <TitleWrapper>
          <Title $color={titleColor} $fontSize={titleFontSize} $fontWeight={titleFontWeight}>
            {title}
          </Title>
            {subtitle && <Subtitle>{subtitle}</Subtitle>}
          </TitleWrapper>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Logo src={toklyLogo} alt="Tokly" />
        </div>
      </HeaderContainer>
    </HeaderWrapper>
  )
}

