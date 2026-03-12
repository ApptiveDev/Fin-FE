import { useState } from 'react';

import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';

function App() {
  // 로그인 여부 확인
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div>
      {isLoggedIn ? <MainPage /> : <LoginPage />}
    </div>
  )
}

export default App