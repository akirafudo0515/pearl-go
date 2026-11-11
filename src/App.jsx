import { useEffect, useState } from 'react'
import Customer from './views/Customer'
import Washer from './views/Washer'
import Admin from './views/Admin'
import { resetDemo } from './store'

const roles = [
  { id: 'customer', label: '客戶端', hint: '叫洗車' },
  { id: 'washer', label: '師傅端', hint: '接單' },
  { id: 'admin', label: '後台', hint: '訂單與費率' },
]

export default function App() {
  const [role, setRole] = useState(() => sessionStorage.getItem('pearl-role') || 'customer')

  useEffect(() => {
    sessionStorage.setItem('pearl-role', role)
  }, [role])

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <img src="/pearl-logo.png" alt="Pearl" />
          <div>
            <strong>珍珠到府</strong>
            <em>測試版</em>
          </div>
        </div>
        <nav>
          {roles.map((item) => (
            <button
              key={item.id}
              type="button"
              className={role === item.id ? 'is-on' : ''}
              onClick={() => setRole(item.id)}
            >
              <b>{item.label}</b>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>
        <div className="rail-foot">
          <p>配方來自 Pearl 台灣官方站的四款產品。這一版只在這台瀏覽器裡運轉，不會真的派出師傅。</p>
          <a href="https://pearlwaterless-taiwan.com/" target="_blank" rel="noreferrer">
            看產品官網
          </a>
          <button type="button" className="text-btn" onClick={() => resetDemo()}>
            還原測試資料
          </button>
        </div>
      </aside>
      <div className="stage">
        <div className="strip">英國原裝配方 · 到府施工 · 車型與保養方式會改價格 · 可立即或預約</div>
        {role === 'customer' && <Customer />}
        {role === 'washer' && <Washer />}
        {role === 'admin' && <Admin />}
      </div>
    </div>
  )
}
