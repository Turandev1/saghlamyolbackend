const express = require('express');
const router = express.Router();
const appcontroller = require('../controllers/appcontroller');


router.get('/version', appcontroller.getversion)
