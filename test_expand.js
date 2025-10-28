// Test de la fonction expandDailyToIntraday
const expandDailyToIntraday = (dailyData) => {
  const expandedData = [];

  dailyData.forEach(dayData => {
    const startHour = 9;
    const endHour = 17;
    const endMinute = 30;

    const dayTimestamp = dayData.timestamp;
    const dayDate = new Date(dayTimestamp * 1000);
    dayDate.setHours(startHour, 0, 0, 0);

    let currentTime = Math.floor(dayDate.getTime() / 1000);
    const endTime = Math.floor(new Date(dayTimestamp * 1000).setHours(endHour, endMinute, 0, 0) / 1000);

    while (currentTime <= endTime) {
      expandedData.push({
        timestamp: currentTime,
        date: new Date(currentTime * 1000).toLocaleDateString('fr-FR'),
        time: new Date(currentTime * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        price: dayData.price
      });
      currentTime += 15 * 60; // Ajouter 15 minutes
    }
  });

  return expandedData;
};

// Test avec une donnée
const testData = [{
  timestamp: 1730073600, // 28 oct 2024 00:00:00
  price: 100.50
}];

const result = expandDailyToIntraday(testData);
console.log("Nombre de points générés:", result.length);
console.log("\nPremiers points:");
result.slice(0, 5).forEach(p => console.log(`${p.date} ${p.time} - ${p.price}€`));
console.log("\nDerniers points:");
result.slice(-3).forEach(p => console.log(`${p.date} ${p.time} - ${p.price}€`));
