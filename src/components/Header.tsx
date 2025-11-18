import styled from 'styled-components'
import toklyLogo from '../assets/tokly11.svg'

type HeaderProps = {
  onAddClick: () => void
}

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

export const Header = ({ onAddClick }: HeaderProps) => {
  return (
    <HeaderContainer>
      <Logo src={toklyLogo} alt="Tokly" />
      <AddButton type="button" onClick={onAddClick}>
        добавить
      </AddButton>
    </HeaderContainer>
  )
}

