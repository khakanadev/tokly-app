import styled from 'styled-components'
import { GlobalStyle } from './styles/GlobalStyles'
import { Header } from './components/Header'

const Page = styled.div`
  min-height: 100vh;
  background-color: #1B1B1B;
  padding: 32px 48px;
`

function App() {
  return (
    <>
      <GlobalStyle />
      <Page>
        <Header />
      </Page>
    </>
  )
}

export default App
