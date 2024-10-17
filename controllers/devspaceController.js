import User from '../models/User.js';

const joinDevspace = async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    user.isInDevspace = true;
    await user.save();

    res.status(200).json({ message: 'User joined devspace' });
}

export { joinDevspace };