import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Award, ShieldCheck, Download } from 'lucide-react-native';

export default function MobileCertificadosScreen() {
  const certs = [
    {
      id: '1',
      title: 'I Simpósio de Tecnologia e Inovação da Amazônia - IFAM 2026',
      hours: '5.5 horas',
      code: 'IFAM-2026-X9K2L1',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae...',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Carteira de Certificados</Text>
          <Text style={styles.subtitle}>
            Documentos emitidos com validação de presença e assinatura digital SHA-256.
          </Text>
        </View>

        {certs.map((c) => (
          <View key={c.id} style={styles.certCard}>
            <View style={styles.certTop}>
              <View style={styles.badge}>
                <Award color="#1B5E20" size={16} />
                <Text style={styles.badgeText}>{c.hours}</Text>
              </View>
              <Text style={styles.codeText}>{c.code}</Text>
            </View>

            <Text style={styles.certTitle}>{c.title}</Text>

            <View style={styles.hashBox}>
              <ShieldCheck color="#1B5E20" size={14} />
              <Text style={styles.hashText} numberOfLines={1}>SHA-256: {c.hash}</Text>
            </View>

            <TouchableOpacity style={styles.downloadBtn}>
              <Download color="#FFFFFF" size={14} />
              <Text style={styles.downloadText}>Visualizar Certificado em PDF</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  certCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  certTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#1B5E20',
    fontWeight: 'bold',
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#64748B',
  },
  certTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  hashBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 10,
    gap: 6,
    marginBottom: 14,
  },
  hashText: {
    fontSize: 10,
    color: '#64748B',
    flex: 1,
  },
  downloadBtn: {
    backgroundColor: '#1B5E20',
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
