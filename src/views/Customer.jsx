import { useMemo, useState } from 'react'
import {
  areas,
  formatWhen,
  getPackage,
  getProduct,
  getVehicle,
  getWasher,
  packages,
  quote,
  statusLabel,
  vehicles,
} from '../catalog'
import { cancelOrder, placeOrder, useStore } from '../store'
import { Bottles, ModeTag, Money, Status } from '../ui'

function defaultSlot() {
  const date = new Date(Date.now() + 2 * 3600 * 1000)
  date.setMinutes(0, 0, 0)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const emptyForm = {
  mode: 'now',
  scheduleAt: defaultSlot(),
  vehicleId: 'sedan',
  packageId: 'mirror',
  area: '大安區',
  address: '',
  name: '測試車主',
  phone: '0912-345-678',
  note: '',
}

export default function Customer() {
  const { orders, prices } = useStore()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [trackId, setTrackId] = useState(null)

  const mine = orders.filter((order) => order.customerId === 'me')
  const tracked = mine.find((order) => order.id === trackId)
  const estimate = useMemo(() => quote(form, prices), [form, prices])
  const pack = getPackage(form.packageId)
  const vehicle = getVehicle(form.vehicleId)

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()
    if (!form.address.trim()) {
      setError('請填停車位置，師傅才找得到車。')
      return
    }
    if (!form.name.trim() || !form.phone.trim()) {
      setError('請留聯絡人與電話。')
      return
    }
    if (form.mode === 'later' && new Date(form.scheduleAt).getTime() < Date.now() + 10 * 60 * 1000) {
      setError('預約請選至少 10 分鐘之後的時間。')
      return
    }
    const id = placeOrder({
      customerName: form.name.trim(),
      phone: form.phone.trim(),
      area: form.area,
      address: form.address.trim(),
      note: form.note.trim(),
      mode: form.mode,
      scheduleAt: form.mode === 'later' ? new Date(form.scheduleAt).toISOString() : null,
      vehicleId: form.vehicleId,
      packageId: form.packageId,
    })
    setError('')
    setForm((current) => ({ ...current, address: '', note: '' }))
    setTrackId(id)
  }

  if (tracked) {
    return <Tracking order={tracked} onBack={() => setTrackId(null)} />
  }

  return (
    <section className="customer">
      <header className="page-head">
        <div>
          <p className="eyebrow">客戶端</p>
          <h1>把 Pearl 的工法叫到停車位</h1>
          <p className="lede">選車型、選保養方式。費用會跟著變。可以現在叫，也可以約時間。</p>
        </div>
      </header>
      <div className="book-grid">
        <form className="panel composer" onSubmit={submit}>
          <fieldset>
            <legend>什麼時候洗</legend>
            <div className="choice-row">
              <button type="button" className={form.mode === 'now' ? 'choice is-on' : 'choice'} onClick={() => set('mode', 'now')}>
                <b>立即</b>
                <small>師傅接單後出門，加收調度費</small>
              </button>
              <button type="button" className={form.mode === 'later' ? 'choice is-on' : 'choice'} onClick={() => set('mode', 'later')}>
                <b>預約</b>
                <small>指定時段，不加調度費</small>
              </button>
            </div>
            {form.mode === 'later' && (
              <label className="field">
                預約時間
                <input type="datetime-local" value={form.scheduleAt} min={defaultSlot()} onChange={(event) => set('scheduleAt', event.target.value)} required />
              </label>
            )}
          </fieldset>

          <fieldset>
            <legend>車輛大小</legend>
            <div className="cards four">
              {vehicles.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={form.vehicleId === item.id ? 'choice is-on' : 'choice'}
                  onClick={() => set('vehicleId', item.id)}
                >
                  <b>{item.name}</b>
                  <small>{item.examples}</small>
                  <em>{prices.vehicles[item.id] ? `+ ${prices.vehicles[item.id]}` : '不加價'}</em>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>保養方式</legend>
            <div className="cards two">
              {packages.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={form.packageId === item.id ? 'choice pack is-on' : 'choice pack'}
                  onClick={() => set('packageId', item.id)}
                >
                  <span className="pack-top">
                    <b>{item.name}</b>
                    <Money value={prices.packages[item.id]} />
                  </span>
                  <small>{item.lead}</small>
                  <span className="pack-copy">{item.blurb}</span>
                  <Bottles ids={item.products} />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>車在哪裡</legend>
            <div className="split">
              <label className="field">
                區域
                <select value={form.area} onChange={(event) => set('area', event.target.value)}>
                  {areas.map((area) => (
                    <option key={area}>{area}</option>
                  ))}
                </select>
              </label>
              <label className="field grow">
                停車位置
                <input
                  value={form.address}
                  placeholder="例如：復興南路一段 100 號 B2 柱位 C12"
                  onChange={(event) => set('address', event.target.value)}
                />
              </label>
            </div>
            <div className="split">
              <label className="field">
                聯絡人
                <input value={form.name} onChange={(event) => set('name', event.target.value)} />
              </label>
              <label className="field">
                電話
                <input value={form.phone} onChange={(event) => set('phone', event.target.value)} />
              </label>
            </div>
            <label className="field">
              給師傅的備註
              <input value={form.note} placeholder="例如：消光漆、車內有兒童座椅" onChange={(event) => set('note', event.target.value)} />
            </label>
          </fieldset>

          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit">
            {form.mode === 'now' ? '立即叫洗車' : '送出預約'} · {twdInline(estimate.total)}
          </button>
        </form>

        <aside className="side">
          <article className="ticket">
            <p className="eyebrow light">這一單</p>
            <h2>
              {vehicle.name} · {pack.name}
            </h2>
            <ul>
              <li>
                <span>{pack.name}</span>
                <Money value={estimate.service} />
              </li>
              <li>
                <span>{vehicle.name}加價</span>
                <Money value={estimate.vehicleFee} />
              </li>
              <li>
                <span>{form.mode === 'now' ? '即時調度費' : '預約不加收'}</span>
                <Money value={estimate.instantFee} />
              </li>
            </ul>
            <div className="total">
              <span>客戶付</span>
              <strong>
                <Money value={estimate.total} />
              </strong>
            </div>
            <p className="fine">
              約 {estimate.minutes} 分鐘 · 使用 {pack.products.map((id) => getProduct(id).name).join('、')} · 這一單大約省下 300 公升自來水
            </p>
          </article>

          <article className="panel orders">
            <header>
              <h2>我的訂單</h2>
              <span>{mine.length}</span>
            </header>
            {mine.length === 0 && <p className="empty">還沒有訂單。</p>}
            <ul>
              {mine.map((order) => (
                <li key={order.id}>
                  <button type="button" onClick={() => setTrackId(order.id)}>
                    <span>
                      <b>
                        {getVehicle(order.vehicleId).name} · {getPackage(order.packageId).name}
                      </b>
                      <small>
                        {order.area} · {formatWhen(order.createdAt)}
                        {order.demo ? ' · 示範單' : ''}
                      </small>
                    </span>
                    <Status status={order.status} />
                  </button>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </div>
    </section>
  )
}

function Tracking({ order, onBack }) {
  const { orders } = useStore()
  const washer = getWasher(order.washerId)
  const pack = getPackage(order.packageId)
  const vehicle = getVehicle(order.vehicleId)
  const canCancel = ['searching', 'accepted', 'arriving'].includes(order.status)
  const finished = washer
    ? washer.jobs + orders.filter((item) => item.washerId === washer.id && item.status === 'done' && !item.demo).length
    : 0

  return (
    <section className="customer track">
      <button type="button" className="text-btn back" onClick={onBack}>
        ← 回到叫車
      </button>
      <div className="track-grid">
        <article className="panel">
          <div className="track-title">
            <div>
              <p className="eyebrow">{order.id}</p>
              <h1>{statusLabel[order.status]}</h1>
              <p className="lede">
                {vehicle.name} · {pack.name} · {order.area} {order.address}
              </p>
            </div>
            <ModeTag mode={order.mode} scheduleAt={order.scheduleAt} formatWhen={formatWhen} />
          </div>
          <ol className="timeline">
            {order.events.map((event, index) => (
              <li key={`${event.at}-${index}`}>
                <b>{event.label}</b>
                <small>{formatWhen(event.at)}</small>
              </li>
            ))}
          </ol>
          {order.status === 'searching' && (
            <p className="hint">訂單已在師傅端。切到左側「師傅端」，用林可恩的身份接這張單。</p>
          )}
          <h3>這一單的做法</h3>
          <ol className="steps">
            {pack.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {canCancel && (
            <button type="button" className="ghost danger" onClick={() => cancelOrder(order.id)}>
              取消訂單
            </button>
          )}
        </article>
        <aside className="side">
          <article className="ticket">
            <p className="eyebrow light">費用</p>
            <div className="total">
              <span>客戶付</span>
              <strong>
                <Money value={order.total} />
              </strong>
            </div>
            <p className="fine">
              方案 {twdInline(order.service)} · 車型 {twdInline(order.vehicleFee)} · 調度 {twdInline(order.instantFee)}
            </p>
          </article>
          <article className="panel washer-card">
            <h2>{washer ? washer.name : '尚未有師傅接單'}</h2>
            {washer ? (
              <p>
                {washer.area} · {washer.rating} 分 · 已完成 {finished} 單 · Pearl 配方施工 {washer.years} 年
              </p>
            ) : (
              <p>上線中的師傅會看到車型、保養方式、地點和金額。</p>
            )}
            <p className="fine dark">
              聯絡人 {order.customerName} · {order.phone}
              {order.note ? ` · ${order.note}` : ''}
            </p>
          </article>
        </aside>
      </div>
    </section>
  )
}

function twdInline(value) {
  return `NT$ ${Number(value || 0).toLocaleString('zh-TW')}`
}
