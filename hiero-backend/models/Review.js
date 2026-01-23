// models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // One review per user
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  reviewText: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt timestamp on save
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Review', reviewSchema);
