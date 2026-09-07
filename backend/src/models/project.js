import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Project name can only contain lowercase letters, numbers, and hyphens'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    repoUrl: {
      type: String,
      required: [true, 'GitHub repository URL is required'],
      trim: true,
    },
    branch: {
      type: String,
      default: 'main',
      trim: true,
    },
    webhookSecret: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['IDLE', 'QUEUED', 'BUILDING', 'DEPLOYING', 'READY', 'FAILED'],
      default: 'IDLE',
    },
    ecrImageUri: {
      type: String,
      default: null,
    },
    ecsServiceArn: {
      type: String,
      default: null,
    },
    /*
      ALB routing resources, recorded so deleting a project can tear them down.
      Target groups and listener rules cost nothing, but a listener is capped at
      100 rules — leaked rules from deleted projects would eventually make every
      new deploy fail. Null on projects deployed before ALB routing existed, and
      whenever ALB routing is not configured.
    */
    albTargetGroupArn: {
      type: String,
      default: null,
    },
    albListenerRuleArn: {
      type: String,
      default: null,
    },
    liveUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Project=mongoose.model('Project',projectSchema)
export default Project
