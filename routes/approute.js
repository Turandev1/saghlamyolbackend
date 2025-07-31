const router = require('express').Router();
const appcontroller = require('../controllers/appcontroller');


router.get('/version', appcontroller.getversion)
