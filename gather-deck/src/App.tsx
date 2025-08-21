import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import HomePage from '@/pages/HomePage'
import DeckBuilderPage from '@/pages/DeckBuilderPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/builder" element={<DeckBuilderPage />} />
          <Route path="/builder/:deckId" element={<DeckBuilderPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App