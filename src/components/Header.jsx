import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import {useAuth} from '../context/AuthContext'
import logo from '../assets/logo.png'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-[100px] w-full items-center bg-white px-[79px]">
      <Logo />
      <NavMenu />
      <div className="ml-auto">
        <UserButtons />
      </div>
    </header>
  )
}

function Logo() {
  const navigate = useNavigate()

  return (
    <img src={logo} alt="Fin 로고" className="h-auto w-[115px] cursor-pointer" onClick={() => navigate('/')} />
  )
}

const navItems = [
  { label: '서비스 소개', path: '/introduce' },
  { label: '금융상품 추천', path: '/recommend' },
  { label: '정보 커뮤니티', path: '/community' },
  { label: '마이페이지', path: '/mypage' },
]

function NavMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <ul className="ml-[238px] flex items-center gap-[123px]">
      {navItems.map((item, i) => (
        <li
          key={i}
          onClick={() => navigate(item.path)}
          className={`w-[197px] cursor-pointer whitespace-nowrap text-center font-[Inter] text-[22px] font-medium leading-[1.2] transition-colors
            ${location.pathname === item.path || (item.path === '/recommend' && location.pathname.startsWith('/products'))
              ? 'text-[#03BFA5]'
              : 'text-[#454545] hover:text-[#03BFA5]'
            }`}
        >
          {item.label}
        </li>
      ))}
    </ul>
  )
}

function UserButtons() {
  const { accessToken, setAccessToken } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
  try {
    await axios.post('https://test-fin.duckdns.org/auth/logout', {}, { withCredentials: true })
  } catch (e) {
    console.error(e)
  } finally {
    setAccessToken(null)
    navigate('/login')
  }
}

  if (accessToken) {
    return (
      <div className="flex h-[49px] items-center gap-[19px] font-inter text-[20px]">
        <button
          onClick={() => navigate('/mypage')}
          className="h-[49px] w-[112px] whitespace-nowrap rounded-[8px] border border-[#D5D5D5] text-[#454545] transition-colors hover:border-[#03BFA5] hover:text-[#03BFA5]"
        >
          프로필
        </button>
        <button
          onClick={handleLogout}
          className="h-[49px] w-[112px] whitespace-nowrap rounded-[8px] bg-[#03BFA5] text-white transition-colors hover:bg-[#02a892]"
        >
          로그아웃
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-[49px] items-center gap-[19px] font-inter text-[20px]">
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
      className="h-[49px] w-[112px] whitespace-nowrap rounded-[8px] border border-[#D5D5D5] text-[#454545] transition-colors hover:border-[#03BFA5] hover:text-[#03BFA5]"
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
      className="h-[49px] w-[112px] whitespace-nowrap rounded-[8px] bg-[#03BFA5] text-white transition-colors hover:bg-[#02a892]"
    >
      회원가입
    </button>
  )
}
