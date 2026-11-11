import { useState } from 'react'
import {
  defaultPrices,
  formatWhen,
  getPackage,
  getVehicle,
  getWasher,
  packages,
  products,
  quote,
  vehicles,
  washers,
} from '../catalog'
import { cancelOrder, updatePrices, useStore } from '../store'
import { Money, Status } from '../ui'

const filters = [
  { id: 'all', label: '全部' },
  { id: 'searching', label: '待接單' },
  { id: 'active', label: '進行中' },
  { id: 'done', label: '已完成' },
  { id: 'cancelled', label: '已取消' },
]

export default function Admin() {
  const { orders, prices, washerOnline } = useStore()
  const [tab, setTab] = useState('orders')
  const [filter, setFilter] = useState('all')

  const visible = orders.filter((order) => {
    if (filter === 'all') return true
    if (filter === 'active') return ['accepted', 'arriving', 'washing'].includes(order.status)
    return order.status === filter
  })
  const today = new Date().toDateString()
  const doneToday = orders.filter((order) => order.status === 'done' && new Date(order.createdAt).toDateString() === today)
  const revenue = doneToday.reduce((sum, order) => sum + order.total, 0)

  return (
    <section className="admin">
      <header className="page-head">
        <div>
          <p className="eyebrow">後台</p>
          <h1>調度台</h1>
          <p className="lede">看每一張單、改車型與保養價格、確認師傅用的是哪一罐。</p>
        </div>
      </header>

      <div className="stats">
        <article>
          <span>待接單</span>
          <strong>{orders.filter((order) => order.status === 'searching').length}</strong>
        </article>
        <article>
          <span>進行中</span>
          <strong>{orders.filter((order) => ['accepted', 'arriving', 'washing'].includes(order.status)).length}</strong>
        </article>
        <article>
          <span>今天完成</span>
          <strong>{doneToday.length}</strong>
        </article>
        <article>
          <span>今天營收</span>
          <strong>
            <Money value={revenue} />
          </strong>
        </article>
      </div>

      <div className="tabs">
        {[
          ['orders', '訂單'],
          ['prices', '費率'],
          ['crew', '師傅'],
          ['products', '產品'],
        ].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="panel table-wrap">
          <div className="filters">
            {filters.map((item) => (
              <button key={item.id} type="button" className={filter === item.id ? 'is-on' : ''} onClick={() => setFilter(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <table>
            <thead>
              <tr>
                <th>單號</th>
                <th>時間</th>
                <th>客戶</th>
                <th>內容</th>
                <th>類型</th>
                <th>金額</th>
                <th>師傅</th>
                <th>狀態</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{formatWhen(order.createdAt)}</td>
                  <td>
                    {order.customerName}
                    <small>
                      {order.area} {order.address}
                    </small>
                  </td>
                  <td>
                    {getVehicle(order.vehicleId).name} · {getPackage(order.packageId).name}
                  </td>
                  <td>{order.mode === 'now' ? '立即' : `預約 ${formatWhen(order.scheduleAt)}`}</td>
                  <td>
                    <Money value={order.total} />
                  </td>
                  <td>{getWasher(order.washerId)?.name || '—'}</td>
                  <td>
                    <Status status={order.status} />
                  </td>
                  <td>
                    {!['done', 'cancelled', 'washing'].includes(order.status) && (
                      <button type="button" className="text-btn" onClick={() => cancelOrder(order.id)}>
                        取消
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <p className="empty">這個狀態沒有訂單。</p>}
        </div>
      )}

      {tab === 'prices' && <Prices prices={prices} />}
      {tab === 'crew' && <Crew online={washerOnline} />}
      {tab === 'products' && <Products />}
    </section>
  )
}

function Prices({ prices }) {
  const [sampleVehicle, setSampleVehicle] = useState('suv')
  const [samplePack, setSamplePack] = useState('mirror')
  const [sampleMode, setSampleMode] = useState('now')
  const sample = quote({ vehicleId: sampleVehicle, packageId: samplePack, mode: sampleMode }, prices)

  function setPackagePrice(id, value) {
    updatePrices({ ...prices, packages: { ...prices.packages, [id]: money(value) } })
  }
  function setVehicleFee(id, value) {
    updatePrices({ ...prices, vehicles: { ...prices.vehicles, [id]: money(value) } })
  }

  return (
    <div className="price-grid">
      <article className="panel">
        <h2>保養方案</h2>
        <p className="fine dark">這是中小型車的方案價。車型加價另外算。</p>
        {packages.map((item) => (
          <label key={item.id} className="price-row">
            <span>
              <b>{item.name}</b>
              <small>{item.lead}</small>
            </span>
            <input type="number" min="0" step="10" value={prices.packages[item.id]} onChange={(event) => setPackagePrice(item.id, event.target.value)} />
          </label>
        ))}
        <h2>車型加價</h2>
        {vehicles.map((item) => (
          <label key={item.id} className="price-row">
            <span>
              <b>{item.name}</b>
              <small>{item.examples}</small>
            </span>
            <input type="number" min="0" step="10" value={prices.vehicles[item.id]} onChange={(event) => setVehicleFee(item.id, event.target.value)} />
          </label>
        ))}
        <label className="price-row">
          <span>
            <b>即時調度費</b>
            <small>只有選「立即」才加</small>
          </span>
          <input
            type="number"
            min="0"
            step="10"
            value={prices.instantFee}
            onChange={(event) => updatePrices({ ...prices, instantFee: money(event.target.value) })}
          />
        </label>
        <label className="price-row">
          <span>
            <b>師傅抽成後比例</b>
            <small>0.78 代表師傅拿 78%</small>
          </span>
          <input
            type="number"
            min="0.1"
            max="1"
            step="0.01"
            value={prices.payoutRate}
            onChange={(event) => updatePrices({ ...prices, payoutRate: clampRate(event.target.value) })}
          />
        </label>
        <button type="button" className="ghost" onClick={() => updatePrices(defaultPrices())}>
          恢復建議價格
        </button>
      </article>
      <article className="ticket">
        <p className="eyebrow light">試算</p>
        <label className="field">
          車型
          <select value={sampleVehicle} onChange={(event) => setSampleVehicle(event.target.value)}>
            {vehicles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          保養
          <select value={samplePack} onChange={(event) => setSamplePack(event.target.value)}>
            {packages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          時間
          <select value={sampleMode} onChange={(event) => setSampleMode(event.target.value)}>
            <option value="now">立即</option>
            <option value="later">預約</option>
          </select>
        </label>
        <ul>
          <li>
            <span>方案</span>
            <Money value={sample.service} />
          </li>
          <li>
            <span>車型</span>
            <Money value={sample.vehicleFee} />
          </li>
          <li>
            <span>調度</span>
            <Money value={sample.instantFee} />
          </li>
        </ul>
        <div className="total">
          <span>客戶付</span>
          <strong>
            <Money value={sample.total} />
          </strong>
        </div>
        <p className="fine">師傅實收 {`NT$ ${sample.payout.toLocaleString('zh-TW')}`}</p>
      </article>
    </div>
  )
}

function Crew({ online }) {
  return (
    <div className="crew">
      {washers.map((washer) => (
        <article key={washer.id} className="panel">
          <h2>{washer.name}</h2>
          <p>
            {washer.area} · {washer.rating} 分 · {washer.jobs} 單 · Pearl 施工 {washer.years} 年
          </p>
          <p>{washer.playable ? (online ? '本測試版可操作 · 目前上線' : '本測試版可操作 · 目前離線') : '名冊資料，這一版不能切換去接單'}</p>
        </article>
      ))}
    </div>
  )
}

function Products() {
  return (
    <div className="crew">
      {products.map((product) => (
        <article key={product.id} className="panel product">
          <i style={{ background: product.color }} />
          <div>
            <h2>{product.name}</h2>
            <p>{product.en}</p>
            <p>{product.use}</p>
          </div>
        </article>
      ))}
      <article className="panel product wide">
        <div>
          <h2>每一張單都從這四罐組出來</h2>
          <p>日常輕保養只用綠精靈。清潔打蠟換紫精靈。內外護理加上水精靈。旗艦全套再加白精靈。纖維布每單都帶。</p>
          <a href="https://pearlwaterless-taiwan.com/" target="_blank" rel="noreferrer">
            pearlwaterless-taiwan.com
          </a>
        </div>
      </article>
    </div>
  )
}

function money(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) return 0
  return Math.round(number)
}

function clampRate(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0.78
  return Math.min(1, Math.max(0.1, number))
}
