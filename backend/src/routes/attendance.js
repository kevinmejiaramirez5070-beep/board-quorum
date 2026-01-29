const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

router.get('/meeting/:meetingId', auth, attendanceController.getAttendance);
router.post('/meeting/:meetingId', auth, attendanceController.registerAttendance);
router.post('/public/meeting/:meetingId', attendanceController.registerPublicAttendance);
router.put('/:id', auth, attendanceController.updateAttendance);

module.exports = router;

