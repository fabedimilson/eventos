import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
} from 'react-native';
import { Users, MessageSquare, Send, Eye, EyeOff, CheckCheck } from 'lucide-react-native';

export default function MobileChatScreen() {
  const [isInvisible, setIsInvisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [inputText, setInputText] = useState('');

  const attendees = [
    {
      id: 'att-1',
      name: 'Beatriz Pereira Rocha',
      category: 'ALUNO',
      campus: 'Campus Coari',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120',
      bio: 'Pesquisadora em IoT e Robótica.',
    },
    {
      id: 'att-2',
      name: 'Eng. Roberto Albuquerque',
      category: 'EXTERNO',
      campus: 'Polo Industrial de Manaus',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
      bio: 'Tech Lead em IA aplicada à indústria.',
    },
    {
      id: 'att-3',
      name: 'Dr. Carlos Eduardo Menezes',
      category: 'PROFESSOR',
      campus: 'Campus Manaus Centro',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      bio: 'Pesquisador em Computação Científica.',
    },
  ];

  const [messages, setMessages] = useState([
    { id: '1', sender: 'other', text: 'Olá! Você assistiu à palestra de IA?' },
    { id: '2', sender: 'me', text: 'Sim! Achei excelente o debate sobre bioinformática.' },
  ]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), sender: 'me', text: inputText.trim() }]);
    setInputText('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra de Modo Invisível */}
      <View style={styles.privacyHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.privacyTitle}>
            {isInvisible ? 'Modo Invisível Ativo' : 'Perfil Visível no Evento'}
          </Text>
          <Text style={styles.privacySub}>
            {isInvisible ? 'Outros participantes não podem te encontrar' : 'Permitir que participantes enviem mensagens'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.privacyBtn, isInvisible && styles.privacyBtnActive]}
          onPress={() => setIsInvisible(!isInvisible)}
        >
          {isInvisible ? <EyeOff color="#FFFFFF" size={16} /> : <Eye color="#334155" size={16} />}
        </TouchableOpacity>
      </View>

      {/* Lista Horizontal de Categorias */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesBar}>
        {['ALL', 'ALUNO', 'PROFESSOR', 'TECNICO', 'EXTERNO'].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>
              {cat === 'ALL' ? 'Todos' : cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de Participantes ou Janela de Conversa */}
      {selectedUser ? (
        <View style={styles.chatWindow}>
          <View style={styles.chatHeader}>
            <Image source={{ uri: selectedUser.avatarUrl }} style={styles.avatarMini} />
            <View style={{ flex: 1 }}>
              <Text style={styles.chatHeaderName}>{selectedUser.name}</Text>
              <Text style={styles.chatHeaderCat}>{selectedUser.category} • {selectedUser.campus}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedUser(null)}>
              <Text style={styles.closeChatText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.messagesList} contentContainerStyle={{ padding: 12 }}>
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.msgBubble,
                  m.sender === 'me' ? styles.msgBubbleMe : styles.msgBubbleOther,
                ]}
              >
                <Text style={[styles.msgText, m.sender === 'me' && styles.msgTextMe]}>{m.text}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Digite sua mensagem direta..."
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Send color="#FFFFFF" size={16} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.attendeesList}>
          {attendees
            .filter((a) => selectedCategory === 'ALL' || a.category === selectedCategory)
            .map((att) => (
              <TouchableOpacity
                key={att.id}
                style={styles.attCard}
                onPress={() => setSelectedUser(att)}
              >
                <Image source={{ uri: att.avatarUrl }} style={styles.attAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.attName}>{att.name}</Text>
                  <Text style={styles.attBio}>{att.bio}</Text>
                  <Text style={styles.attCampus}>{att.category} • {att.campus}</Text>
                </View>
                <MessageSquare color="#1B5E20" size={18} />
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  privacySub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  privacyBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  privacyBtnActive: {
    backgroundColor: '#F59E0B',
  },
  categoriesBar: {
    paddingHorizontal: 16,
    marginTop: 12,
    maxHeight: 38,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: '#1B5E20',
  },
  catText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  catTextActive: {
    color: '#FFFFFF',
  },
  attendeesList: {
    padding: 16,
  },
  attCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 12,
  },
  attAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  attName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  attBio: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  attCampus: {
    fontSize: 10,
    color: '#1B5E20',
    fontWeight: '600',
    marginTop: 2,
  },
  chatWindow: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  chatHeaderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  chatHeaderCat: {
    fontSize: 10,
    color: '#64748B',
  },
  closeChatText: {
    fontSize: 11,
    color: '#C62828',
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
  },
  msgBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
  },
  msgBubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#1B5E20',
    borderBottomRightRadius: 2,
  },
  msgBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 12,
    color: '#0F172A',
  },
  msgTextMe: {
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    backgroundColor: '#1B5E20',
    padding: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
