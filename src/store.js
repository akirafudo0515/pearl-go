import { useSyncExternalStore } from 'react'
import { defaultPrices, getWasher, quote, washers } from './catalog'

const KEY = 'pearl-go-demo-v1'

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString()
}

function buildOrder(partial, prices) {
  const money = quote(partial, prices)
  return {
    customerId: 'me',
    phone: '0912-345-678',
    note: '',
    washerId: null,
    scheduleAt: null,
    demo: false,
    ...partial,
    ...money,
  }
}

function initialState() {
  const prices = defaultPrices()
  const searchingAt = hoursAgo(0.15)
  const doneAt = hoursAgo(5)
  return {
    prices,
    washerOnline: true,
    activeWasherId: 'w1',
    orders: [
      buildOrder(
        {
          id: 'PW-DEMO1',
          demo: true,
          customerName: '測試車主',
          area: '信義區',
          address: '市府路 45 號地下停車場 B2',
          mode: 'now',
          vehicleId: 'suv',
          packageId: 'mirror',
          note: '黑色休旅，車尾有鴨尾，收光時注意邊角。',
          status: 'searching',
          createdAt: searchingAt,
          events: [{ at: searchingAt, label: '已送出，正在尋找師傅' }],
        },
        prices,
      ),
      buildOrder(
        {
          id: 'PW-DEMO2',
          demo: true,
          customerName: '測試車主',
          area: '大安區',
          address: '復興南路一段 100 號',
          mode: 'later',
          scheduleAt: hoursAgo(6),
          vehicleId: 'sedan',
          packageId: 'daily',
          status: 'done',
          washerId: 'w1',
          createdAt: hoursAgo(7),
          events: [
            { at: hoursAgo(7), label: '已送出，正在尋找師傅' },
            { at: hoursAgo(6.5), label: '林可恩 已接單' },
            { at: hoursAgo(6.2), label: '師傅前往中' },
            { at: hoursAgo(5.6), label: '開始施工' },
            { at: doneAt, label: '洗車完成' },
          ],
        },
        prices,
      ),
    ],
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw)
    if (!parsed?.orders || !parsed?.prices) return initialState()
    return parsed
  } catch {
    return initialState()
  }
}

let state = load()
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function commit(next) {
  state = next
  localStorage.setItem(KEY, JSON.stringify(state))
  emit()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getState() {
  return state
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === KEY) {
      state = load()
      emit()
    }
  })
}

function patchOrder(orderId, updater) {
  commit({
    ...state,
    orders: state.orders.map((order) => (order.id === orderId ? updater(order) : order)),
  })
}

export function useStore() {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function placeOrder(draft) {
  const at = new Date().toISOString()
  const order = buildOrder(
    {
      ...draft,
      id: `PW-${Date.now().toString(36).toUpperCase()}`,
      customerId: 'me',
      demo: false,
      status: 'searching',
      washerId: null,
      createdAt: at,
      events: [{ at, label: '已送出，正在尋找師傅' }],
    },
    state.prices,
  )
  commit({ ...state, orders: [order, ...state.orders] })
  return order.id
}

export function cancelOrder(orderId) {
  const order = state.orders.find((item) => item.id === orderId)
  if (!order || ['done', 'cancelled', 'washing'].includes(order.status)) return
  const at = new Date().toISOString()
  patchOrder(orderId, (current) => ({
    ...current,
    status: 'cancelled',
    events: [...current.events, { at, label: '訂單已取消' }],
  }))
}

export function acceptOrder(orderId) {
  const washer = getWasher(state.activeWasherId)
  if (!state.washerOnline) return '請先切換為上線'
  const busy = state.orders.some(
    (order) => order.washerId === washer.id && ['accepted', 'arriving', 'washing'].includes(order.status),
  )
  if (busy) return '還有進行中的訂單，完成後才能再接'
  const order = state.orders.find((item) => item.id === orderId)
  if (!order || order.status !== 'searching') return '這張單已經不能接了'
  const at = new Date().toISOString()
  patchOrder(orderId, (current) => ({
    ...current,
    status: 'accepted',
    washerId: washer.id,
    events: [...current.events, { at, label: `${washer.name} 已接單` }],
  }))
  return ''
}

const nextStatus = {
  accepted: ['arriving', '師傅前往中'],
  arriving: ['washing', '開始施工'],
  washing: ['done', '洗車完成'],
}

export function advanceOrder(orderId) {
  const order = state.orders.find((item) => item.id === orderId)
  const step = order && nextStatus[order.status]
  if (!step) return
  const at = new Date().toISOString()
  patchOrder(orderId, (current) => ({
    ...current,
    status: step[0],
    events: [...current.events, { at, label: step[1] }],
  }))
}

export function setWasherOnline(online) {
  commit({ ...state, washerOnline: online })
}

export function updatePrices(prices) {
  commit({ ...state, prices })
}

export function simulateOrder() {
  const pool = [
    ['compact', 'daily', '松山區', '南京東路四段 50 號'],
    ['sedan', 'inout', '中山區', '林森北路 200 號'],
    ['large', 'flagship', '內湖區', '瑞光路 88 號'],
    ['suv', 'mirror', '板橋區', '文化路一段 18 號'],
  ]
  const pick = pool[Math.floor(Math.random() * pool.length)]
  const at = new Date().toISOString()
  const later = Math.random() > 0.55
  const scheduleAt = later ? new Date(Date.now() + 3 * 3600 * 1000).toISOString() : null
  const order = buildOrder(
    {
      id: `PW-${Date.now().toString(36).toUpperCase()}`,
      customerId: 'sim',
      customerName: '模擬客戶',
      phone: '0900-111-222',
      area: pick[2],
      address: pick[3],
      mode: later ? 'later' : 'now',
      scheduleAt,
      vehicleId: pick[0],
      packageId: pick[1],
      note: '',
      demo: false,
      status: 'searching',
      createdAt: at,
      events: [{ at, label: '已送出，正在尋找師傅' }],
    },
    state.prices,
  )
  commit({ ...state, orders: [order, ...state.orders] })
}

export function resetDemo() {
  localStorage.removeItem(KEY)
  commit(initialState())
}

export function playableWasher() {
  return washers.find((washer) => washer.id === state.activeWasherId)
}
