
import express from 'express';
import { checkInvestor, GetOneEventById } from '../controllers/userController.js';
import { checkRegistrationStatus, deleteGuestFromRegistration, registerEvent, } from '../controllers/registrationController.js';
import { createOrder, getPaymentStatus, markPaymentFailed, verifyPayment } from '../controllers/paymentController.js';
const router = express.Router();


router.get('/login', (req, res) => {

});

router.post('/checkInvestor', checkInvestor)
// Registration
router.post('/createRegistration', registerEvent)
router.post('/check-registration', checkRegistrationStatus)

//  payment 

router.post("/createPayment", createOrder);
router.post("/createPaymentVerify", verifyPayment);
router.post("/paymentFailed", markPaymentFailed);
router.post("/check-payment-status", getPaymentStatus);
router.post("/GetOneEventById/:id", GetOneEventById);
router.post("/delete-guest", deleteGuestFromRegistration);

export default router;