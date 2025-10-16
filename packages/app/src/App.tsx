import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { TownPage } from './pages/TownPage';
import { CharacterPage } from './pages/CharacterPage';
import { DungeonPage } from './pages/DungeonPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/town"
            element={
              <ProtectedRoute>
                <TownPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/character"
            element={
              <ProtectedRoute>
                <CharacterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dungeon"
            element={
              <ProtectedRoute>
                <DungeonPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/town" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
