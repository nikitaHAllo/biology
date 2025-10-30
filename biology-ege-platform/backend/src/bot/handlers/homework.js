// Обработчик домашней работы
module.exports = {
  submitHomework: async (ctx) => {
    // Логика отправки домашней работы
    await ctx.reply('Домашняя работа принята.');
  }
};
