import express from 'express';
import { joinDevspace, sendInvitation, cancelInvitation, acceptInvitation, rejectInvitation, getDevspaceInfo, updateIdea } from '../controllers/devspaceController.js';

const router = express.Router();

router.post('/join', joinDevspace);
router.post('/send-invitation', sendInvitation);
router.post('/cancel-invitation', cancelInvitation);
router.post('/accept-invitation', acceptInvitation);
router.post('/reject-invitation', rejectInvitation);
router.get('/info/:userId', getDevspaceInfo);
router.post('/update-idea', updateIdea);

export default router;
