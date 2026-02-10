import { database } from '../firebase-config';
import { ref, get, set } from 'firebase/database';

// Haftanın Pazartesi ve Pazar tarihlerini hesapla
export function getWeekDates(weekOffset = 0) {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
  
  // Bu haftanın Pazartesi'sini bul
  const monday = new Date(today);
  const diff = currentDay === 0 ? -6 : 1 - currentDay; // Pazar ise 6 gün geriye
  monday.setDate(today.getDate() + diff + (weekOffset * 7));
  monday.setHours(0, 0, 0, 0);
  
  // Pazar'ı hesapla
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    baslangic: monday,
    bitis: sunday
  };
}

// Tarih geçmiş mi kontrol et
export function isDatePassed(dateString) {
  if (!dateString) return false;
  
  const orderDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return orderDate < today;
}

// Sipariş gecikmiş mi kontrol et
export function isOrderDelayed(order) {
  const durum = order.DURUMU || 'BEKLEMEDE';
  return isDatePassed(order.TARIH) && durum !== 'SEVK EDİLDİ';
}

// Hafta bitmiş mi kontrol et
export function isWeekEnded(weekNumber) {
  const weekDates = getWeekDates(weekNumber - 1);
  const today = new Date();
  return today > weekDates.bitis;
}

// Gecikmiş siparişleri sonraki haftaya taşı
export async function moveDelayedOrders() {
  let movedCount = 0;
  
  for (let week = 1; week <= 4; week++) {
    const weekDates = getWeekDates(week - 1);
    const today = new Date();
    
    if (today > weekDates.bitis) {
      const weekRef = ref(database, `haftalar/week_${week}`);
      const snapshot = await get(weekRef);
      
      if (!snapshot.exists()) continue;
      
      const weekData = snapshot.val();
      const completed = {};
      const delayed = {};
      
      Object.entries(weekData).forEach(([key, order]) => {
        const durum = order.DURUMU || 'BEKLEMEDE';
        if (durum === 'SEVK EDİLDİ') {
          completed[key] = order;
        } else {
          delayed[key] = {...order, gecikme: true};
          movedCount++;
        }
      });
      
      await set(weekRef, completed);
      
      if (Object.keys(delayed).length > 0 && week < 4) {
        const nextWeekRef = ref(database, `haftalar/week_${week + 1}`);
        const nextSnapshot = await get(nextWeekRef);
        const nextWeekData = nextSnapshot.exists() ? nextSnapshot.val() : {};
        
        await set(nextWeekRef, {...nextWeekData, ...delayed});
      }
    }
  }
  
  return movedCount;
}

// Hafta tarihini formatla
export function formatWeekDate(weekNumber) {
  const weekDates = getWeekDates(weekNumber - 1);
  const options = { day: 'numeric', month: 'short' };
  const baslangic = weekDates.baslangic.toLocaleDateString('tr-TR', options);
  const bitis = weekDates.bitis.toLocaleDateString('tr-TR', options);
  return `${baslangic} - ${bitis}`;
}