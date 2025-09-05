import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { SearchPage } from './pages/SearchPage'
import { DetailPage } from './pages/DetailPage'
import { ProfessorProfile } from './pages/ProfessorProfile'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/offering/:selectedId" element={<DetailPage />} />
        <Route path="/instructor/:selectedId" element={<ProfessorProfile />} />
      </Routes>
    </BrowserRouter>
  )
}
