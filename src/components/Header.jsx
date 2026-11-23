import { useRef } from 'react'
import client from '../api/client'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import { clearPersistedRecommendation, readPersistedRecommendation } from '../utils/recommendationResult'
import { searchWithSavedProfile } from '../utils/profileRecommendation'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <div className="mx-auto flex h-14 max-w-480 items-center justify-between px-4 sm:h-16 sm:px-6 lg:h-18 lg:px-[3.5%]">
        <Logo />
        <NavMenu />
        <UserButtons />
      </div>
    </header>
  )
}

function Logo() {
  const navigate = useNavigate()
  return (
    <img src={logo} alt="Fin 로고" className="h-6 shrink-0 cursor-pointer sm:h-7" onClick={() => navigate('/')} />
  )
}

const navItems = [
  { label: '서비스 소개', path: '/introduce', activePaths: ['/', '/introduce'] },
  { label: '금융상품 추천', path: '/recommend', activePaths: ['/recommend', '/products'] },
  { label: 'Fin 캘린더', path: '/community' },
  { label: '마이페이지', path: '/mypage' },
]

function NavMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const { accessToken } = useAuth()
  const searchingRef = useRef(false)

  const handleNavClick = async (item) => {
    if (item.path === '/recommend' && readPersistedRecommendation()?.result) {
      navigate('/products')
      return
    }

    // 다시 로그인했거나 이번 탭에 결과가 없어도, 서버에 저장해 둔 입력 정보가 있으면 입력 없이 바로 결과를 보여준다.
    // 이미 추천 입력 화면에 있을 때는 직접 입력하려는 것이므로 그대로 둔다.
    if (item.path === '/recommend' && accessToken && location.pathname !== '/recommend') {
      if (searchingRef.current) return
      searchingRef.current = true
      try {
        const recommendation = await searchWithSavedProfile(accessToken)
        if (recommendation?.result) {
          navigate('/products', {
            state: {
              recommendationResult: recommendation.result,
              recommendationRequest: recommendation.request,
            },
          })
          return
        }
      } catch (e) {
        console.error('저장된 입력 정보로 추천 결과를 불러오지 못했어요:', e)
      } finally {
        searchingRef.current = false
      }
    }
    navigate(item.path)
  }

  return (
    <ul className="mx-auto hidden max-w-[1200px] flex-1 items-center justify-between px-20 md:flex">
      {navItems.map((item, i) => {
        const paths = item.activePaths ?? [item.path]
        const isActive = paths.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))
        return (
          <li
            key={i}
            onClick={() => handleNavClick(item)}
            className={`cursor-pointer whitespace-nowrap font-pretendard text-[16px] font-medium transition-colors lg:text-[18px] ${
              isActive ? 'text-[#03BFA5]' : 'text-gray-400 hover:text-[#515151]'
            }`}
          >
            {item.label}
          </li>
        )
      })}
    </ul>
  )
}

function UserButtons() {
  const { accessToken, setAccessToken } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await client.post('/auth/logout', {})
    } catch (e) {
      console.error(e)
    } finally {
      clearPersistedRecommendation()
      setAccessToken(null)
      navigate('/login')
    }
  }

  if (accessToken) {
    return (
      <div className="flex shrink-0 items-center gap-3 font-pretendard text-[14.5px]">
        <button
          onClick={() => navigate('/mypage')}
          className="text-[#515151] border border-gray-300 rounded-lg h-9 px-4 hover:border-[#03BFA5] hover:text-[#03BFA5] transition-colors whitespace-nowrap"
        >
          프로필
        </button>
        <button
          onClick={handleLogout}
          className="text-white bg-[#03BFA5] rounded-lg h-9 px-4 hover:bg-[#02a892] transition-colors whitespace-nowrap"
        >
          로그아웃
        </button>
      </div>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-3 font-pretendard text-[14.5px]">
      <LoginButton />
      <JoinButton />
    </div>
  )
}

function LoginButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/login')}
      className="text-[#515151] border border-gray-300 rounded-lg h-9 w-19.5 hover:border-[#03BFA5] hover:text-[#03BFA5] transition-colors whitespace-nowrap"
    >
      로그인
    </button>
  )
}

function JoinButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/terms')}
      className="text-white bg-[#03BFA5] rounded-lg h-9 w-19.5 hover:bg-[#02a892] transition-colors whitespace-nowrap"
    >
      회원가입
    </button>
  )
}
