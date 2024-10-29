import { User } from '../models/userModel.js';
import Devspace from '../models/devspaceModel.js';
import { emitToConnectedClient } from '../utils/connectedClients.js';

const joinDevspace = async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    user.isInDevspace = true;
    await user.save();

    // Create a new Devspace record for the user
    const devspace = await Devspace.create({
        user: userId,
        team: [],
        pendingInvitations: [],
        sentInvitations: []
        });

        res.status(200).json({ user, devspace });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while joining the Devspace' });
    }
}

const sendInvitation = async (req, res) => {
    const { senderId, receiverId } = req.body;

    try {
        const senderDevspace = await Devspace.findOne({ user: senderId });
        const receiverDevspace = await Devspace.findOne({ user: receiverId });

    if (!senderDevspace || !receiverDevspace) {
        return res.status(404).json({ error: 'One or both users are not in Devspace' });
    }

    const currentTeamSize = senderDevspace.team.length;
    const currentSentInvitations = senderDevspace.sentInvitations.length;

    if (currentTeamSize + currentSentInvitations >= 4) {
        return res.status(400).json({ error: 'Maximum team size or invitation limit reached' });
    }

    // Add invitation to receiver's pending invitations
    receiverDevspace.pendingInvitations.push({
        from: senderId,
        teamMembers: [...senderDevspace.team, senderId]
    });

        // Add invitation to sender's sent invitations
        senderDevspace.sentInvitations.push({ to: receiverId });

        await receiverDevspace.save();
    await senderDevspace.save();

    res.status(200).json({ message: 'Invitation sent successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while sending the invitation' });
    }
}

const cancelInvitation = async (req, res) => {
    const { receiverId, userId } = req.body;

    try {
        const senderDevspace = await Devspace.findOne({ user: userId });
        const receiverDevspace = await Devspace.findOne({ user: receiverId });

    if (!senderDevspace || !receiverDevspace) {
        return res.status(404).json({ error: 'One or both users are not in Devspace' });
    }

    // Remove the invitation from sender's sent invitations
    senderDevspace.sentInvitations = senderDevspace.sentInvitations.filter(
        inv => inv.to.toString() !== receiverId
    );

    // Remove the invitation from receiver's pending invitations
    receiverDevspace.pendingInvitations = receiverDevspace.pendingInvitations.filter(
        inv => inv.from.toString() !== userId
    );

    await senderDevspace.save();
    await receiverDevspace.save();

    res.status(200).json({ message: 'Invitation cancelled successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while cancelling the invitation' });
    }
}

const acceptInvitation = async (req, res) => {
    const { userId, invitationId } = req.body;

    try {
        const userDevspace = await Devspace.findOne({ user: userId });
        if (!userDevspace) {
        return res.status(404).json({ error: 'User not found in Devspace' });
    }

    const invitation = userDevspace.pendingInvitations.id(invitationId);
    if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.teamMembers.length > 4) {
        return res.status(400).json({ error: 'Team size would exceed the maximum of 5 members' });
    }

    // Add user to the team
    userDevspace.team = invitation.teamMembers;

    // Remove all pending invitations
    userDevspace.pendingInvitations = [];

    // Remove all sent invitations
    userDevspace.sentInvitations = [];

    await userDevspace.save();

    // Update the team for all team members
    for (const memberId of userDevspace.team) {
        if (memberId.toString() !== userId.toString()) {
            const memberDevspace = await Devspace.findOne({ user: memberId });
            if (memberDevspace) {
                memberDevspace.team.push(userId);
                memberDevspace.sentInvitations = memberDevspace.sentInvitations.filter(inv => inv.to.toString() !== userId.toString());
                await memberDevspace.save();
            }
        }
    }

    res.status(200).json({ message: 'Invitation accepted', team: userDevspace.team });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while accepting the invitation' });
    }
}

const rejectInvitation = async (req, res) => {
    const { userId, invitationId } = req.body;

    try {
        const userDevspace = await Devspace.findOne({ user: userId });
        if (!userDevspace) {
        return res.status(404).json({ error: 'User not found in Devspace' });
    }

    // Remove the invitation from pending invitations
    const invitation = userDevspace.pendingInvitations.id(invitationId);
    // Remove the invitation from sender's sent invitations
    if (invitation) {
        for (const memberId of invitation.teamMembers) {
            if (memberId.toString() !== userId.toString()) {
                const memberDevspace = await Devspace.findOne({ user: memberId });
                if (memberDevspace) {
                    memberDevspace.sentInvitations = memberDevspace.sentInvitations.filter(inv => inv.to.toString() !== userId.toString());
                    await memberDevspace.save();
                }
            }
        }
    }

    userDevspace.pendingInvitations.pull(invitationId);
    await userDevspace.save();

    res.status(200).json({ message: 'Invitation rejected' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while rejecting the invitation' });
    }
}

const getDevspaceInfo = async (req, res) => {
    const { userId } = req.params;

    try {
        const devspace = await Devspace.findOne({ user: userId })
            .populate('team', 'name email photo')
        .populate('pendingInvitations.from', 'name email photo')
        .populate('sentInvitations.to', 'name email photo');

    if (!devspace) {
        return res.status(404).json({ error: 'Devspace not found for this user' });
    }

    res.status(200).json(devspace);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the Devspace info' });
    }
}

const devspaceChangeStream = Devspace.watch();
devspaceChangeStream.on('change', async (change) => {
  if (change.operationType === 'update') {
    try {
        const updatedDevspace = await Devspace.findById(change.documentKey._id)
            .populate('team', 'name email photo')
      .populate('pendingInvitations.from', 'name email photo')
      .populate('sentInvitations.to', 'name email photo');
    if (updatedDevspace) {
        console.log(updatedDevspace);
            emitToConnectedClient(updatedDevspace.user.toString(), 'devspace-update', updatedDevspace);
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating the Devspace' });
    }
  }
});

export { joinDevspace, sendInvitation, cancelInvitation, acceptInvitation, rejectInvitation, getDevspaceInfo };
