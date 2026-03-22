import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Main from './pages/Main';
import Agreement from './pages/Agreement';
import AuthGuard from './routes/AuthGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <AuthGuard>
              <Main />
            </AuthGuard>
          }
        />
        
        <Route path="/terms" element={<Agreement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;