export const products = [
  {
    id: 'ultra',
    name: '紫精靈',
    en: 'Advanced Ultra Nano',
    use: '車身清潔、拋光、巴西棕櫚蠟封體',
    color: '#5c4d9a',
  },
  {
    id: 'pro',
    name: '綠精靈',
    en: 'Professional',
    use: '車身快速除塵，不含蠟，包膜與消光漆可用',
    color: '#1c8f62',
  },
  {
    id: 'universal',
    name: '水精靈',
    en: 'Universal',
    use: '內裝皮椅、儀表、頂棚與輪圈粉塵',
    color: '#2f7ea8',
  },
  {
    id: 'tire',
    name: '白精靈',
    en: 'Eco Tire Shine',
    use: '胎壁水性亮光，行駛不甩黑油',
    color: '#e7ebf0',
    ink: '#1c2430',
  },
  {
    id: 'cloth',
    name: 'Pearl Pro 纖維布',
    en: '300 GSM',
    use: '每單兩條：一條除污，一條乾布收光',
    color: '#c6a36a',
  },
]

export const vehicles = [
  {
    id: 'compact',
    name: '小型車',
    examples: 'Fit、Yaris、Mini',
    minutes: 20,
  },
  {
    id: 'sedan',
    name: '中型房車',
    examples: 'Altis、Camry、Model 3',
    minutes: 25,
  },
  {
    id: 'suv',
    name: '休旅車',
    examples: 'CR-V、RAV4、CX-5',
    minutes: 32,
  },
  {
    id: 'large',
    name: '大型休旅／廂型',
    examples: 'Alphard、Touran、皮卡',
    minutes: 42,
  },
]

export const packages = [
  {
    id: 'daily',
    name: '日常輕保養',
    lead: '綠精靈',
    blurb: '不含蠟，適合常常除塵。包膜車和消光漆也能做。',
    products: ['pro', 'cloth'],
    extraMinutes: 0,
    steps: ['綠精靈噴上車身，包住浮塵和油膜', '纖維布單向擦拭，污垢留在布裡', '乾布收光，不留水痕'],
  },
  {
    id: 'mirror',
    name: '清潔打蠟',
    lead: '紫精靈',
    blurb: '洗完直接打蠟。漆面比較亮，水也比較會滾掉。',
    products: ['ultra', 'cloth'],
    extraMinutes: 6,
    steps: ['紫精靈噴上車身', '纖維布帶走泥沙，不在漆面上磨', '乾布把蠟推勻'],
  },
  {
    id: 'inout',
    name: '內外護理',
    lead: '紫精靈 + 水精靈',
    blurb: '車身做清潔打蠟，再清皮椅、儀表和門檻。',
    products: ['ultra', 'universal', 'cloth'],
    extraMinutes: 16,
    steps: ['紫精靈處理車身並收光', '水精靈擦皮椅、儀表、門檻', '確認內裝沒有殘液'],
  },
  {
    id: 'flagship',
    name: '旗艦全套',
    lead: '紫精靈 + 水精靈 + 白精靈',
    blurb: '車身、內裝、胎壁一次做完。胎壁不甩黑油。',
    products: ['ultra', 'universal', 'tire', 'cloth'],
    extraMinutes: 22,
    steps: ['紫精靈處理車身並收光', '水精靈整理內裝', '白精靈塗四輪胎壁，等待乾燥'],
  },
]

export const areas = ['大安區', '信義區', '松山區', '中山區', '內湖區', '中正區', '板橋區', '新店區']

export const washers = [
  { id: 'w1', name: '林可恩', area: '大安・信義', rating: 4.9, jobs: 186, years: 4, playable: true },
  { id: 'w2', name: '陳柏宇', area: '信義・松山', rating: 4.8, jobs: 142, years: 3, playable: false },
  { id: 'w3', name: '高子涵', area: '內湖・南港', rating: 4.7, jobs: 97, years: 2, playable: false },
]

export const statusLabel = {
  searching: '尋找師傅',
  accepted: '已接單',
  arriving: '前往中',
  washing: '洗車中',
  done: '已完成',
  cancelled: '已取消',
}

export const activeStatuses = ['accepted', 'arriving', 'washing']

export function defaultPrices() {
  return {
    packages: { daily: 690, mirror: 990, inout: 1490, flagship: 1790 },
    vehicles: { compact: 0, sedan: 160, suv: 320, large: 520 },
    instantFee: 150,
    payoutRate: 0.78,
  }
}

export function getVehicle(id) {
  return vehicles.find((item) => item.id === id)
}

export function getPackage(id) {
  return packages.find((item) => item.id === id)
}

export function getProduct(id) {
  return products.find((item) => item.id === id)
}

export function getWasher(id) {
  return washers.find((item) => item.id === id)
}

export function quote(input, prices) {
  const vehicle = getVehicle(input.vehicleId)
  const pack = getPackage(input.packageId)
  const service = prices.packages[pack.id]
  const vehicleFee = prices.vehicles[vehicle.id]
  const instantFee = input.mode === 'now' ? prices.instantFee : 0
  const total = service + vehicleFee + instantFee
  return {
    service,
    vehicleFee,
    instantFee,
    total,
    payout: Math.round((total * prices.payoutRate) / 10) * 10,
    minutes: vehicle.minutes + pack.extraMinutes,
  }
}

export function twd(value) {
  return `NT$ ${Number(value || 0).toLocaleString('zh-TW')}`
}

export function formatWhen(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
