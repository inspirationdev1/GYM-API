const express = require('express');
const router = express.Router();
const auth = require('../Auth/auth');
const MemberController = require('../Controllers/member');


router.get('/all-member',auth, MemberController.getAllMember);
router.post('/register-member',auth, MemberController.registerMember);
router.get('/searched-members',auth,MemberController.searchMember);
router.get('/monthly-member', auth, MemberController.monthlyMember);
router.get('/within-3-days-expiring', auth, MemberController.expiringWithin3Days);
router.get('/within-4-7-expiring', auth, MemberController.expiringWithin4To7Days);
router.get('/expired-member', auth, MemberController.expiredMember);
router.get('/inactive-member', auth, MemberController.inActiveMember);


router.get('/get-member/:id', auth, MemberController.getMemberDetails);
router.post('/change-status/:id', auth, MemberController.changeStatus);
router.put('/update-member-plan/:id', auth, MemberController.updateMemberPlan);

module.exports = router;