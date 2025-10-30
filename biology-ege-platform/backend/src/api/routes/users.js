// Роуты для работы с пользователями
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Список пользователей (заглушка)' });
});

module.exports = router;
