import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type Investment = {
  id: string;
  banco: string;
  tipo: string;
  valor: number;
  liquidez: 'diaria' | 'prazo';
  vencimento?: string | null;
};

type InvestmentCardProps = {
  item: Investment;
};

export function InvestmentCard({ item }: InvestmentCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.bank}>{item.banco}</Text>
        <Text style={styles.value}>R$ {item.valor.toFixed(2)}</Text>
      </View>
      <Text style={styles.type}>{item.tipo}</Text>
      <Text style={styles.meta}>
        Liquidez: {item.liquidez === 'diaria' ? 'Diária' : 'No prazo'}
        {item.vencimento ? ` • Vencimento ${item.vencimento}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0b1220',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2a44'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bank: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600'
  },
  value: {
    color: '#38bdf8',
    fontWeight: '700'
  },
  type: {
    color: '#e2e8f0',
    marginTop: 8,
    fontSize: 14
  },
  meta: {
    color: '#94a3b8',
    marginTop: 4,
    fontSize: 12
  }
});
