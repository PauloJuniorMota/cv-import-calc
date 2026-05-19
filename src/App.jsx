import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Car, Ship, Calendar, TrendingUp, AlertTriangle,
  Info, ChevronDown, RefreshCw, Download, Calculator,
  DollarSign, Landmark, Receipt, Wallet, FileText,
  CheckCircle2, CircleAlert, ArrowRight, BarChart3
} from 'lucide-react'
import {
  calculateImport, formatECV, formatUSD,
  ICE_BRACKETS, USD_TO_ECV
} from './lib/calculator'

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────
function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// ─────────────────────────────────────────────
// Micro components
// ─────────────────────────────────────────────
function Label({ children, htmlFor, className }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'block text-xs font-mono tracking-widest uppercase text-[#4a5a7a] mb-2',
        className
      )}
    >
      {children}
    </label>
  )
}

function Input({ id, value, onChange, placeholder, prefix, suffix, min, max, step }) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-4 text-[#3b82f6] font-mono text-sm font-semibold pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        id={id}
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step || 1}
        className={cn(
          'w-full bg-[#0d1117] border border-[#1a2235] rounded-xl py-3.5',
          'text-[#e2e8f0] font-mono text-base placeholder-[#1e2d45]',
          'focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/30',
          'transition-all duration-200',
          prefix ? 'pl-10 pr-4' : 'px-4',
          suffix ? 'pr-14' : ''
        )}
      />
      {suffix && (
        <span className="absolute right-4 text-[#4a5a7a] font-mono text-xs pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  )
}

function Slider({ value, onChange, min, max }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="relative mt-3">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none cursor-pointer rounded-full outline-none"
        style={{
          background: `linear-gradient(to right, #2563eb ${pct}%, #1a2235 ${pct}%)`,
        }}
      />
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none; width: 18px; height: 18px;
          border-radius: 50%; background: #2563eb;
          border: 2px solid #0d1117;
          box-shadow: 0 0 8px rgba(37,99,235,0.5);
          cursor: pointer;
        }
        input[type='range']::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: #2563eb; border: 2px solid #0d1117; cursor: pointer;
        }
      `}</style>
    </div>
  )
}

function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-[#1a2235] text-[#64748b]',
    blue: 'bg-[#1d3a6e]/40 text-[#60a5fa] border border-[#2563eb]/25',
    green: 'bg-[#064e3b]/40 text-[#34d399] border border-[#10b981]/25',
    amber: 'bg-[#78350f]/30 text-[#fbbf24] border border-[#f59e0b]/25',
    red: 'bg-[#7f1d1d]/30 text-[#f87171] border border-[#ef4444]/25',
    purple: 'bg-[#4c1d95]/30 text-[#a78bfa] border border-[#8b5cf6]/25',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium', variants[variant])}>
      {children}
    </span>
  )
}

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 rounded-lg bg-[#0d1117] border border-[#1a2235] text-[#94a3b8] text-xs p-2.5 shadow-xl pointer-events-none">
          {text}
        </span>
      )}
    </span>
  )
}

// ─────────────────────────────────────────────
// Result Row
// ─────────────────────────────────────────────
function ResultRow({ icon: Icon, label, usd, ecv, variant = 'default', note, delay = 0 }) {
  const colors = {
    default: { icon: 'text-[#4a5a7a]', ecv: 'text-[#c4cfdf]', usd: 'text-[#4a5a7a]' },
    blue: { icon: 'text-[#3b82f6]', ecv: 'text-[#93c5fd]', usd: 'text-[#60a5fa]' },
    red: { icon: 'text-[#f87171]', ecv: 'text-[#fca5a5]', usd: 'text-[#f87171]' },
    amber: { icon: 'text-[#fbbf24]', ecv: 'text-[#fde68a]', usd: 'text-[#fbbf24]' },
    green: { icon: 'text-[#34d399]', ecv: 'text-[#6ee7b7]', usd: 'text-[#34d399]' },
    purple: { icon: 'text-[#a78bfa]', ecv: 'text-[#c4b5fd]', usd: 'text-[#a78bfa]' },
  }
  const c = colors[variant] || colors.default

  return (
    <div
      className="result-animate flex items-center justify-between py-3 border-b border-[#111827] group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('flex-shrink-0 w-7 h-7 rounded-lg bg-[#0d1117] flex items-center justify-center', c.icon)}>
          <Icon size={13} />
        </div>
        <div className="min-w-0">
          <span className="text-sm text-[#94a3b8] group-hover:text-[#cbd5e1] transition-colors">{label}</span>
          {note && <span className="ml-2 text-xs text-[#334155] font-mono">{note}</span>}
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        <span className={cn('text-xs font-mono hidden sm:block', c.usd)}>{usd}</span>
        <span className={cn('text-sm font-mono font-semibold', c.ecv)}>{ecv}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// ICE Age Table
// ─────────────────────────────────────────────
function IceTable({ currentAge }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4 rounded-xl border border-[#1a2235] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1117] hover:bg-[#111827] transition-colors"
      >
        <span className="text-xs font-mono tracking-widest text-[#4a5a7a] uppercase">Tabela ICE por Idade</span>
        <ChevronDown size={14} className={cn('text-[#4a5a7a] transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="divide-y divide-[#111827]">
          {ICE_BRACKETS.map(b => {
            const isActive = currentAge >= b.minAge && currentAge <= b.maxAge
            return (
              <div
                key={b.label}
                className={cn(
                  'flex items-center justify-between px-4 py-2.5 text-xs font-mono transition-colors',
                  isActive
                    ? 'bg-[#1d3a6e]/30 text-[#60a5fa]'
                    : 'bg-[#07090f] text-[#4a5a7a] hover:text-[#64748b]'
                )}
              >
                <div className="flex items-center gap-2">
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />}
                  {!isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#1a2235]" />}
                  <span>{b.label}</span>
                  {!b.confirmed && (
                    <span className="text-[#2d3d55] text-[10px]">est.</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#3b82f6]' : 'text-[#334155]'}>
                    {formatUSD(b.ecv / USD_TO_ECV)}
                  </span>
                  <span className={isActive ? 'font-semibold text-[#60a5fa]' : ''}>
                    {formatECV(b.ecv)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Pie Chart (SVG)
// ─────────────────────────────────────────────
function PieChart({ results }) {
  const segments = [
    { label: 'Veículo + Envio', value: (results.carValueUSD + results.freightUSD + results.insuranceUSD) * results.exchangeRate, color: '#3b82f6' },
    { label: 'Dir. Importação', value: results.diECV, color: '#8b5cf6' },
    { label: 'ICE', value: results.iceECV, color: '#ef4444' },
    { label: 'IVA', value: results.ivaECV, color: '#f59e0b' },
    { label: 'Despachante', value: results.despachanteMidECV, color: '#10b981' },
  ]

  const total = segments.reduce((s, seg) => s + seg.value, 0)
  let cumAngle = -Math.PI / 2

  const arcs = segments.map(seg => {
    const pct = seg.value / total
    const startAngle = cumAngle
    cumAngle += pct * Math.PI * 2
    const endAngle = cumAngle

    const r = 70
    const cx = 90; const cy = 90
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const largeArc = pct > 0.5 ? 1 : 0

    const d = `M${cx},${cy} L${x1},${y1} A${r},${r},0,${largeArc},1,${x2},${y2} Z`
    return { ...seg, d, pct }
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 180 180" className="w-40 h-40 flex-shrink-0">
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill={arc.color} opacity={0.85}
            className="hover:opacity-100 transition-opacity cursor-pointer"
          />
        ))}
        <circle cx="90" cy="90" r="42" fill="#07090f" />
        <text x="90" y="86" textAnchor="middle" fill="#e2e8f0"
          style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', fontWeight: 600 }}>
          TOTAL
        </text>
        <text x="90" y="100" textAnchor="middle" fill="#60a5fa"
          style={{ fontFamily: 'JetBrains Mono', fontSize: '9px' }}>
          {formatUSD(total / results.exchangeRate)}
        </text>
      </svg>
      <div className="flex flex-col gap-2 w-full">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: arc.color }} />
              <span className="text-xs text-[#64748b]">{arc.label}</span>
            </div>
            <span className="text-xs font-mono text-[#94a3b8]">
              {(arc.pct * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear()

export default function App() {
  const [carValue, setCarValue] = useState('')
  const [freight, setFreight] = useState('')
  const [carYear, setCarYear] = useState(CURRENT_YEAR - 2)
  const [exchangeRate, setExchangeRate] = useState(USD_TO_ECV)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [calculated, setCalculated] = useState(false)
  const [activeTab, setActiveTab] = useState('breakdown')
  const resultsRef = useRef(null)

  const results = useMemo(() => {
    const cv = parseFloat(carValue)
    const fr = parseFloat(freight)
    if (!cv || !fr || cv <= 0 || fr <= 0) return null
    return calculateImport({ carValueUSD: cv, freightUSD: fr, carYear, exchangeRate })
  }, [carValue, freight, carYear, exchangeRate])

  const ageYears = CURRENT_YEAR - carYear

  function handleCalculate() {
    if (!results) return
    setCalculated(true)
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  function handleReset() {
    setCarValue('')
    setFreight('')
    setCarYear(CURRENT_YEAR - 2)
    setExchangeRate(USD_TO_ECV)
    setCalculated(false)
    setActiveTab('breakdown')
  }

  const isValid = results !== null

  return (
    <div className="min-h-screen bg-[#07090f] grid-bg">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-[#1d4ed8]/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-[#7c3aed]/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">

        {/* ── HEADER ── */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1a2235] bg-[#0d1117] px-4 py-1.5 text-xs font-mono text-[#4a5a7a] tracking-widest uppercase mb-6">
            <span>🇺🇸</span>
            <span className="text-[#1a2235]">—</span>
            <span>🇨🇻</span>
            <span className="text-[#1a2235] mx-1">·</span>
            Regime Geral de Importação
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#e2e8f0] mb-3 tracking-tight">
            CV Import{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]">
              Calc
            </span>
          </h1>
          <p className="text-[#4a5a7a] text-sm max-w-md mx-auto leading-relaxed">
            Calcula os impostos e custos de importação de viaturas para Cabo Verde — Mindelo, São Vicente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── FORM PANEL ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-[#1a2235] bg-[#0d1117] p-6 space-y-6">

              {/* Car value */}
              <div>
                <Label htmlFor="carValue">
                  <DollarSign size={10} className="inline mr-1" />
                  Preço do veículo
                </Label>
                <Input
                  id="carValue"
                  value={carValue}
                  onChange={e => setCarValue(e.target.value)}
                  placeholder="3000"
                  prefix="$"
                  suffix="USD"
                  min={100}
                />
              </div>

              {/* Freight */}
              <div>
                <Label htmlFor="freight">
                  <Ship size={10} className="inline mr-1" />
                  Frete Internacional
                </Label>
                <Input
                  id="freight"
                  value={freight}
                  onChange={e => setFreight(e.target.value)}
                  placeholder="800"
                  prefix="$"
                  suffix="USD"
                  min={100}
                />
              </div>

              {/* Year */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>
                    <Calendar size={10} className="inline mr-1" />
                    Ano do veículo
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#60a5fa]">{carYear}</span>
                    <Badge variant={ageYears <= 4 ? 'blue' : ageYears <= 7 ? 'amber' : ageYears <= 10 ? 'red' : 'red'}>
                      {ageYears} {ageYears === 1 ? 'ano' : 'anos'}
                    </Badge>
                  </div>
                </div>
                <Slider
                  value={carYear}
                  onChange={setCarYear}
                  min={CURRENT_YEAR - 30}
                  max={CURRENT_YEAR}
                />
                <div className="flex justify-between text-[10px] font-mono text-[#2d3d55] mt-1.5">
                  <span>{CURRENT_YEAR - 30}</span>
                  <span>{CURRENT_YEAR}</span>
                </div>

                {/* ICE tier indicator */}
                {results && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#07090f] border border-[#1a2235] px-3 py-2">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0',
                      ageYears <= 4 ? 'bg-[#3b82f6]' : ageYears <= 7 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                    )} />
                    <span className="text-xs text-[#64748b]">ICE aplicável:</span>
                    <span className="text-xs font-mono font-semibold text-[#c4cfdf] ml-auto">
                      {formatECV(results.iceECV)}
                    </span>
                  </div>
                )}
              </div>

              {/* Advanced */}
              <div>
                <button
                  onClick={() => setShowAdvanced(v => !v)}
                  className="flex items-center gap-2 text-xs font-mono text-[#334155] hover:text-[#4a5a7a] transition-colors"
                >
                  <ChevronDown size={12} className={cn('transition-transform', showAdvanced && 'rotate-180')} />
                  Opções avançadas
                </button>

                {showAdvanced && (
                  <div className="mt-4 pt-4 border-t border-[#111827] space-y-4 animate-fade-up">
                    <div>
                      <Label htmlFor="exchange">
                        <TrendingUp size={10} className="inline mr-1" />
                        Câmbio USD → ECV
                      </Label>
                      <Input
                        id="exchange"
                        value={exchangeRate}
                        onChange={e => setExchangeRate(parseFloat(e.target.value) || USD_TO_ECV)}
                        step={0.1}
                        min={90}
                        max={130}
                        suffix="ECV"
                      />
                      <p className="mt-1.5 text-[10px] font-mono text-[#2d3d55]">
                        Padrão: 103.7 (fixado ao EUR)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCalculate}
                  disabled={!isValid}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-display font-semibold transition-all duration-200',
                    isValid
                      ? 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg shadow-[#2563eb]/20 active:scale-95'
                      : 'bg-[#1a2235] text-[#2d3d55] cursor-not-allowed'
                  )}
                >
                  <Calculator size={15} />
                  Calcular
                </button>
                {calculated && (
                  <button
                    onClick={handleReset}
                    className="rounded-xl px-4 border border-[#1a2235] text-[#4a5a7a] hover:text-[#64748b] hover:border-[#334155] transition-all"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* ICE table */}
            {results && <IceTable currentAge={ageYears} />}

            {/* Warning card */}
            <div className="rounded-xl border border-[#f59e0b]/20 bg-[#78350f]/10 p-4">
              <div className="flex gap-3">
                <AlertTriangle size={14} className="text-[#fbbf24] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[#9ca3a8] leading-relaxed space-y-1">
                  <p>
                    <span className="text-[#fbbf24] font-medium">Reavaliação aduaneira:</span>{' '}
                    A alfândega pode contestar valores que considere abaixo do preço de mercado. Tenha sempre documentação justificativa (ex: título de salvado, relatório de danos).
                  </p>
                  <p className="text-[#4a5a7a]">ICE 0–4 anos confirmado por lei. Faixas superiores são estimativas baseadas no agravamento progressivo previsto na pauta.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RESULTS PANEL ── */}
          <div className="lg:col-span-3" ref={resultsRef}>
            {!calculated || !results ? (
              <div className="rounded-2xl border border-dashed border-[#1a2235] bg-[#0d1117]/50 h-full min-h-64 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[#111827] border border-[#1a2235] flex items-center justify-center">
                  <BarChart3 size={22} className="text-[#2d3d55]" />
                </div>
                <div>
                  <p className="text-[#334155] font-display text-sm font-semibold">Preenche os campos</p>
                  <p className="text-[#1e2d45] text-xs mt-1">Os resultados aparecem aqui após calcular</p>
                </div>
                <div className="flex items-center gap-2 text-[#1e2d45]">
                  <ArrowRight size={12} />
                  <span className="text-xs font-mono">Preço · Frete · Ano</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">

                {/* ── TOTAL HERO ── */}
                <div className="rounded-2xl border border-[#1e3a6e] bg-gradient-to-br from-[#0b1f40] via-[#0d2d5e]/60 to-[#0a1a35] p-6 result-animate glow-blue overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#1d4ed8]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <p className="text-xs font-mono tracking-widest text-[#4a6a9a] uppercase mb-1.5">
                          Custo Total Estimado
                        </p>
                        <p className="font-display text-4xl font-extrabold text-[#e8f0fe] tracking-tight">
                          {formatUSD(results.totalComDespachanteUSD)}
                        </p>
                        <p className="font-mono text-lg text-[#a78bfa] mt-1">
                          {formatECV(results.totalComDespachante)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="blue">
                          <Car size={10} />
                          {results.ageYears} anos
                        </Badge>
                        <Badge variant="purple">
                          ICE: {formatECV(results.iceECV)}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {[
                        { label: 'Carro + Envio', value: formatUSD(results.cifUSD), icon: Car },
                        { label: 'Só Impostos', value: formatUSD(results.totalImpostosUSD), icon: Landmark },
                        { label: 'Despachante', value: formatUSD(results.despachanteMidUSD), icon: FileText },
                      ].map((item, i) => (
                        <div key={i} className="rounded-xl bg-[#071530]/60 border border-[#1a2d4a] px-3 py-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <item.icon size={10} className="text-[#3b5a9a]" />
                            <span className="text-[10px] font-mono text-[#3b5a9a] uppercase tracking-wider">{item.label}</span>
                          </div>
                          <span className="font-mono text-sm font-semibold text-[#93c5fd]">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── TABS ── */}
                <div className="rounded-2xl border border-[#1a2235] bg-[#0d1117] overflow-hidden">
                  <div className="flex border-b border-[#111827]">
                    {[
                      { id: 'breakdown', label: 'Detalhes', icon: Receipt },
                      { id: 'chart', label: 'Gráfico', icon: BarChart3 },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'flex items-center gap-2 px-5 py-3.5 text-xs font-mono tracking-wider uppercase transition-colors',
                          activeTab === tab.id
                            ? 'text-[#60a5fa] border-b-2 border-[#2563eb] bg-[#111827]/50'
                            : 'text-[#334155] hover:text-[#4a5a7a]'
                        )}
                      >
                        <tab.icon size={12} />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    {activeTab === 'breakdown' && (
                      <div>
                        {/* CIF section */}
                        <p className="text-[10px] font-mono tracking-widest text-[#2d3d55] uppercase mb-3">
                          01 — Base de Cálculo (CIF)
                        </p>
                        <ResultRow icon={Car}    label="Preço do veículo"        usd={formatUSD(results.carValueUSD)} ecv={formatECV(results.carValueUSD * results.exchangeRate)} delay={0} />
                        <ResultRow icon={Ship}   label="Frete internacional"     usd={formatUSD(results.freightUSD)} ecv={formatECV(results.freightUSD * results.exchangeRate)} delay={50} />
                        <ResultRow icon={Wallet} label="Seguro (~1%)"            usd={formatUSD(results.insuranceUSD)} ecv={formatECV(results.insuranceUSD * results.exchangeRate)} delay={100} />
                        <div className="flex items-center justify-between py-2.5 mt-1 rounded-lg bg-[#111827] px-3 mb-4">
                          <span className="text-xs font-mono text-[#4a5a7a] uppercase tracking-widest">Valor CIF</span>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-[#60a5fa]">{formatUSD(results.cifUSD)}</span>
                            <span className="text-sm font-mono font-bold text-[#93c5fd]">{formatECV(results.cifECV)}</span>
                          </div>
                        </div>

                        {/* Impostos section */}
                        <p className="text-[10px] font-mono tracking-widest text-[#2d3d55] uppercase mb-3">
                          02 — Impostos Aduaneiros
                        </p>
                        <ResultRow icon={Landmark} label="Direito de Importação (DI)" note="20% CIF"          variant="blue"   usd={formatUSD(results.diUSD)}   ecv={formatECV(results.diECV)}   delay={150} />
                        <ResultRow icon={TrendingUp} label={`ICE — ${results.iceBracket.label}`}               variant="red"    usd={formatUSD(results.iceUSD)}  ecv={formatECV(results.iceECV)}  delay={200}
                          note={results.iceBracket.confirmed ? '✓ confirmado' : 'est.'}
                        />
                        <ResultRow icon={Receipt}   label="IVA" note="15% × (CIF + DI + ICE)"                 variant="amber"  usd={formatUSD(results.ivaUSD)}  ecv={formatECV(results.ivaECV)}  delay={250} />
                        <ResultRow icon={FileText}  label="Taxa Estatística Aduaneira (TEA)"                  variant="default" usd={formatUSD(results.teaUSD)} ecv={formatECV(results.teaECV)}  delay={300} />

                        <div className="flex items-center justify-between py-2.5 mt-1 rounded-lg bg-[#111827] px-3 mb-4">
                          <span className="text-xs font-mono text-[#4a5a7a] uppercase tracking-widest">Total Impostos</span>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-[#f87171]">{formatUSD(results.totalImpostosUSD)}</span>
                            <span className="text-sm font-mono font-bold text-[#fca5a5]">{formatECV(results.totalImpostosECV)}</span>
                          </div>
                        </div>

                        {/* Despachante section */}
                        <p className="text-[10px] font-mono tracking-widest text-[#2d3d55] uppercase mb-3">
                          03 — Serviços
                        </p>
                        <ResultRow icon={FileText} label="Honorários do Despachante"
                          note={`${formatECV(results.despachanteMinECV)} – ${formatECV(results.despachanteMaxECV)}`}
                          variant="green"
                          usd={formatUSD(results.despachanteMidUSD)}
                          ecv={formatECV(results.despachanteMidECV)}
                          delay={350}
                        />

                        {/* GRAND TOTAL */}
                        <div className="mt-4 rounded-xl border border-[#a78bfa]/20 bg-gradient-to-r from-[#1a0d3a]/60 to-[#0a0d1a] px-4 py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-mono text-[#6b4fa0] uppercase tracking-widest">Total Geral</p>
                              <p className="text-xs text-[#4a3070] mt-0.5 font-mono">Veículo + Impostos + Despachante</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-base font-bold text-[#a78bfa]">{formatECV(results.totalComDespachante)}</p>
                              <p className="font-mono text-sm text-[#7c5cbf]">{formatUSD(results.totalComDespachanteUSD)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Ratio insight */}
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#0d1117] border border-[#1a2235] px-3 py-2.5">
                          <Info size={12} className="text-[#334155] flex-shrink-0" />
                          <p className="text-[11px] text-[#334155]">
                            Os impostos representam{' '}
                            <span className="text-[#f87171] font-semibold">
                              {((results.totalImpostosECV / (results.cifECV + results.totalImpostosECV + results.despachanteMidECV)) * 100).toFixed(0)}%
                            </span>{' '}
                            do custo total de importação.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'chart' && (
                      <div className="animate-fade-up">
                        <p className="text-xs font-mono text-[#2d3d55] uppercase tracking-widest mb-5">
                          Distribuição dos Custos
                        </p>
                        <PieChart results={results} />
                        <div className="mt-6 space-y-2">
                          {[
                            { label: 'Veículo + Envio + Seguro', ecv: (results.carValueUSD + results.freightUSD + results.insuranceUSD) * results.exchangeRate, color: '#3b82f6' },
                            { label: 'Dir. Importação (DI 20%)', ecv: results.diECV, color: '#8b5cf6' },
                            { label: `ICE (${results.iceBracket.label})`, ecv: results.iceECV, color: '#ef4444' },
                            { label: 'IVA (15%)', ecv: results.ivaECV, color: '#f59e0b' },
                            { label: 'TEA + Despachante', ecv: results.teaECV + results.despachanteMidECV, color: '#10b981' },
                          ].map((item, i) => {
                            const total = results.totalComDespachante
                            const pct = (item.ecv / total) * 100
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-[#64748b] truncate">{item.label}</span>
                                    <span className="font-mono text-[#94a3b8] ml-2 flex-shrink-0">{pct.toFixed(1)}%</span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-[#111827] overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-700"
                                      style={{ width: `${pct}%`, background: item.color, opacity: 0.8 }}
                                    />
                                  </div>
                                </div>
                                <span className="text-xs font-mono text-[#4a5a7a] w-28 text-right flex-shrink-0">
                                  {formatECV(item.ecv)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nota câmbio */}
                <p className="text-center text-[10px] font-mono text-[#1e2d45]">
                  Câmbio: 1 USD = {results.exchangeRate.toFixed(1)} ECV · Estimativa · Maio 2026
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-12 pt-6 border-t border-[#0f1825] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-[#1e2d45]">
          <span>CV IMPORT CALC · Alfândega do Mindelo · São Vicente</span>
          <span>DGA · Regime Geral · Não Emigrante</span>
        </div>
      </div>
    </div>
  )
}
