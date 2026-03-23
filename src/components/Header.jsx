import logo from '../assets/logo.png'

export default function Header() {
  return (
    <header className="w-full h-20 flex items-center justify-between px-[3.5%] py-6 bg-white">
      <Logo />
      <NavMenu />
      <UserIcon />
    </header>
  )
}

function Logo() {
  return (
    <img src={logo} alt="Fin 로고" className="h-6" />
  )
}

const navItems = ['서비스 소개', '금융상품 추천', '정보 커뮤니티', '마이페이지']

function NavMenu() {
  return (
    <ul className="flex gap-50">
      {navItems.map((item, i) => (
        <li key={i} className="font-[Inter] font-medium text-base text-[#515151] hover:text-gray-400 cursor-pointer whitespace-nowrap transition-colors">
          {item}
        </li>
      ))}
    </ul>
  )
}

function UserIcon() {
  return (
    <div
    className="">
      <LoginButton />
      <JoinButton />
    </div>
  )
}

function LoginButton() {
  return (
    <button
    className="flex items-center justify-center gap-2 bg-[#FFFFFF] hover:bg-gray-200 rounded-xl py-2.5 px-3 transition-colors">
      <span className="font-[Inter] text-[#515151] relative top-[1px]">로그인</span>
    </button>
  )
}

function JoinButton() {
  return (
    <button>

    </button>
  )
}