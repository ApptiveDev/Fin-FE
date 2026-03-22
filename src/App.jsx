import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import AuthGuard from './routes/AuthGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/"
          element={
            <AuthGuard>
              <MainPage />
            </AuthGuard>
          }
        />
        
        {/* 약관 동의 페이지 (추후 생성) */}
        <Route path="/terms" element={<div>약관 동의 페이지</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;