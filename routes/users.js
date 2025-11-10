var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('', function(req, res, next) {
	const data = {
		total: 1,
		items: [
			{
				id: 0,
				name: 'zhangsan',
			},
			{
				id: 1,
				name: 'lisi',
			}
		]
	}
	res.send(JSON.stringify(data));
});

module.exports = router;
