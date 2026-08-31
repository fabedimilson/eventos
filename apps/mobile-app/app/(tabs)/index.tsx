import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['Todos', 'Tecnologia', 'Sustentabilidade', 'Extensão', 'Pesquisa'];

  const featuredEvents = [
    {
      id: '1',
      title: 'Semana Nacional de Ciência e Tecnologia 2026 - "Ciência Delas"',
      date: '26 a 29 de Outubro',
      location: 'IFAM Campus Manaus Centro',
      bannerUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
    },
    {
      id: '2',
      title: 'Simpósio de Inovação e Tecnologia do Amazonas',
      date: '15 a 17 de Outubro',
      location: 'Auditório Gilberto Mestrinho',
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    },
    {
      id: '3',
      title: 'Fórum de Sustentabilidade na Amazônia',
      date: '22 de Novembro',
      location: 'Espaço Maker IFAM',
      bannerUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800',
    },
  ];

  const upcomingEvents = [
    {
      id: '101',
      day: '05',
      month: 'DEZ',
      status: 'Inscrições Abertas',
      title: 'Hackathon Educacional IFAM 2026',
      time: '08:00 - 18:00',
      location: 'Laboratório Maker',
      badgeColor: '#E8F5E9',
      textColor: '#1B5E20',
    },
    {
      id: '102',
      day: '12',
      month: 'DEZ',
      status: 'Em Breve',
      title: 'Semana Acadêmica de Engenharia de Software',
      time: '14:00 - 20:00',
      location: 'Campus Manaus Centro',
      badgeColor: '#F5F5F5',
      textColor: '#616161',
    },
    {
      id: '103',
      day: '15',
      month: 'DEZ',
      status: 'Inscrições Abertas',
      title: 'Palestra: Inteligência Artificial na Educação Amazônica',
      time: '19:00 - 21:00',
      location: 'YouTube Live',
      badgeColor: '#E8F5E9',
      textColor: '#1B5E20',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* TopAppBar (Proposto pelo Google Stitch) */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' }}
            style={styles.avatar}
          />
        </View>

        <Text style={styles.headerTitle}>THE IFAM EVENTS</Text>

        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Saudação do Participante */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Olá, Edimilson</Text>
          <Text style={styles.greetingSubtitle}>Confira os eventos disponíveis para você</Text>
        </View>

        {/* Barra de Pesquisa */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#757575" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar eventos..."
            placeholderTextColor="#9E9E9E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categorias / Chips em Scroll Horizontal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.chip,
                  isSelected ? styles.chipSelected : styles.chipUnselected,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Carrossel de Eventos em Destaque */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Eventos em Destaque</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredContainer}
        >
          {featuredEvents.map((event) => (
            <TouchableOpacity key={event.id} style={styles.featuredCard} activeOpacity={0.9}>
              <Image source={{ uri: event.bannerUrl }} style={styles.featuredImage} />
              <View style={styles.featuredContent}>
                <View style={styles.rowItem}>
                  <MaterialIcons name="event" size={14} color="#1B5E20" />
                  <Text style={styles.featuredDate}>{event.date}</Text>
                </View>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {event.title}
                </Text>
                <View style={styles.rowItem}>
                  <MaterialIcons name="location-on" size={14} color="#757575" />
                  <Text style={styles.featuredLocation}>{event.location}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de Próximos Eventos */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {upcomingEvents.map((item) => (
            <TouchableOpacity key={item.id} style={styles.listItem} activeOpacity={0.8}>
              <View style={styles.calendarBadge}>
                <Text style={styles.dayText}>{item.day}</Text>
                <Text style={styles.monthText}>{item.month}</Text>
              </View>

              <View style={styles.listContent}>
                <View style={[styles.statusBadge, { backgroundColor: item.badgeColor }]}>
                  <Text style={[styles.statusText, { color: item.textColor }]}>
                    {item.status}
                  </Text>
                </View>
                <Text style={styles.listTitle} numberOfLines={1}>
                  {item.title}
                </Text>

                <View style={styles.listSubRow}>
                  <MaterialIcons name="schedule" size={12} color="#757575" />
                  <Text style={styles.listSubText}>{item.time}</Text>
                  <Text style={styles.dot}>•</Text>
                  <MaterialIcons name="location-on" size={12} color="#757575" />
                  <Text style={styles.listSubText} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF9F8',
  },
  header: {
    height: 60,
    backgroundColor: '#1B5E20',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#84FB97',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconButton: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  greetingSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#3E4A3D',
    marginTop: 2,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BDCABA',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1B1B',
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#1B5E20',
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BDCABA',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipTextUnselected: {
    color: '#3E4A3D',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionHeaderBetween: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B5E20',
  },
  featuredContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  featuredCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BDCABA',
    marginRight: 16,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 140,
  },
  featuredContent: {
    padding: 12,
    gap: 4,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B5E20',
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1B1B',
    lineHeight: 18,
  },
  featuredLocation: {
    fontSize: 12,
    color: '#757575',
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BDCABA',
    padding: 12,
    gap: 12,
  },
  calendarBadge: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  dayText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B5E20',
  },
  monthText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1B5E20',
  },
  listContent: {
    flex: 1,
    gap: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  listSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  listSubText: {
    fontSize: 11,
    color: '#757575',
  },
  dot: {
    fontSize: 12,
    color: '#757575',
    marginHorizontal: 2,
  },
});
