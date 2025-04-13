import { Routes, Route } from 'react-router-dom';
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <>
          <h1>Página Principal (Sistema Calzados)</h1>
        </>
      } />
    </Routes>
  )
}

export default App
