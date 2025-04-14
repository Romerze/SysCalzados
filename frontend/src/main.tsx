import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"; // Importar BrowserRouter
import { ConfigProvider, App as AntdApp } from 'antd'; // Importar App as AntdApp
// Opcional: importar localización si es necesario
// import esES from 'antd/locale/es_ES'; 
import App from './App.tsx'
import './index.css'
import 'antd/dist/reset.css'; // Import AntD CSS

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Envolver con ConfigProvider */}
    <ConfigProvider
      // Opcional: configurar tema o localización
      // locale={esES} 
      // theme={{ token: { colorPrimary: '#00b96b' } }} 
    >
      <BrowserRouter> {/* Envolver App con BrowserRouter */} 
        <AntdApp> {/* Envolver App con AntdApp */} 
          <App />
        </AntdApp>
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
)
