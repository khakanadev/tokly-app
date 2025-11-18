import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background-color: #1B1B1B;
    font-family: 'Inter', sans-serif;
  }

  #root {
    min-height: 100vh;
  }
`

