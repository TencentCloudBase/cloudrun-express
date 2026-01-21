const express = require('express');
const router = express.Router();

// 模拟用户数据
const users = [
  { id: 1, name: 'zhangsan', email: 'zhangsan@example.com' },
  { id: 2, name: 'lisi', email: 'lisi@example.com' },
  { id: 3, name: 'wangwu', email: 'wangwu@example.com' }
];

/* GET users listing */
router.get('/', function(req, res, next) {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  
  const paginatedUsers = users.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      total: users.length,
      page: parseInt(page),
      limit: parseInt(limit),
      items: paginatedUsers
    }
  });
});

/* GET user by ID */
router.get('/:id', function(req, res, next) {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

/* POST create user */
router.post('/', function(req, res, next) {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    data: newUser
  });
});

module.exports = router;
