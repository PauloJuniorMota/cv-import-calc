/**
 * Calculadora de Impostos — Importação de Viaturas para Cabo Verde
 * Regime Geral (não emigrante)
 *
 * Fontes:
 * - Decreto-Lei nº 46/2017 (pauta aduaneira CV)
 * - Lei do Orçamento do Estado de Cabo Verde (ICE taxa específica)
 * - DGA — Direção Geral das Alfândegas de Cabo Verde
 *
 * Câmbio de referência: 1 USD = 103.7 ECV (fixado ao EUR: 1 EUR = 110.265 ECV)
 */

export const USD_TO_ECV = 94.89

/**
 * ICE — Imposto sobre Consumo Especial
 * Taxa específica por faixa etária do veículo (gasolina/gasóleo)
 * Valores em ECV (escudos cabo-verdianos)
 *
 * Nota: Para veículos 0–4 anos a taxa de 200.000$00 é confirmada por lei.
 * As faixas seguintes são baseadas no agravamento progressivo previsto na pauta.
 */
export const ICE_BRACKETS = [
  { label: '0 – 4 anos',  minAge: 0,  maxAge: 4,  ecv: 200_000, confirmed: true },
  { label: '5 – 7 anos',  minAge: 5,  maxAge: 7,  ecv: 300_000, confirmed: false },
  { label: '8 – 10 anos', minAge: 8,  maxAge: 10, ecv: 450_000, confirmed: false },
  { label: '11 – 15 anos',minAge: 11, maxAge: 15, ecv: 600_000, confirmed: false },
  { label: '+ 15 anos',   minAge: 16, maxAge: 99, ecv: 800_000, confirmed: false },
]

/**
 * Direito de Importação — taxa sobre valor CIF
 * Automóveis de passageiros (HS 8703) — regime geral
 */
export const DI_RATE = 0.20  // 20% do CIF

/**
 * IVA — Imposto sobre o Valor Acrescentado
 * Calculado sobre (CIF + DI + ICE)
 */
export const IVA_RATE = 0.15  // 15%

/**
 * Taxa de Chancelaria (TC)
 * 0.5% do CIF
 */
export const TC_RATE = 0.005

/**
 * Honorários do Despachante — tabela de honorários oficial
 * - CIF ≤ 500.000 ECV  → 3.500 ECV
 * - CIF ≤ 1.000.000 ECV → 5.000 ECV
 * - CIF > 1.000.000 ECV → CIF × 0.5%
 */
export function calculateDespachante(cifECV) {
  if (cifECV <= 500_000) return 3_500
  if (cifECV <= 1_000_000) return 5_000
  return cifECV * 0.005
}

/**
 * Taxa Estatística Aduaneira
 */
export const TEA_ECV = 5_500

/**
 * Seguro estimado (~1% do valor do veículo)
 */
export const INSURANCE_RATE = 0.01

/**
 * Honorários do despachante (estimativa mercado Mindelo)
 * Min: veículos simples / Max: documentação complexa
 */
export const DESPACHANTE_MIN_ECV = 15_000
export const DESPACHANTE_MAX_ECV = 25_000

/**
 * Retorna a faixa de ICE para a idade do veículo
 */
export function getIceBracket(ageYears) {
  return ICE_BRACKETS.find(b => ageYears >= b.minAge && ageYears <= b.maxAge) || ICE_BRACKETS[ICE_BRACKETS.length - 1]
}

/**
 * Calcula todos os impostos e custos de importação
 *
 * @param {Object} params
 * @param {number} params.carValueUSD     - Preço de compra do veículo (USD)
 * @param {number} params.freightUSD      - Custo do frete (USD)
 * @param {number} params.carYear         - Ano do veículo
 * @param {number} [params.exchangeRate]  - Taxa de câmbio USD→ECV (default: 103.7)
 * @returns {Object} Todos os valores calculados
 */
export function calculateImport({ carValueUSD, freightUSD, carYear, exchangeRate = USD_TO_ECV }) {
  const currentYear = new Date().getFullYear()
  const ageYears = currentYear - carYear

  // — CIF —
  const insuranceUSD = carValueUSD * INSURANCE_RATE
  const cifUSD = carValueUSD + freightUSD + insuranceUSD
  const cifECV = cifUSD * exchangeRate

  // — Direito de Importação —
  const diECV = cifECV * DI_RATE
  const diUSD = diECV / exchangeRate

  // — TC (Taxa de Chancelaria) —
  const tcECV = cifECV * TC_RATE
  const tcUSD = tcECV / exchangeRate

  // — ICE —
  const iceBracket = getIceBracket(ageYears)
  const iceECV = iceBracket.ecv
  const iceUSD = iceECV / exchangeRate

  // — IVA —
  const ivaBaseECV = cifECV + diECV + tcECV + iceECV
  const ivaECV = ivaBaseECV * IVA_RATE
  const ivaUSD = ivaECV / exchangeRate

  // — TEA —
  const teaECV = TEA_ECV
  const teaUSD = teaECV / exchangeRate

  // — Despachante —
  const despachanteECV = calculateDespachante(cifECV)
  const despachanteMinECV = despachanteECV
  const despachanteMidECV = despachanteECV
  const despachanteMaxECV = despachanteECV
  const despachanteMidUSD = despachanteECV / exchangeRate

  // — Totais —
  const totalImpostosECV = diECV + tcECV + iceECV + ivaECV + teaECV
  const totalImpostosUSD = totalImpostosECV / exchangeRate

  const totalSemDespachante = (carValueUSD + freightUSD + insuranceUSD) * exchangeRate + totalImpostosECV
  const totalComDespachante = totalSemDespachante + despachanteMidECV

  return {
    // Inputs
    carValueUSD,
    freightUSD,
    carYear,
    ageYears,
    exchangeRate,

    // CIF
    insuranceUSD,
    cifUSD,
    cifECV,

    // DI
    diECV,
    diUSD,
    diRate: DI_RATE,

    // TC
    tcECV,
    tcUSD,
    tcRate: TC_RATE,

    // ICE
    iceBracket,
    iceECV,
    iceUSD,

    // IVA
    ivaBaseECV,
    ivaECV,
    ivaUSD,
    ivaRate: IVA_RATE,

    // TEA
    teaECV,
    teaUSD,

    // Despachante
    despachanteMinECV,
    despachanteMidECV,
    despachanteMaxECV,
    despachanteMidUSD,

    // Totais
    totalImpostosECV,
    totalImpostosUSD,
    totalSemDespachante,
    totalComDespachante,
    totalComDespachanteUSD: totalComDespachante / exchangeRate,
  }
}

/**
 * Formata número em escudos cabo-verdianos
 */
export function formatECV(value) {
  return new Intl.NumberFormat('pt-CV', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value)) + '$00'
}

/**
 * Formata número em dólares
 */
export function formatUSD(value) {
  return '$' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}
