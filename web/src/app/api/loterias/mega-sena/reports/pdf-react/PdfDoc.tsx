import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

type ContestRow = { contestNo: number; checkedAt: string; total: number; c4: number; c5: number; c6: number; hitRate: number };

// Palette
const COLORS = {
  vinho: '#2b0a0e',
  black: '#000000',
  gray: '#474747',
  border: '#e5e7eb',
  zebra: '#f6f7f9',
  muted: '#6b7280',
  green: '#16a34a',
};

// Fonts (Roboto regular/bold via Google)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf' }, // Regular
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc9.ttf', fontWeight: 'bold' }, // Bold
  ],
});

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, color: '#111827' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.vinho,
    paddingBottom: 8,
    marginBottom: 12,
  },
  brandBox: { flexDirection: 'row', alignItems: 'center' },
  brand: { fontSize: 12, fontWeight: 700, letterSpacing: 2, color: COLORS.vinho, fontFamily: 'Roboto' },
  muted: { color: COLORS.muted, fontFamily: 'Roboto' },
  headerInfo: { color: COLORS.muted, fontFamily: 'Roboto', fontSize: 7 }, /* ~3pt menor que o padrão */
  kpis: { flexDirection: 'row', flexWrap: 'nowrap', marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 6,
    flexGrow: 1,
    flexBasis: 0,
    marginRight: 6,
  },
  label: { fontSize: 8, color: COLORS.gray, fontFamily: 'Roboto' },
  value: { fontSize: 12, fontWeight: 700, fontFamily: 'Roboto' },
  tableHeader: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#fafafa',
  },
  th: { paddingVertical: 6, paddingHorizontal: 10, fontWeight: 600, color: COLORS.gray, fontFamily: 'Roboto' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  td: { paddingVertical: 6, paddingHorizontal: 10, fontFamily: 'Roboto' },
  tdRight: { textAlign: 'right' as const },
  zebra: { backgroundColor: COLORS.zebra },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 18,
    fontSize: 8,
    color: COLORS.muted,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logo: { width: 40, height: 18, objectFit: 'contain' as const, marginRight: 0 },
});

function HRow({
  children,
  widths,
  aligns,
  flexLast,
}: {
  children: React.ReactNode[];
  widths: number[];
  aligns?: ('left' | 'right')[];
  flexLast?: boolean;
}) {
  return (
    <View style={styles.tableHeader}>
      {children.map((c, i) => (
        <View
          key={i}
          style={
            flexLast && i === children.length - 1
              ? { flexGrow: 1 }
              : { width: widths[i] }
          }
        >
          <Text
            style={[
              styles.th,
              aligns?.[i] === 'right' ? { textAlign: 'right' as const } : null,
            ]}
          >
            {c as any}
          </Text>
        </View>
      ))}
    </View>
  );
}
function TRow({
  children,
  widths,
  zebra,
  flexLast,
}: {
  children: React.ReactNode[];
  widths: number[];
  zebra?: boolean;
  flexLast?: boolean;
}) {
  return (
    <View style={[styles.row, zebra ? styles.zebra : null]}>
      {children.map((c, i) => (
        <View
          key={i}
          style={
            flexLast && i === children.length - 1
              ? { flexGrow: 1 }
              : { width: widths[i] }
          }
        >
          <Text style={styles.td}>{c as any}</Text>
        </View>
      ))}
    </View>
  );
}

export function buildAggregateDoc(
  kpis: { totalConferences: number; totalBets: number; avgPerCheck: number; c4: number; c5: number; c6: number; hitRate: number },
  rows: ContestRow[],
  opts?: { logoSrc?: string },
) {
  return (
    <Document title='Relatório geral — Mega‑Sena'>
      <Page size='A4' style={styles.page}>
        <View style={styles.headerBar}>
          <View style={styles.brandBox}>
            {opts?.logoSrc ? <Image src={opts.logoSrc} style={styles.logo} /> : null}
            <Text style={styles.brand}>ALEARA</Text>
          </View>
          <Text style={styles.headerInfo}>Relatório geral — Mega‑Sena • {new Date().toLocaleString('pt-BR')}</Text>
        </View>
        <View style={styles.kpis}>
          <View style={styles.card}><Text style={styles.label}>Conferências</Text><Text style={styles.value}>{kpis.totalConferences}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Apostas</Text><Text style={styles.value}>{kpis.totalBets}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Média/conferência</Text><Text style={styles.value}>{kpis.avgPerCheck.toFixed(1)}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Acertos 4</Text><Text style={styles.value}>{kpis.c4}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Acertos 5</Text><Text style={styles.value}>{kpis.c5}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Acertos 6</Text><Text style={styles.value}>{kpis.c6}</Text></View>
        </View>
        {/* Header with spacer before last to push "Taxa" to the right edge */}
        <View style={styles.tableHeader}>
          <View style={{ width: 70 }}><Text style={styles.th}>Concurso</Text></View>
          <View style={{ width: 120 }}><Text style={styles.th}>Conferido em</Text></View>
          <View style={{ width: 70 }}><Text style={[styles.th, styles.tdRight]}>Apostas</Text></View>
          <View style={{ width: 30 }}><Text style={[styles.th, styles.tdRight]}>4</Text></View>
          <View style={{ width: 30 }}><Text style={[styles.th, styles.tdRight]}>5</Text></View>
          <View style={{ width: 30 }}><Text style={[styles.th, styles.tdRight]}>6</Text></View>
          <View style={{ flexGrow: 1 }} />
          <View style={{ width: 70 }}><Text style={[styles.th, styles.tdRight]}>Taxa</Text></View>
        </View>
        {rows.map((r, idx) => (
          <View key={`${r.contestNo}-${r.checkedAt}`} style={[styles.row, idx % 2 === 1 ? styles.zebra : null]}>
            <View style={{ width: 70 }}><Text style={styles.td}>{r.contestNo}</Text></View>
            <View style={{ width: 120 }}><Text style={styles.td}>{new Date(r.checkedAt).toLocaleString('pt-BR')}</Text></View>
            <View style={{ width: 70 }}><Text style={[styles.td, styles.tdRight]}>{r.total}</Text></View>
            <View style={{ width: 30 }}><Text style={[styles.td, styles.tdRight]}>{r.c4}</Text></View>
            <View style={{ width: 30 }}><Text style={[styles.td, styles.tdRight]}>{r.c5}</Text></View>
            <View style={{ width: 30 }}><Text style={[styles.td, styles.tdRight, { color: COLORS.green }]}>{r.c6}</Text></View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ width: 70 }}><Text style={[styles.td, styles.tdRight]}>{(r.hitRate * 100).toFixed(1)}%</Text></View>
          </View>
        ))}
        <View style={styles.footer} fixed>
          <Text style={styles.muted}>© {new Date().getFullYear()} ALEARA. Todos os direitos reservados.</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function buildContestDoc(
  contestNo: number,
  draw: number[],
  kpis: { total: number; c4: number; c5: number; c6: number; hitRate: number },
  rows: { position: number; numbers: number[]; matches: number }[],
  opts?: { logoSrc?: string },
) {
  const formatNumbers = (nums: number[]) => (nums ?? []).map((n) => String(n).padStart(2, '0')).join(', ');
  return (
    <Document title={`Relatório do concurso ${contestNo} — Mega‑Sena`}>
      <Page size='A4' style={styles.page}>
        <View style={styles.headerBar}>
          <View style={styles.brandBox}>
            {opts?.logoSrc ? <Image src={opts.logoSrc} style={styles.logo} /> : null}
            <Text style={styles.brand}>ALEARA</Text>
          </View>
          <Text style={styles.headerInfo}>Relatório por concurso — Mega‑Sena • {new Date().toLocaleString('pt-BR')}</Text>
        </View>
        <Text style={[styles.muted, { marginBottom: 8 }]}>
          Concurso: <Text>{contestNo}</Text> • Sorteio: <Text>{formatNumbers(draw)}</Text>
        </Text>
        <View style={styles.kpis}>
          <View style={styles.card}><Text style={styles.label}>Apostas</Text><Text style={styles.value}>{kpis.total}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Acertos 4</Text><Text style={styles.value}>{kpis.c4}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Acertos 5</Text><Text style={styles.value}>{kpis.c5}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Acertos 6</Text><Text style={styles.value}>{kpis.c6}</Text></View>
          <View style={styles.card}><Text style={styles.label}>Taxa</Text><Text style={styles.value}>{(kpis.hitRate * 100).toFixed(1)}%</Text></View>
        </View>
        <HRow
          widths={[30, 70, 300, 60]}
          aligns={['left', 'left', 'left', 'right']}
        >
          {[
          <Text key='0'>#</Text>,
          <Text key='1'>Posição</Text>,
          <Text key='2'>Dezenas</Text>,
          <Text key='3'>Acertos</Text>,
        ]}
        </HRow>
        {rows.map((r, idx) => (
          <TRow key={`${r.position}-${idx}`} widths={[30, 70, 300, 60]} zebra={idx % 2 === 1}>
            {[
              <Text key='0'>{idx + 1}</Text>,
              <Text key='1'>( {r.position} )</Text>,
              <Text key='2'>{formatNumbers(r.numbers)}</Text>,
              <Text key='3' style={styles.tdRight}>{r.matches}</Text>,
            ]}
          </TRow>
        ))}
        <View style={styles.footer} fixed>
          <Text style={styles.muted}>© {new Date().getFullYear()} ALEARA. Todos os direitos reservados.</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}


