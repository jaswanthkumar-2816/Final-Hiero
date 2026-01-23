// models/LoginTracking.js
import mongoose from 'mongoose';

const loginTrackingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  loginTimestamp: { 
    type: Date, 
    default: Date.now 
  },
  ipAddress: { 
    type: String 
  },
  userAgent: { 
    type: String 
  }
});

// Index for efficient queries
loginTrackingSchema.index({ userId: 1, loginTimestamp: -1 });
loginTrackingSchema.index({ userEmail: 1 });

export default mongoose.model('LoginTracking', loginTrackingSchema);
