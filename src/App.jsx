import { useState, useMemo, useRef } from 'react'
import {
  Car, Ship, Calendar, TrendingUp, AlertTriangle, Info,
  ChevronDown, RefreshCw, Calculator, DollarSign, Landmark,
  Receipt, Wallet, FileText, ArrowRight, BarChart3, Bike,
  MapPin, Gauge
} from 'lucide-react'
import {
  calculateImport, formatECV as formatECVCar, formatUSD,
  ICE_BRACKETS, USD_TO_ECV
} from './lib/calculator'
import {
  calculateMotoImport, formatECV, formatLocal,
  EUROPEAN_COUNTRIES, DISPLACEMENT_SEGMENTS, CURRENCIES,
  getCountry, getDisplacementSegment
} from './lib/motoCalculator'

function cn(...c) { return c.filter(Boolean).join(' ') }

// ─── Shared UI ─────────────────────────────────────────────────────────────
function Label({ children, htmlFor, className }) {
  return (
    <label htmlFor={htmlFor} className={cn('block text-xs font-mono tracking-widest uppercase text-[#4a5a7a] mb-2', className)}>
      {children}
    </label>
  )
}

function NumberInput({ id, value, onChange, placeholder, prefix, suffix, min, max, step }) {
  return (
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-4 text-[#3b82f6] font-mono text-sm font-semibold pointer-events-none">{prefix}</span>}
      <input id={id} type="number" value={value} onChange={onChange}
        placeholder={placeholder} min={min} max={max} step={step || 1}
        className={cn('w-full bg-[#0d1117] border border-[#1a2235] rounded-xl py-3.5 text-[#e2e8f0] font-mono text-base placeholder-[#1e2d45] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/30 transition-all duration-200', prefix ? 'pl-10 pr-4' : 'px-4', suffix ? 'pr-14' : '')}
      />
      {suffix && <span className="absolute right-4 text-[#4a5a7a] font-mono text-xs pointer-events-none">{suffix}</span>}
    </div>
  )
}

function Slider({ value, onChange, min, max }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="relative mt-3">
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none cursor-pointer rounded-full outline-none"
        style={{ background: `linear-gradient(to right, #2563eb ${pct}%, #1a2235 ${pct}%)` }} />
      <style>{`input[type='range']::-webkit-slider-thumb{appearance:none;width:18px;height:18px;border-radius:50%;background:#2563eb;border:2px solid #0d1117;box-shadow:0 0 8px rgba(37,99,235,0.5);cursor:pointer}input[type='range']::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#2563eb;border:2px solid #0d1117;cursor:pointer}`}</style>
    </div>
  )
}

function Badge({ children, variant = 'default' }) {
  const v = { default:'bg-[#1a2235] text-[#64748b]', blue:'bg-[#1d3a6e]/40 text-[#60a5fa] border border-[#2563eb]/25', green:'bg-[#064e3b]/40 text-[#34d399] border border-[#10b981]/25', amber:'bg-[#78350f]/30 text-[#fbbf24] border border-[#f59e0b]/25', red:'bg-[#7f1d1d]/30 text-[#f87171] border border-[#ef4444]/25', purple:'bg-[#4c1d95]/30 text-[#a78bfa] border border-[#8b5cf6]/25' }
  return <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium', v[variant])}>{children}</span>
}

function ResultRow({ icon: Icon, label, local, ecv, variant='default', note, delay=0 }) {
  const colors = { default:{icon:'text-[#4a5a7a]',ecv:'text-[#c4cfdf]',local:'text-[#4a5a7a]'}, blue:{icon:'text-[#3b82f6]',ecv:'text-[#93c5fd]',local:'text-[#60a5fa]'}, red:{icon:'text-[#f87171]',ecv:'text-[#fca5a5]',local:'text-[#f87171]'}, amber:{icon:'text-[#fbbf24]',ecv:'text-[#fde68a]',local:'text-[#fbbf24]'}, green:{icon:'text-[#34d399]',ecv:'text-[#6ee7b7]',local:'text-[#34d399]'} }
  const c = colors[variant] || colors.default
  return (
    <div className="result-animate flex items-center justify-between py-3 border-b border-[#111827] group" style={{animationDelay:`${delay}ms`}}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('flex-shrink-0 w-7 h-7 rounded-lg bg-[#0d1117] flex items-center justify-center', c.icon)}><Icon size={13}/></div>
        <div className="min-w-0">
          <span className="text-sm text-[#94a3b8] group-hover:text-[#cbd5e1] transition-colors">{label}</span>
          {note && <span className="ml-2 text-xs text-[#334155] font-mono">{note}</span>}
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        <span className={cn('text-xs font-mono hidden sm:block', c.local)}>{local}</span>
        <span className={cn('text-sm font-mono font-semibold', c.ecv)}>{ecv}</span>
      </div>
    </div>
  )
}

function SubtotalRow({ label, local, ecv }) {
  return (
    <div className="flex items-center justify-between py-2.5 mt-1 rounded-lg bg-[#111827] px-3 mb-4">
      <span className="text-xs font-mono text-[#4a5a7a] uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-xs font-mono text-[#60a5fa]">{local}</span>
        <span className="text-sm font-mono font-bold text-[#93c5fd]">{ecv}</span>
      </div>
    </div>
  )
}

function SectionLabel({ n, children }) {
  return <p className="text-[10px] font-mono tracking-widest text-[#2d3d55] uppercase mb-3">{n} — {children}</p>
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[#1a2235] bg-[#0d1117]/50 h-full min-h-64 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-[#111827] border border-[#1a2235] flex items-center justify-center"><BarChart3 size={22} className="text-[#2d3d55]"/></div>
      <div><p className="text-[#334155] font-display text-sm font-semibold">Preenche os campos</p><p className="text-[#1e2d45] text-xs mt-1">Os resultados aparecem aqui após calcular</p></div>
      <div className="flex items-center gap-2 text-[#1e2d45]"><ArrowRight size={12}/><span className="text-xs font-mono">Valor · Frete · Ano</span></div>
    </div>
  )
}

function PieChart({ segments, totalECV }) {
  let cum = -Math.PI / 2
  const arcs = segments.map(seg => {
    const pct = seg.ecv / totalECV, start = cum
    cum += pct * Math.PI * 2
    const r=70,cx=90,cy=90
    const x1=cx+r*Math.cos(start),y1=cy+r*Math.sin(start),x2=cx+r*Math.cos(cum),y2=cy+r*Math.sin(cum)
    return {...seg, d:`M${cx},${cy} L${x1},${y1} A${r},${r},0,${pct>0.5?1:0},1,${x2},${y2} Z`, pct}
  })
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 180 180" className="w-40 h-40 flex-shrink-0">
        {arcs.map((a,i) => <path key={i} d={a.d} fill={a.color} opacity={0.85} className="hover:opacity-100 transition-opacity"/>)}
        <circle cx="90" cy="90" r="42" fill="#07090f"/>
        <text x="90" y="86" textAnchor="middle" fill="#e2e8f0" style={{fontFamily:'JetBrains Mono',fontSize:'10px',fontWeight:600}}>TOTAL</text>
        <text x="90" y="100" textAnchor="middle" fill="#60a5fa" style={{fontFamily:'JetBrains Mono',fontSize:'9px'}}>{formatECV(totalECV)}</text>
      </svg>
      <div className="flex flex-col gap-2 w-full">
        {arcs.map((a,i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:a.color}}/><span className="text-xs text-[#64748b]">{a.label}</span></div>
            <span className="text-xs font-mono text-[#94a3b8]">{(a.pct*100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarBreakdown({ segments, totalECV }) {
  return (
    <div className="mt-6 space-y-2">
      {segments.map((item,i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:item.color}}/>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#64748b] truncate">{item.label}</span>
              <span className="font-mono text-[#94a3b8] ml-2 flex-shrink-0">{((item.ecv/totalECV)*100).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#111827] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{width:`${(item.ecv/totalECV)*100}%`,background:item.color,opacity:0.8}}/>
            </div>
          </div>
          <span className="text-xs font-mono text-[#4a5a7a] w-28 text-right flex-shrink-0">{formatECV(item.ecv)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── ICE Tables ────────────────────────────────────────────────────────────
function IceTableCar({ currentAge }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4 rounded-xl border border-[#1a2235] overflow-hidden">
      <button onClick={() => setOpen(v=>!v)} className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1117] hover:bg-[#111827] transition-colors">
        <span className="text-xs font-mono tracking-widest text-[#4a5a7a] uppercase">Tabela ICE por Idade</span>
        <ChevronDown size={14} className={cn('text-[#4a5a7a] transition-transform', open&&'rotate-180')}/>
      </button>
      {open && <div className="divide-y divide-[#111827]">
        {ICE_BRACKETS.map(b => {
          const active = currentAge >= b.minAge && currentAge <= b.maxAge
          return (
            <div key={b.label} className={cn('flex items-center justify-between px-4 py-2.5 text-xs font-mono', active?'bg-[#1d3a6e]/30 text-[#60a5fa]':'bg-[#07090f] text-[#4a5a7a]')}>
              <div className="flex items-center gap-2">
                <div className={cn('w-1.5 h-1.5 rounded-full', active?'bg-[#3b82f6]':'bg-[#1a2235]')}/><span>{b.label}</span>
                {!b.confirmed && <span className="text-[#2d3d55] text-[10px]">est.</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className={active?'text-[#3b82f6]':'text-[#334155]'}>{formatUSD(b.ecv/USD_TO_ECV)}</span>
                <span className={active?'font-semibold text-[#60a5fa]':''}>{formatECVCar(b.ecv)}</span>
              </div>
            </div>
          )
        })}
      </div>}
    </div>
  )
}

function IceTableMoto({ segment, ageYears, cifECV }) {
  const [open, setOpen] = useState(false)
  if (!segment) return null
  const rows = [
    { label:'0 – 4 anos (taxa fixa)', ice:segment.ice0_4, isFixed:true, active:ageYears<=4 },
    ...segment.iceRates.map(r => ({
      label: r.maxAge>=99?`+${r.minAge} anos`:`${r.minAge} – ${r.maxAge} anos`,
      ice: cifECV>0?cifECV*r.pct:null, pct:r.pct, isFixed:false,
      active: ageYears>4 && ageYears>=r.minAge && ageYears<=r.maxAge
    }))
  ]
  return (
    <div className="mt-4 rounded-xl border border-[#1a2235] overflow-hidden">
      <button onClick={() => setOpen(v=>!v)} className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1117] hover:bg-[#111827] transition-colors">
        <span className="text-xs font-mono tracking-widest text-[#4a5a7a] uppercase">Tabela ICE — {segment.label}</span>
        <ChevronDown size={14} className={cn('text-[#4a5a7a] transition-transform', open&&'rotate-180')}/>
      </button>
      {open && <div className="divide-y divide-[#111827]">
        {rows.map((row,i) => (
          <div key={i} className={cn('flex items-center justify-between px-4 py-2.5 text-xs font-mono', row.active?'bg-[#1d3a6e]/30 text-[#60a5fa]':'bg-[#07090f] text-[#4a5a7a]')}>
            <div className="flex items-center gap-2">
              <div className={cn('w-1.5 h-1.5 rounded-full', row.active?'bg-[#3b82f6]':'bg-[#1a2235]')}/><span>{row.label}</span>
              {!row.isFixed && <span className="text-[#334155]">({(row.pct*100).toFixed(0)}% CIF)</span>}
            </div>
            <span className={row.active?'font-semibold':''}>
              {row.isFixed ? formatECV(row.ice) : row.ice ? formatECV(row.ice) : `${(row.pct*100).toFixed(0)}% do CIF`}
            </span>
          </div>
        ))}
      </div>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CAR CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════
const CURRENT_YEAR = new Date().getFullYear()

function CarCalculator() {
  const [carValue, setCarValue] = useState('')
  const [freight, setFreight] = useState('')
  const [carYear, setCarYear] = useState(CURRENT_YEAR - 2)
  const [exchangeRate, setExchangeRate] = useState(USD_TO_ECV)
  const [showAdv, setShowAdv] = useState(false)
  const [done, setDone] = useState(false)
  const [tab, setTab] = useState('breakdown')
  const ref = useRef(null)

  const R = useMemo(() => {
    const cv=parseFloat(carValue), fr=parseFloat(freight)
    if(!cv||!fr||cv<=0||fr<=0) return null
    return calculateImport({carValueUSD:cv,freightUSD:fr,carYear,exchangeRate})
  }, [carValue,freight,carYear,exchangeRate])

  const age = CURRENT_YEAR - carYear

  function calc() { if(!R) return; setDone(true); setTimeout(()=>ref.current?.scrollIntoView({behavior:'smooth',block:'start'}),100) }
  function reset() { setCarValue('');setFreight('');setCarYear(CURRENT_YEAR-2);setExchangeRate(USD_TO_ECV);setDone(false) }

  const chartSegs = R ? [
    {label:'Veículo + Frete + Seguro', ecv:R.cifECV, color:'#3b82f6'},
    {label:'Dir. Importação (20%)', ecv:R.diECV, color:'#8b5cf6'},
    {label:`ICE (${R.iceBracket.label})`, ecv:R.iceECV, color:'#ef4444'},
    {label:'IVA (15%)', ecv:R.ivaECV, color:'#f59e0b'},
    {label:'TEA + Despachante', ecv:R.teaECV+R.despachanteMidECV, color:'#10b981'},
  ] : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl border border-[#1a2235] bg-[#0d1117] p-6 space-y-6">
          <div>
            <Label htmlFor="cv"><DollarSign size={10} className="inline mr-1"/>Preço do veículo</Label>
            <NumberInput id="cv" value={carValue} onChange={e=>setCarValue(e.target.value)} placeholder="3000" prefix="$" suffix="USD" min={100}/>
          </div>
          <div>
            <Label htmlFor="fr"><Ship size={10} className="inline mr-1"/>Frete Internacional</Label>
            <NumberInput id="fr" value={freight} onChange={e=>setFreight(e.target.value)} placeholder="800" prefix="$" suffix="USD" min={100}/>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label><Calendar size={10} className="inline mr-1"/>Ano do veículo</Label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#60a5fa]">{carYear}</span>
                <Badge variant={age<=4?'blue':age<=10?'amber':'red'}>{age} {age===1?'ano':'anos'}</Badge>
              </div>
            </div>
            <Slider value={carYear} onChange={setCarYear} min={CURRENT_YEAR-30} max={CURRENT_YEAR}/>
            <div className="flex justify-between text-[10px] font-mono text-[#2d3d55] mt-1.5"><span>{CURRENT_YEAR-30}</span><span>{CURRENT_YEAR}</span></div>
            {R && <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#07090f] border border-[#1a2235] px-3 py-2">
              <div className={cn('w-2 h-2 rounded-full',age<=4?'bg-[#3b82f6]':age<=7?'bg-[#f59e0b]':'bg-[#ef4444]')}/>
              <span className="text-xs text-[#64748b]">ICE aplicável:</span>
              <span className="text-xs font-mono font-semibold text-[#c4cfdf] ml-auto">{formatECVCar(R.iceECV)}</span>
            </div>}
          </div>
          <div>
            <button onClick={()=>setShowAdv(v=>!v)} className="flex items-center gap-2 text-xs font-mono text-[#334155] hover:text-[#4a5a7a] transition-colors">
              <ChevronDown size={12} className={cn('transition-transform',showAdv&&'rotate-180')}/> Opções avançadas
            </button>
            {showAdv && <div className="mt-4 pt-4 border-t border-[#111827] animate-fade-up">
              <Label htmlFor="ex"><TrendingUp size={10} className="inline mr-1"/>Câmbio USD → ECV</Label>
              <NumberInput id="ex" value={exchangeRate} onChange={e=>setExchangeRate(parseFloat(e.target.value)||USD_TO_ECV)} step={0.1} min={90} max={130} suffix="ECV"/>
              <p className="mt-1.5 text-[10px] font-mono text-[#2d3d55]">Padrão: 103.7 (fixado ao EUR)</p>
            </div>}
          </div>
          <div className="flex gap-3">
            <button onClick={calc} disabled={!R} className={cn('flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-display font-semibold transition-all duration-200', R?'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg shadow-[#2563eb]/20 active:scale-95':'bg-[#1a2235] text-[#2d3d55] cursor-not-allowed')}>
              <Calculator size={15}/>Calcular
            </button>
            {done && <button onClick={reset} className="rounded-xl px-4 border border-[#1a2235] text-[#4a5a7a] hover:text-[#64748b] transition-all"><RefreshCw size={14}/></button>}
          </div>
        </div>
        {R && <IceTableCar currentAge={age}/>}
        <div className="rounded-xl border border-[#f59e0b]/20 bg-[#78350f]/10 p-4">
          <div className="flex gap-3">
            <AlertTriangle size={14} className="text-[#fbbf24] flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-[#9ca3a8] leading-relaxed"><span className="text-[#fbbf24] font-medium">Reavaliação aduaneira:</span> A alfândega pode contestar valores abaixo do mercado. Tenha sempre documentação justificativa.</p>
          </div>
        </div>
      </div>
      <div className="lg:col-span-3" ref={ref}>
        {!done||!R ? <EmptyState/> : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#1e3a6e] bg-gradient-to-br from-[#0b1f40] via-[#0d2d5e]/60 to-[#0a1a35] p-6 result-animate overflow-hidden relative" style={{boxShadow:'0 0 40px rgba(37,99,235,0.08)'}}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#1d4ed8]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none"/>
              <div className="relative z-10">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs font-mono tracking-widest text-[#4a6a9a] uppercase mb-1.5">Custo Total Estimado</p>
                    <p className="font-display text-4xl font-extrabold text-[#e8f0fe] tracking-tight">{formatUSD(R.totalComDespachanteUSD)}</p>
                    <p className="font-mono text-lg text-[#a78bfa] mt-1">{formatECVCar(R.totalComDespachante)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="blue"><Car size={10}/>{R.ageYears} anos</Badge>
                    <Badge variant="purple">ICE: {formatECVCar(R.iceECV)}</Badge>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[{label:'Carro + Envio',v:formatUSD(R.cifUSD),I:Car},{label:'Só Impostos',v:formatUSD(R.totalImpostosUSD),I:Landmark},{label:'Despachante',v:formatUSD(R.despachanteMidUSD),I:FileText}].map((x,i)=>(
                    <div key={i} className="rounded-xl bg-[#071530]/60 border border-[#1a2d4a] px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1"><x.I size={10} className="text-[#3b5a9a]"/><span className="text-[10px] font-mono text-[#3b5a9a] uppercase tracking-wider">{x.label}</span></div>
                      <span className="font-mono text-sm font-semibold text-[#93c5fd]">{x.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#1a2235] bg-[#0d1117] overflow-hidden">
              <div className="flex border-b border-[#111827]">
                {[{id:'breakdown',label:'Detalhes',I:Receipt},{id:'chart',label:'Gráfico',I:BarChart3}].map(t=>(
                  <button key={t.id} onClick={()=>setTab(t.id)} className={cn('flex items-center gap-2 px-5 py-3.5 text-xs font-mono tracking-wider uppercase transition-colors',tab===t.id?'text-[#60a5fa] border-b-2 border-[#2563eb] bg-[#111827]/50':'text-[#334155] hover:text-[#4a5a7a]')}>
                    <t.I size={12}/>{t.label}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {tab==='breakdown' && <div>
                  <SectionLabel n="01">Base de Cálculo (CIF)</SectionLabel>
                  <ResultRow icon={Car}    label="Preço do veículo"      local={formatUSD(R.carValueUSD)} ecv={formatECVCar(R.carValueUSD*R.exchangeRate)} delay={0}/>
                  <ResultRow icon={Ship}   label="Frete internacional"   local={formatUSD(R.freightUSD)}  ecv={formatECVCar(R.freightUSD*R.exchangeRate)}  delay={50}/>
                  <ResultRow icon={Wallet} label="Seguro (~1%)"          local={formatUSD(R.insuranceUSD)} ecv={formatECVCar(R.insuranceUSD*R.exchangeRate)} delay={100}/>
                  <SubtotalRow label="Valor CIF" local={formatUSD(R.cifUSD)} ecv={formatECVCar(R.cifECV)}/>
                  <SectionLabel n="02">Impostos Aduaneiros</SectionLabel>
                  <ResultRow icon={Landmark}   label="Direito Importação (DI)"  note="20% CIF"                variant="blue"  local={formatUSD(R.diUSD)}  ecv={formatECVCar(R.diECV)}  delay={150}/>
                  <ResultRow icon={TrendingUp} label={`ICE — ${R.iceBracket.label}`} note={R.iceBracket.confirmed?'✓ lei':'est.'} variant="red"   local={formatUSD(R.iceUSD)} ecv={formatECVCar(R.iceECV)} delay={200}/>
                  <ResultRow icon={Receipt}    label="IVA"                       note="15%×(CIF+DI+ICE)"      variant="amber" local={formatUSD(R.ivaUSD)}  ecv={formatECVCar(R.ivaECV)}  delay={250}/>
                  <ResultRow icon={FileText}   label="Taxa Estatística (TEA)"                                 variant="default" local={formatUSD(R.teaUSD)} ecv={formatECVCar(R.teaECV)} delay={300}/>
                  <SubtotalRow label="Total Impostos" local={formatUSD(R.totalImpostosUSD)} ecv={formatECVCar(R.totalImpostosECV)}/>
                  <SectionLabel n="03">Serviços</SectionLabel>
                  <ResultRow icon={FileText} label="Honorários do Despachante" note={`${formatECVCar(R.despachanteMinECV)}–${formatECVCar(R.despachanteMidECV*2-R.despachanteMinECV)}`} variant="green" local={formatUSD(R.despachanteMidUSD)} ecv={formatECVCar(R.despachanteMidECV)} delay={350}/>
                  <div className="mt-4 rounded-xl border border-[#a78bfa]/20 bg-gradient-to-r from-[#1a0d3a]/60 to-[#0a0d1a] px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs font-mono text-[#6b4fa0] uppercase tracking-widest">Total Geral</p><p className="text-xs text-[#4a3070] mt-0.5 font-mono">Veículo + Impostos + Despachante</p></div>
                      <div className="text-right"><p className="font-mono text-base font-bold text-[#a78bfa]">{formatECVCar(R.totalComDespachante)}</p><p className="font-mono text-sm text-[#7c5cbf]">{formatUSD(R.totalComDespachanteUSD)}</p></div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#0d1117] border border-[#1a2235] px-3 py-2.5">
                    <Info size={12} className="text-[#334155] flex-shrink-0"/>
                    <p className="text-[11px] text-[#334155]">Impostos: <span className="text-[#f87171] font-semibold">{((R.totalImpostosECV/R.totalComDespachante)*100).toFixed(0)}%</span> do custo total.</p>
                  </div>
                </div>}
                {tab==='chart' && <div className="animate-fade-up">
                  <p className="text-xs font-mono text-[#2d3d55] uppercase tracking-widest mb-5">Distribuição dos Custos</p>
                  <PieChart segments={chartSegs} totalECV={R.totalComDespachante}/>
                  <BarBreakdown segments={chartSegs} totalECV={R.totalComDespachante}/>
                </div>}
              </div>
            </div>
            <p className="text-center text-[10px] font-mono text-[#1e2d45]">Câmbio: 1 USD = {R.exchangeRate.toFixed(1)} ECV · 🇺🇸 EUA → 🇨🇻 Mindelo · Estimativa Maio 2026</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MOTO CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════
function MotoCalculator() {
  const [motoValue, setMotoValue] = useState('')
  const [motoYear, setMotoYear] = useState(CURRENT_YEAR - 3)
  const [countryCode, setCountryCode] = useState('PT')
  const [dispId, setDispId] = useState('small')
  const [useCustomFreight, setUseCustomFreight] = useState(false)
  const [customFreight, setCustomFreight] = useState('')
  const [done, setDone] = useState(false)
  const [tab, setTab] = useState('breakdown')
  const ref = useRef(null)

  const country = getCountry(countryCode)
  const segment = getDisplacementSegment(dispId)
  const currency = CURRENCIES[country.currency]
  const age = CURRENT_YEAR - motoYear
  const sym = currency.symbol

  const R = useMemo(() => {
    const mv = parseFloat(motoValue)
    if(!mv||mv<=0) return null
    const cf = useCustomFreight ? parseFloat(customFreight)||null : null
    return calculateMotoImport({motoValueLocal:mv,freightLocal:null,motoYear,countryCode,displacementId:dispId,customFreight:cf})
  }, [motoValue,motoYear,countryCode,dispId,useCustomFreight,customFreight])

  function fmtL(v) { return sym+new Intl.NumberFormat('de-DE').format(Math.round(v)) }

  function calc() { if(!R) return; setDone(true); setTimeout(()=>ref.current?.scrollIntoView({behavior:'smooth',block:'start'}),100) }
  function reset() { setMotoValue('');setMotoYear(CURRENT_YEAR-3);setCountryCode('PT');setDispId('small');setDone(false);setUseCustomFreight(false);setCustomFreight('') }

  const chartSegs = R ? [
    {label:'Mota + Frete + Seguro', ecv:R.cifECV, color:'#10b981'},
    {label:'Dir. Importação (20%)', ecv:R.diECV, color:'#8b5cf6'},
    {label:`ICE (${segment.label})`, ecv:R.iceECV, color:'#ef4444'},
    {label:'IVA (15%)', ecv:R.ivaECV, color:'#f59e0b'},
    {label:'TEA + Despachante', ecv:R.teaECV+R.despachanteMidECV, color:'#3b82f6'},
  ] : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl border border-[#1a2235] bg-[#0d1117] p-6 space-y-6">

          {/* Country */}
          <div>
            <Label><MapPin size={10} className="inline mr-1"/>País de Origem</Label>
            <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1 custom-scroll">
              {EUROPEAN_COUNTRIES.map(c => (
                <button key={c.code} onClick={()=>setCountryCode(c.code)}
                  className={cn('flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-mono transition-all text-left', countryCode===c.code?'bg-[#1d3a6e]/60 border border-[#2563eb]/40 text-[#60a5fa]':'bg-[#07090f] border border-[#1a2235] text-[#4a5a7a] hover:border-[#334155] hover:text-[#64748b]')}>
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#07090f] border border-[#1a2235] px-3 py-2">
              <Ship size={11} className="text-[#334155] flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-[10px] font-mono text-[#334155]">{country.ports}</p>
                <p className="text-[10px] text-[#2d3d55] mt-0.5">{country.notes}</p>
              </div>
            </div>
          </div>

          {/* Displacement */}
          <div>
            <Label><Gauge size={10} className="inline mr-1"/>Cilindrada do Motor</Label>
            <div className="space-y-1.5">
              {DISPLACEMENT_SEGMENTS.map(s => (
                <button key={s.id} onClick={()=>setDispId(s.id)}
                  className={cn('w-full flex items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-mono transition-all', dispId===s.id?'bg-[#1d3a6e]/60 border border-[#2563eb]/40 text-[#60a5fa]':'bg-[#07090f] border border-[#1a2235] text-[#4a5a7a] hover:border-[#334155]')}>
                  <div className="flex items-center gap-2.5">
                    <span>{s.icon}</span><span>{s.label}</span>
                    <span className={cn('text-[10px]',dispId===s.id?'text-[#3b5a9a]':'text-[#2d3d55]')}>{s.sublabel}</span>
                  </div>
                  {dispId===s.id && <span className="text-[10px] text-[#3b82f6]">ICE 0–4a: {formatECV(s.ice0_4)}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Value */}
          <div>
            <Label htmlFor="mv"><DollarSign size={10} className="inline mr-1"/>Preço da Mota</Label>
            <NumberInput id="mv" value={motoValue} onChange={e=>setMotoValue(e.target.value)} placeholder="2000" prefix={sym} suffix={country.currency} min={100}/>
          </div>

          {/* Year */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label><Calendar size={10} className="inline mr-1"/>Ano da mota</Label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#60a5fa]">{motoYear}</span>
                <Badge variant={age<=4?'blue':age<=7?'amber':'red'}>{age} {age===1?'ano':'anos'}</Badge>
              </div>
            </div>
            <Slider value={motoYear} onChange={setMotoYear} min={CURRENT_YEAR-30} max={CURRENT_YEAR}/>
            <div className="flex justify-between text-[10px] font-mono text-[#2d3d55] mt-1.5"><span>{CURRENT_YEAR-30}</span><span>{CURRENT_YEAR}</span></div>
            {R && <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#07090f] border border-[#1a2235] px-3 py-2">
              <div className={cn('w-2 h-2 rounded-full',age<=4?'bg-[#3b82f6]':age<=7?'bg-[#f59e0b]':'bg-[#ef4444]')}/>
              <span className="text-xs text-[#64748b]">ICE:</span>
              <span className="text-[10px] font-mono text-[#4a5a7a] ml-1">{R.iceResult.isFixed?'taxa fixa':`${((R.iceResult.pct||0)*100).toFixed(0)}% CIF`}</span>
              <span className="text-xs font-mono font-semibold text-[#c4cfdf] ml-auto">{formatECV(R.iceECV)}</span>
            </div>}
          </div>

          {/* Freight */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label><Ship size={10} className="inline mr-1"/>Frete</Label>
              <button onClick={()=>setUseCustomFreight(v=>!v)} className={cn('text-[10px] font-mono transition-colors',useCustomFreight?'text-[#60a5fa]':'text-[#334155] hover:text-[#4a5a7a]')}>
                {useCustomFreight?'← usar estimativa':'personalizar →'}
              </button>
            </div>
            {useCustomFreight
              ? <NumberInput id="cf" value={customFreight} onChange={e=>setCustomFreight(e.target.value)} placeholder={country.freightMid.toString()} prefix={sym} suffix={country.currency} min={50}/>
              : <div className="rounded-xl bg-[#07090f] border border-[#1a2235] px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-[#4a5a7a] font-mono">Estimado · {country.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-mono font-semibold text-[#60a5fa]">{sym}{country.freightMid}</span>
                    <span className="text-[10px] font-mono text-[#2d3d55] ml-1">{country.currency}</span>
                    <p className="text-[10px] text-[#2d3d55]">{sym}{country.freightMin}–{sym}{country.freightMax}</p>
                  </div>
                </div>
            }
          </div>

          {/* Exchange info */}
          <div className="rounded-lg bg-[#07090f] border border-[#1a2235] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#2d3d55]">Câmbio {country.currency} → ECV</span>
              <span className="text-xs font-mono text-[#334155]">1 {country.currency} = {currency.toECV.toFixed(3)} ECV</span>
            </div>
            <p className="text-[10px] text-[#1e2d45] mt-0.5">{country.currency==='EUR'?'Taxa fixa — indexado ao Euro desde 1999':'Taxa aproximada — pode variar'}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={calc} disabled={!R} className={cn('flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-display font-semibold transition-all duration-200', R?'bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-[#10b981]/20 active:scale-95':'bg-[#1a2235] text-[#2d3d55] cursor-not-allowed')}>
              <Calculator size={15}/>Calcular
            </button>
            {done && <button onClick={reset} className="rounded-xl px-4 border border-[#1a2235] text-[#4a5a7a] hover:text-[#64748b] transition-all"><RefreshCw size={14}/></button>}
          </div>
        </div>

        {R && <IceTableMoto segment={segment} ageYears={age} cifECV={R.cifECV}/>}
        <div className="rounded-xl border border-[#f59e0b]/20 bg-[#78350f]/10 p-4">
          <div className="flex gap-3">
            <AlertTriangle size={14} className="text-[#fbbf24] flex-shrink-0 mt-0.5"/>
            <div className="text-xs text-[#9ca3a8] leading-relaxed space-y-1">
              <p><span className="text-[#fbbf24] font-medium">ICE por cilindrada:</span> Taxas para 5+ anos são estimativas — confirmar com despachante.</p>
              <p className="text-[#4a5a7a]">Livrete original obrigatório. Reino Unido e Suíça exigem documentação extra de exportação.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3" ref={ref}>
        {!done||!R ? <EmptyState/> : (
          <div className="space-y-4">
            {/* Hero */}
            <div className="rounded-2xl border border-[#14532d]/60 bg-gradient-to-br from-[#052e16] via-[#064e3b]/50 to-[#07090f] p-6 result-animate overflow-hidden relative" style={{boxShadow:'0 0 40px rgba(16,185,129,0.08)'}}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#10b981]/8 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none"/>
              <div className="relative z-10">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs font-mono tracking-widest text-[#166534] uppercase mb-1.5">Custo Total Estimado</p>
                    <p className="font-display text-4xl font-extrabold text-[#ecfdf5] tracking-tight">{fmtL(R.totalComDespachanteLocal)}</p>
                    <p className="font-mono text-lg text-[#6ee7b7] mt-1">{formatECV(R.totalComDespachante)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="green"><Bike size={10}/>{country.flag} {country.name}</Badge>
                    <Badge variant="green"><Gauge size={10}/>{segment.label}</Badge>
                    <Badge variant={age<=4?'blue':'amber'}>{age} anos</Badge>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[{label:'Mota + Envio',v:fmtL(R.cifLocal),I:Bike},{label:'Só Impostos',v:fmtL(R.totalImpostosLocal),I:Landmark},{label:'Despachante',v:fmtL(R.despachanteMidLocal),I:FileText}].map((x,i)=>(
                    <div key={i} className="rounded-xl bg-[#052e16]/60 border border-[#14532d]/40 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1"><x.I size={10} className="text-[#166534]"/><span className="text-[10px] font-mono text-[#166534] uppercase tracking-wider">{x.label}</span></div>
                      <span className="font-mono text-sm font-semibold text-[#6ee7b7]">{x.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="rounded-2xl border border-[#1a2235] bg-[#0d1117] overflow-hidden">
              <div className="flex border-b border-[#111827]">
                {[{id:'breakdown',label:'Detalhes',I:Receipt},{id:'chart',label:'Gráfico',I:BarChart3}].map(t=>(
                  <button key={t.id} onClick={()=>setTab(t.id)} className={cn('flex items-center gap-2 px-5 py-3.5 text-xs font-mono tracking-wider uppercase transition-colors',tab===t.id?'text-[#34d399] border-b-2 border-[#10b981] bg-[#111827]/50':'text-[#334155] hover:text-[#4a5a7a]')}>
                    <t.I size={12}/>{t.label}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {tab==='breakdown' && <div>
                  <SectionLabel n="01">Base de Cálculo (CIF)</SectionLabel>
                  <ResultRow icon={Bike}   label="Preço da mota"       local={fmtL(R.motoValueLocal)}      ecv={formatECV(R.motoValueLocal*R.toECV)}        delay={0}/>
                  <ResultRow icon={Ship}   label="Frete internacional" local={fmtL(R.freightLocalFinal)}   ecv={formatECV(R.freightLocalFinal*R.toECV)}     delay={50}/>
                  <ResultRow icon={Wallet} label="Seguro (~1%)"        local={fmtL(R.insuranceLocal)}      ecv={formatECV(R.insuranceLocal*R.toECV)}        delay={100}/>
                  <SubtotalRow label="Valor CIF" local={fmtL(R.cifLocal)} ecv={formatECV(R.cifECV)}/>
                  <SectionLabel n="02">Impostos Aduaneiros</SectionLabel>
                  <ResultRow icon={Landmark}   label="Direito Importação (DI)" note="20% CIF"                                     variant="blue"    local={fmtL(R.diLocal)}          ecv={formatECV(R.diECV)}  delay={150}/>
                  <ResultRow icon={TrendingUp} label={`ICE — ${segment.label}`} note={R.iceResult.isFixed?'taxa fixa':`${((R.iceResult.pct||0)*100).toFixed(0)}% CIF`} variant="red"  local={fmtL(R.iceLocal)}  ecv={formatECV(R.iceECV)} delay={200}/>
                  <ResultRow icon={Receipt}    label="IVA"                      note="15%×(CIF+DI+ICE)"                           variant="amber"   local={fmtL(R.ivaLocal)}         ecv={formatECV(R.ivaECV)} delay={250}/>
                  <ResultRow icon={FileText}   label="Taxa Estatística (TEA)"                                                     variant="default" local={fmtL(R.teaLocal)}         ecv={formatECV(R.teaECV)} delay={300}/>
                  <SubtotalRow label="Total Impostos" local={fmtL(R.totalImpostosLocal)} ecv={formatECV(R.totalImpostosECV)}/>
                  <SectionLabel n="03">Serviços</SectionLabel>
                  <ResultRow icon={FileText} label="Honorários Despachante" note={`${formatECV(R.despachanteMinECV)}–${formatECV(R.despachanteMaxECV)}`} variant="green" local={fmtL(R.despachanteMidLocal)} ecv={formatECV(R.despachanteMidECV)} delay={350}/>
                  <div className="mt-4 rounded-xl border border-[#10b981]/20 bg-gradient-to-r from-[#052e16]/60 to-[#07090f] px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs font-mono text-[#166534] uppercase tracking-widest">Total Geral</p><p className="text-xs text-[#14532d] mt-0.5 font-mono">Mota + Impostos + Despachante</p></div>
                      <div className="text-right"><p className="font-mono text-base font-bold text-[#34d399]">{formatECV(R.totalComDespachante)}</p><p className="font-mono text-sm text-[#166534]">{fmtL(R.totalComDespachanteLocal)} {country.currency}</p></div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#0d1117] border border-[#1a2235] px-3 py-2.5">
                    <Info size={12} className="text-[#334155] flex-shrink-0"/>
                    <p className="text-[11px] text-[#334155]">1 {country.currency} = {R.toECV.toFixed(3)} ECV · Impostos: <span className="text-[#f87171] font-semibold">{((R.totalImpostosECV/R.totalComDespachante)*100).toFixed(0)}%</span> do total</p>
                  </div>
                </div>}
                {tab==='chart' && <div className="animate-fade-up">
                  <p className="text-xs font-mono text-[#2d3d55] uppercase tracking-widest mb-5">Distribuição dos Custos</p>
                  <PieChart segments={chartSegs} totalECV={R.totalComDespachante}/>
                  <BarBreakdown segments={chartSegs} totalECV={R.totalComDespachante}/>
                </div>}
              </div>
            </div>
            <p className="text-center text-[10px] font-mono text-[#1e2d45]">{country.flag} {country.name} → 🇨🇻 Mindelo · 1 {country.currency} = {R.toECV.toFixed(3)} ECV · Estimativa Maio 2026</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP — Mode switcher
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [mode, setMode] = useState('car')

  return (
    <div className="min-h-screen bg-[#07090f] grid-bg">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-[#1d4ed8]/8 rounded-full blur-3xl"/>
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-[#7c3aed]/6 rounded-full blur-3xl"/>
        {mode==='moto' && <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#10b981]/5 rounded-full blur-3xl"/>}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1a2235] bg-[#0d1117] px-4 py-1.5 text-xs font-mono text-[#4a5a7a] tracking-widest uppercase mb-6">
            <span>{mode==='car'?'🇺🇸':'🇪🇺'}</span>
            <span className="text-[#1a2235]">——→</span>
            <span>🇨🇻</span>
            <span className="text-[#1a2235] mx-1">·</span>
            {mode==='car'?'EUA → Mindelo':'Europa → Mindelo'}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#e2e8f0] mb-3 tracking-tight">
            CV Import{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]">Calc</span>
          </h1>
          <p className="text-[#4a5a7a] text-sm max-w-md mx-auto leading-relaxed">
            Calcula os impostos e custos de importação de viaturas para Cabo Verde — Mindelo, São Vicente.
          </p>
        </div>

        {/* Mode switcher */}
        <div className="flex justify-center mb-8">
          <div className="flex rounded-2xl border border-[#1a2235] bg-[#0d1117] p-1.5 gap-1.5">
            <button onClick={()=>setMode('car')}
              className={cn('flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-display font-semibold transition-all duration-300', mode==='car'?'bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/25':'text-[#334155] hover:text-[#64748b]')}>
              <Car size={16}/><span>Carro</span><span className="text-xs opacity-60">EUA</span>
            </button>
            <button onClick={()=>setMode('moto')}
              className={cn('flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-display font-semibold transition-all duration-300', mode==='moto'?'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/25':'text-[#334155] hover:text-[#64748b]')}>
              <Bike size={16}/><span>Mota</span><span className="text-xs opacity-60">Europa</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-up" key={mode}>
          {mode==='car' ? <CarCalculator/> : <MotoCalculator/>}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-[#0f1825] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-[#1e2d45]">
          <span>CV IMPORT CALC · Alfândega do Mindelo · São Vicente</span>
          <span>DGA · Regime Geral · Não Emigrante</span>
        </div>
      </div>
    </div>
  )
}
