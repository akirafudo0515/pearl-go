import { useEffect, useState } from 'react'
import { formatWhen, getPackage, getProduct, getVehicle, getWasher } from '../catalog'
import { acceptOrder, advanceOrder, playableWasher, setWasherOnline, simulateOrder, useStore } from '../store'
import { Bottles, ModeTag, Money, Status } from '../ui'

const actionLabel = {
  accepted: '開始前往',
  arriving: '抵達，開始洗車',
  washing: '完成交車',
}

export default function Washer() {
  const state = useStore()
  const washer = getWasher(state.activeWasherId) || playableWasher()
  const [message, setMessage] = useState('')
  const [hidden, setHidden] = useState([])

  const open = state.orders.filter((order) => order.status === 'searching' && !hidden.includes(order.id))
  const active = state.orders.find(
    (order) => order.washerId === washer.id && ['accepted', 'arriving', 'washing'].includes(order.status),
  )
  const done = state.orders.filter((order) => order.washerId === washer.id && order.status === 'done')
  const earned = done.reduce((sum, order) => sum + order.payout, 0)

  useEffect(() => {
    if (!active) setMessage('')
  }, [active])

  function take(orderId) {
    setMessage(acceptOrder(orderId))
  }

  return (
    <section className="washer">
      <header className="page-head washer-head">
        <div>
          <p className="eyebrow">師傅端 · 你說的騎手端</p>
          <h1>{washer.name}</h1>
          <p className="lede">
            {washer.area} · {washer.rating} 分 · 已完成 {washer.jobs + done.filter((order) => !order.demo).length} 單
          </p>
        </div>
        <div className="online">
          <button
            type="button"
            className={state.washerOnline ? 'switch on' : 'switch'}
            onClick={() => setWasherOnline(!state.washerOnline)}
            aria-pressed={state.washerOnline}
          >
            <i />
            {state.washerOnline ? '上線接單' : '已離線'}
          </button>
          <button type="button" className="ghost" onClick={simulateOrder}>
            模擬一張新單
          </button>
        </div>
      </header>

      {message && <p className="error">{message}</p>}

      <div className="washer-grid">
        <div>
          <h2>可接的單</h2>
          {!state.washerOnline && <p className="hint">你現在離線，看得到單，但不能接。</p>}
          {open.length === 0 && <p className="empty panel">目前沒有新單。客戶端送出後會出現在這裡。</p>}
          <div className="job-list">
            {open.map((order) => {
              const pack = getPackage(order.packageId)
              const vehicle = getVehicle(order.vehicleId)
              return (
                <article key={order.id} className="job">
                  <header>
                    <ModeTag mode={order.mode} scheduleAt={order.scheduleAt} formatWhen={formatWhen} />
                    <Money value={order.payout} className="earn" />
                  </header>
                  <h3>
                    {vehicle.name} · {pack.name}
                  </h3>
                  <p>
                    {order.area} {order.address}
                  </p>
                  <p className="fine dark">
                    客戶付 <Money value={order.total} /> · 你收 <Money value={order.payout} /> · 約 {order.minutes} 分鐘
                  </p>
                  <div className="kit">
                    <Bottles ids={pack.products} />
                    <span>{pack.products.map((id) => getProduct(id).name).join('、')}</span>
                  </div>
                  {order.note && <p className="note">備註：{order.note}</p>}
                  <div className="job-actions">
                    <button type="button" className="primary" disabled={!state.washerOnline} onClick={() => take(order.id)}>
                      接單
                    </button>
                    <button type="button" className="text-btn" onClick={() => setHidden((current) => [...current, order.id])}>
                      略過
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <aside className="side">
          <article className="panel">
            <h2>進行中</h2>
            {!active && <p className="empty">接單後，從這裡更新前往、施工、完成。</p>}
            {active && <ActiveJob order={active} onAdvance={() => { setMessage(''); advanceOrder(active.id) }} />}
          </article>
          <article className="ticket slim">
            <p className="eyebrow light">已入帳（此瀏覽器）</p>
            <strong>
              <Money value={earned} />
            </strong>
            <p className="fine">{done.length} 張完成單 · 抽成後金額</p>
          </article>
        </aside>
      </div>
    </section>
  )
}

function ActiveJob({ order, onAdvance }) {
  const pack = getPackage(order.packageId)
  const vehicle = getVehicle(order.vehicleId)
  return (
    <div className="active-job">
      <Status status={order.status} />
      <h3>
        {order.customerName} · {vehicle.name}
      </h3>
      <p>
        {order.area} {order.address}
      </p>
      <p>
        {order.phone}
        {order.mode === 'later' ? ` · 預約 ${formatWhen(order.scheduleAt)}` : ' · 客戶在等立即服務'}
      </p>
      {order.note && <p className="note">備註：{order.note}</p>}
      <h4>車上要帶</h4>
      <ul>
        {pack.products.map((id) => {
          const product = getProduct(id)
          return (
            <li key={id}>
              <b>{product.name}</b>
              <small>{product.use}</small>
            </li>
          )
        })}
      </ul>
      <ol className="steps">
        {pack.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <button type="button" className="primary" onClick={onAdvance}>
        {actionLabel[order.status]}
      </button>
    </div>
  )
}
