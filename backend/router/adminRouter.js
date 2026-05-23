import express from 'express';

import { deleteInvestor, fetchInvestorData, getDashboardSummary, registrationDetails, updateInvestor, uploadInvestorDetails } from "../controllers/adminController.js";

import { loginAdmin, logout, refreshToken, signupAdmin } from '../controllers/authController.js';
import { createEvent, eventDelete, getAllEvents, getUpcomingEventsWithRegistrations, updateEvent } from '../controllers/eventController.js';
import { verifyQR } from '../controllers/registrationController.js';



const router = express.Router();


router.post("/login", loginAdmin);
router.post("/signup", signupAdmin);
router.post("/refresh", refreshToken);
router.post('/logout',logout)

router.post("/uploadInvestorDetails", uploadInvestorDetails);
router.post("/getInvestorDetails", fetchInvestorData);
router.get('/getDashboardSummary', getDashboardSummary)
router.put('/updateInvestor/:id', updateInvestor)
router.delete('/deleteInvestor/:id', deleteInvestor)


// Event 

router.post('/createvent', createEvent)
router.get('/createdevents', getAllEvents)
router.delete('/eventDelete/:id', eventDelete)
router.put('/eventedit/:id', updateEvent)
router.get('/getRunningEventsWithRegistrations', getUpcomingEventsWithRegistrations)
router.post("/verify-qr", verifyQR);



// registration detils
router.post("/RegistrationDetils", registrationDetails);

export default router;
