import mongoose from 'mongoose';

const devspaceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pendingInvitations: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    teamMembers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  sentInvitations: [{
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
});

const Devspace = mongoose.model('Devspace', devspaceSchema);

export default Devspace;
