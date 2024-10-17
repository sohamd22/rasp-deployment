import express from 'express';
import { User } from '../models/userModel.js';

const router = express.Router();

router.post('/join', async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
});

export default router;
