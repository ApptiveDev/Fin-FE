// AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [fetchedRole, setFetchedRole] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    axios.post('https://test-fin.duckdns.org/auth/refresh', {}, { withCredentials: true })
      .then(res => setAccessToken(res.data.data))
      .catch(() => {})
      .finally(() => setIsInitialized(true));
  }, []);

  useEffect(() => {
    if (!accessToken) return; // 토큰이 없으면 조회할 필요가 없음

    let cancelled = false;

    axios.get('https://test-fin.duckdns.org/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => { if (!cancelled) setFetchedRole(res.data.userRole); })
      .catch(() => { if (!cancelled) setFetchedRole(null); });

    return () => { cancelled = true; };
  }, [accessToken]);

  const userRole = accessToken ? fetchedRole : null;

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, userRole, setUserRole: setFetchedRole, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}