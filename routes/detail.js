var express = require('express');
var router = express.Router();

/* GET home page. */ //todoリストの詳細
router.get('/', function(req, res, next) {
  res.render('detail', { title: 'ToDo' });
});

module.exports = router;

