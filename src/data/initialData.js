export const INITIAL_PARTNERS = ['Fabio', 'Luiz'];

export const DEFAULT_EXCHANGE_RATE = 5.50;

export const INITIAL_MONTHS = [
  { key: '2026-07', label: 'Julho / 2026' },
  { key: '2026-08', label: 'Agosto / 2026' },
  { key: '2026-09', label: 'Setembro / 2026' },
  { key: '2026-10', label: 'Outubro / 2026' },
  { key: '2026-11', label: 'Novembro / 2026' },
  { key: '2026-12', label: 'Dezembro / 2026' },
];

export const INITIAL_REVENUES = {
  '2026-07': [
    { id: 'rev-7-1', channel: 'Gaebe BS', faturamentoUSD: 0, cambio: 5.50, porcentagemViral: 100 },
    { id: 'rev-7-2', channel: 'Geludo', faturamentoUSD: 0, cambio: 5.50, porcentagemViral: 100 },
    { id: 'rev-7-3', channel: 'Inemafoo', faturamentoUSD: 0, cambio: 5.50, porcentagemViral: 100 },
    { id: 'rev-7-4', channel: 'Chapéus de Palha', faturamentoUSD: 0, cambio: 5.50, porcentagemViral: 100 },
    { id: 'rev-7-5', channel: 'Jovem Otaku', faturamentoUSD: 0, cambio: 5.50, porcentagemViral: 100 },
    { id: 'rev-7-6', channel: 'Hashira no Sekai', faturamentoUSD: 0, cambio: 5.50, porcentagemViral: 100 },
  ],
  '2026-08': [],
  '2026-09': []
};

export const INITIAL_EXPENSES = {
  '2026-09': [
    { id: 'exp-9-1', vencimento: '2026-09-01', descricao: 'Contabilidade', categoria: 'Fixo', pagoPor: 'Fabio', valorBRL: 280.00 },
    { id: 'exp-9-2', vencimento: '2026-09-01', descricao: 'Heygen Creator', categoria: 'Fixo', pagoPor: 'Fabio', valorBRL: 150.00 },
    { id: 'exp-9-3', vencimento: '2026-09-01', descricao: 'Heygen Mensal 5USD', categoria: 'Fixo', pagoPor: 'Fabio', valorBRL: 25.00 },
    { id: 'exp-9-4', vencimento: '2026-09-01', descricao: 'Heygen Mensal G2G', categoria: 'Fixo', pagoPor: 'Luiz', valorBRL: 90.00 },
    { id: 'exp-9-5', vencimento: '2026-09-01', descricao: 'ADS Power', categoria: 'Fixo', pagoPor: 'Luiz', valorBRL: 40.00 },
    { id: 'exp-9-6', vencimento: '2026-09-01', descricao: 'SCAM', categoria: 'Variável', pagoPor: 'Luiz', valorBRL: 210.00 },
    { id: 'exp-9-7', vencimento: '2026-09-01', descricao: 'Oxylabs (Proxy)', categoria: 'Fixo', pagoPor: 'Luiz', valorBRL: 90.00 },
  ]
};

export const INITIAL_RECIPIENTS = {
  '2026-07': [],
  '2026-08': [],
  '2026-09': []
};
