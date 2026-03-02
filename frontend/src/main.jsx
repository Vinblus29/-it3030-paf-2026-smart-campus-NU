import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
import App from './App.jsx'

const theme = {
  token: {
    colorPrimary: '#111827',
    colorLink: '#111827',
    colorLinkHover: '#374151',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Button: {
      controlHeight: 48,
      borderRadius: 8,
    },
    Input: {
      controlHeight: 48,
      borderRadius: 8,
    },
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={theme}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)

