import logo from '../assets/logo.png'
import profileIcon from '../assets/profileIcon.png'

export default function Header() {
  return (
    <header className="w-full flex items-center justify-between px-[3.5%] py-5 bg-white">
      <Logo />
      <NavMenu />
      <UserIcon />
    </header>
  )
}

function Logo() {
  return (
    <img src={logo} alt="Fin 로고" className="h-10" />
  )
}

const navItems = ['청년금융와이핀', '청년금융와이핀', '청년금융와이핀', '청년금융와이핀', '청년금융와이핀', '청년금융와이핀']

function NavMenu() {
  return (
    <ul className="flex gap-20">
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
    <img src={profileIcon} alt="프로필 아이콘" className="h-6" />
  )
}