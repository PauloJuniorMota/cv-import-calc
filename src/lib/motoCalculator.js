/**
 * Calculadora de Impostos — Importação de Motociclos da Europa para Cabo Verde
 * Regime Geral (não emigrante) · Alfândega do Mindelo, São Vicente
 *
 * Diferenças chave vs. carros:
 * - Moeda base: EUR (fixado ao ECV: 1 EUR = 110.265 ECV)
 * - ICE baseado em cilindrada para 0–4 anos (taxa fixa por segmento)
 * - ICE percentual sobre CIF para veículos +4 anos (agravamento progressivo)
 * - Frete varia por país de origem europeu
 */

// ─── Câmbios ──────────────────────────────────────────────────────────────────
export const CURRENCIES = {
  EUR: { label: 'Euro', symbol: '€', flag: '🇪🇺', toECV: 110.265 },  // fixo
  GBP: { label: 'Libra (GBP)', symbol: '£', flag: '🇬🇧', toECV: 140.2 }, // aprox.
  CHF: { label: 'Franco Suíço', symbol: 'CHF', flag: '🇨🇭', toECV: 117.8 }, // aprox.
  SEK: { label: 'Coroa Sueca', symbol: 'kr', flag: '🇸🇪', toECV: 9.85 }, // aprox.
  DKK: { label: 'Coroa Dinamarquesa', symbol: 'kr', flag: '🇩🇰', toECV: 14.8 }, // aprox.
}

// ─── Países de origem e fretes estimados ──────────────────────────────────────
export const EUROPEAN_COUNTRIES = [
  {
    code: 'PT', flag: '🇵🇹', name: 'Portugal',
    currency: 'EUR',
    ports: 'Lisboa / Leixões',
    freightMin: 300, freightMax: 500, freightMid: 400,
    notes: 'Rota mais directa, ligações semanais para Mindelo',
  },
  {
    code: 'ES', flag: '🇪🇸', name: 'Espanha',
    currency: 'EUR',
    ports: 'Barcelona / Sevilha',
    freightMin: 450, freightMax: 650, freightMid: 550,
    notes: 'Transporte rodoviário curto até Lisboa ou embarque directo',
  },
  {
    code: 'FR', flag: '🇫🇷', name: 'França',
    currency: 'EUR',
    ports: 'Le Havre / Marselha',
    freightMin: 550, freightMax: 750, freightMid: 650,
    notes: 'Frequente escala em Lisboa, trânsito 10–14 dias',
  },
  {
    code: 'DE', flag: '🇩🇪', name: 'Alemanha',
    currency: 'EUR',
    ports: 'Hamburgo / Bremen',
    freightMin: 650, freightMax: 950, freightMid: 800,
    notes: 'Melhor mercado de motas usadas da Europa',
  },
  {
    code: 'NL', flag: '🇳🇱', name: 'Holanda',
    currency: 'EUR',
    ports: 'Roterdão',
    freightMin: 600, freightMax: 850, freightMid: 725,
    notes: 'Hub logístico europeu, boas opções de grupagem',
  },
  {
    code: 'IT', flag: '🇮🇹', name: 'Itália',
    currency: 'EUR',
    ports: 'Génova / Nápoles',
    freightMin: 550, freightMax: 750, freightMid: 650,
    notes: 'Via Mediterrâneo, escala frequente em Lisboa',
  },
  {
    code: 'BE', flag: '🇧🇪', name: 'Bélgica',
    currency: 'EUR',
    ports: 'Antuérpia',
    freightMin: 600, freightMax: 850, freightMid: 725,
    notes: 'Hub de transporte, boas ligações para África',
  },
  {
    code: 'GB', flag: '🇬🇧', name: 'Reino Unido',
    currency: 'GBP',
    ports: 'Southampton / Tilbury',
    freightMin: 700, freightMax: 1000, freightMid: 850,
    notes: 'Pós-Brexit: documentação adicional exigida',
  },
  {
    code: 'CH', flag: '🇨🇭', name: 'Suíça',
    currency: 'CHF',
    ports: 'Génova / Basileia (via FR)',
    freightMin: 700, freightMax: 1000, freightMid: 850,
    notes: 'Fora da UE: necessita declaração de exportação adicional',
  },
  {
    code: 'SE', flag: '🇸🇪', name: 'Suécia',
    currency: 'SEK',
    ports: 'Gotemburgo',
    freightMin: 750, freightMax: 1100, freightMid: 925,
    notes: 'Trânsito mais longo, via Hamburgo ou Roterdão',
  },
  {
    code: 'DK', flag: '🇩🇰', name: 'Dinamarca',
    currency: 'DKK',
    ports: 'Copenhaga / Aarhus',
    freightMin: 700, freightMax: 1000, freightMid: 850,
    notes: 'Via Hamburgo para conexão com Mindelo',
  },
]

// ─── Segmentos de cilindrada ──────────────────────────────────────────────────
export const DISPLACEMENT_SEGMENTS = [
  { id: 'micro',  label: '≤ 125 cc',     sublabel: 'Scooter / 125', range: '≤125cc',   icon: '🛵' },
  { id: 'small',  label: '126 – 300 cc', sublabel: 'Mota entrada',  range: '126–300cc', icon: '🏍️' },
  { id: 'medium', label: '301 – 500 cc', sublabel: 'Mota média',    range: '301–500cc', icon: '🏍️' },
  { id: 'large',  label: '501 – 800 cc', sublabel: 'Mota grande',   range: '501–800cc', icon: '🏍️' },
  { id: 'xlarge', label: '+ 800 cc',     sublabel: 'Big bike',      range: '>800cc',    icon: '🏍️' },
]

// ─── Taxas fixas ──────────────────────────────────────────────────────────────
export const MOTO_DI_RATE    = 0.30   // 30% do CIF (HS 8711 — pauta REMPE)
export const MOTO_TC_RATE    = 0.005  // 0.5% do CIF
export const MOTO_IVA_RATE   = 0.15   // 15%
export const MOTO_INSURANCE_RATE = 0.01 // ~1% do valor
export const MOTO_TEA_ECV    = 5_500

/**
 * Honorários do Despachante para motos — tabela oficial
 * - Até 250 cc (micro: ≤125cc) → 1.000$
 * - Superior a 250 cc               → 2.000$
 */
export function calculateMotoDespachante(displacementId) {
  return displacementId === 'micro' ? 1_000 : 2_000
}

// ─── Funções auxiliares ───────────────────────────────────────────────────────

export function getDisplacementSegment(id) {
  return DISPLACEMENT_SEGMENTS.find(s => s.id === id) || DISPLACEMENT_SEGMENTS[2]
}

export function getCountry(code) {
  return EUROPEAN_COUNTRIES.find(c => c.code === code) || EUROPEAN_COUNTRIES[0]
}

// ICE para motociclos = isento pela pauta aduaneira (HS 8711)
export function getIceForMoto() {
  return { ecv: 0, isFixed: true, pct: null }
}

/**
 * Calcula todos os custos de importação de uma mota da Europa para Cabo Verde
 */
export function calculateMotoImport({
  motoValueLocal,   // valor em moeda local (EUR, GBP, CHF, etc.)
  freightLocal,     // frete em moeda local
  motoYear,         // ano do veículo
  countryCode,      // código do país (PT, DE, FR, etc.)
  displacementId,   // id do segmento de cilindrada
  customFreight,    // frete personalizado (opcional, sobrescreve o estimado)
}) {
  const currentYear = new Date().getFullYear()
  const ageYears = currentYear - motoYear
  const country = getCountry(countryCode)
  const segment = getDisplacementSegment(displacementId)
  const currency = CURRENCIES[country.currency]
  const toECV = currency.toECV

  const freightLocalFinal = customFreight !== null && customFreight !== undefined
    ? customFreight
    : country.freightMid

  // CIF em moeda local
  const insuranceLocal = motoValueLocal * MOTO_INSURANCE_RATE
  const cifLocal = motoValueLocal + freightLocalFinal + insuranceLocal
  const cifECV = cifLocal * toECV

  // Direito de Importação
  const diECV = cifECV * MOTO_DI_RATE
  const diLocal = diECV / toECV

  // TC (Taxa de Chancelaria)
  const tcECV = cifECV * MOTO_TC_RATE
  const tcLocal = tcECV / toECV

  // ICE — isento para motociclos (HS 8711)
  const iceResult = { ecv: 0, isFixed: true, pct: null }
  const iceECV = 0
  const iceLocal = 0

  // IVA
  const ivaBaseECV = cifECV + diECV + tcECV
  const ivaECV = ivaBaseECV * MOTO_IVA_RATE
  const ivaLocal = ivaECV / toECV

  // TEA
  const teaECV = MOTO_TEA_ECV
  const teaLocal = teaECV / toECV

  // Despachante
  const despachanteECV = calculateMotoDespachante(displacementId)
  const despachanteMinECV = despachanteECV
  const despachanteMidECV = despachanteECV
  const despachanteMaxECV = despachanteECV
  const despachanteMidLocal = despachanteECV / toECV

  // Totais
  const totalImpostosECV = diECV + tcECV + ivaECV + teaECV
  const totalImpostosLocal = totalImpostosECV / toECV

  const totalSemDespachante = cifECV + totalImpostosECV
  const totalComDespachante = totalSemDespachante + despachanteMidECV
  const totalComDespachanteLocal = totalComDespachante / toECV

  return {
    // Inputs
    motoValueLocal, freightLocalFinal, motoYear, ageYears,
    countryCode, country, segment, currency, toECV,

    // CIF
    insuranceLocal, cifLocal, cifECV,

    // DI
    diECV, diLocal, diRate: MOTO_DI_RATE,

    // TC
    tcECV, tcLocal, tcRate: MOTO_TC_RATE,

    // ICE
    iceECV, iceLocal, iceResult,

    // IVA
    ivaBaseECV, ivaECV, ivaLocal, ivaRate: MOTO_IVA_RATE,

    // TEA
    teaECV, teaLocal,

    // Despachante
    despachanteMinECV, despachanteMidECV, despachanteMaxECV, despachanteMidLocal,

    // Totais
    totalImpostosECV, totalImpostosLocal,
    totalSemDespachante,
    totalComDespachante,
    totalComDespachanteLocal,
  }
}

// ─── Formatação ───────────────────────────────────────────────────────────────
export function formatECV(v) {
  return new Intl.NumberFormat('pt-CV', { maximumFractionDigits: 0 }).format(Math.round(v)) + '$00'
}

export function formatLocal(v, symbol) {
  return symbol + new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Math.round(v))
}
