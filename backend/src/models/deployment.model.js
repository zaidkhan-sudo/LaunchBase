import mongoose from 'mongoose';

const BUILD_STEPS = ['CLONE', 'DOCKERFILE', 'BUILD', 'PUSH', 'DEPLOY'];

const MAX_LOG_LINES = 2000;

const stepSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: BUILD_STEPS,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'success', 'failed', 'skipped'],
      default: 'pending',
    },
    startedAt: {
      type: Date,
      default: null,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const logLineSchema = new mongoose.Schema(
  {
    ts: {
      type: Date,
      required: true,
    },
    line: {
      type: String,
      required: true,
    },
    stream: {
      type: String,
      enum: ['stdout', 'stderr', 'system'],
      default: 'stdout',
    },
  },
  { _id: false }
);

const deploymentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    // Denormalized so ownership checks (REST + socket) never need a populate.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['QUEUED', 'BUILDING', 'DEPLOYING', 'READY', 'FAILED'],
      default: 'QUEUED',
    },
    trigger: {
      type: String,
      enum: ['MANUAL', 'WEBHOOK'],
      default: 'MANUAL',
    },
    // Only present on WEBHOOK deployments — GitHub gives us the commit metadata.
    commitHash: {
      type: String,
      default: null,
    },
    commitMessage: {
      type: String,
      default: null,
    },
    author: {
      type: String,
      default: null,
    },
    steps: {
      type: [stepSchema],
      default: () => BUILD_STEPS.map((name) => ({ name, status: 'pending' })),
    },
    logs: {
      type: [logLineSchema],
      default: [],
    },
    ecrImageUri: {
      type: String,
      default: null,
    },
    taskArn: {
      type: String,
      default: null,
    },
    liveUrl: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Dashboard and history both read "latest deployments for a project, newest first".
deploymentSchema.index({ project: 1, createdAt: -1 });

const Deployment = mongoose.model('Deployment', deploymentSchema);

export default Deployment;
export { BUILD_STEPS, MAX_LOG_LINES };
