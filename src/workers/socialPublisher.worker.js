// src/workers/socialPublisher.worker.js
// Worker for processing scheduled social media posts
import { Queue, Worker } from 'bullmq';
import { SocialPost } from '../models/SocialPost.js';
import { SocialPostChannel } from '../models/SocialPostChannel.js';
import { SocialAccount } from '../models/SocialAccount.js';
import { PublishAttempt } from '../models/PublishAttempt.js';
import { publishToPlatform } from '../providers/socialProviders.js';

// Redis connection (fallback to in-memory if Redis not available)
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined
};

let queue;
let worker;

/**
 * Initialize BullMQ queue
 */
export function initializeQueue() {
  try {
    queue = new Queue('social-publisher', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000
        },
        removeOnFail: {
          age: 86400 // Keep failed jobs for 24 hours
        }
      }
    });

    worker = new Worker('social-publisher', processJob, {
      connection: redisConnection,
      concurrency: 5
    });

    worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err.message);
    });

    console.log('✅ Social Publisher queue initialized');
    return { queue, worker };
  } catch (error) {
    console.error('❌ Error initializing queue:', error);
    console.log('⚠️  Falling back to database-based scheduling');
    return null;
  }
}

/**
 * Process a publishing job
 */
async function processJob(job) {
  const { postChannelId } = job.data;

  try {
    // Load post channel with relations
    const channel = await SocialPostChannel.findByPk(postChannelId, {
      include: [
        {
          model: SocialPost,
          as: 'post'
        },
        {
          model: SocialAccount,
          as: 'account'
        }
      ]
    });

    if (!channel) {
      throw new Error(`Post channel ${postChannelId} not found`);
    }

    if (channel.status === 'published') {
      console.log(`Post channel ${postChannelId} already published`);
      return;
    }

    // Update status to publishing
    await channel.update({ status: 'publishing' });

    // Create publish attempt
    const attempt = await PublishAttempt.create({
      postChannelId: channel.id,
      attemptNumber: await PublishAttempt.count({ where: { postChannelId: channel.id } }) + 1,
      status: 'processing',
      attemptedAt: new Date()
    });

    try {
      // Publish to platform
      const result = await publishToPlatform(
        channel.account.platform,
        channel.account,
        {
          content: channel.post.content,
          mediaUrls: channel.post.mediaUrls || []
        }
      );

      // Update channel on success
      await channel.update({
        status: 'published',
        publishedAt: result.publishedAt || new Date(),
        providerPostId: result.providerPostId,
        providerPostUrl: result.providerPostUrl,
        errorMessage: null
      });

      // Update attempt
      await attempt.update({
        status: 'success',
        completedAt: new Date(),
        responseData: result
      });

      // Update post status if all channels are published
      await updatePostStatus(channel.postId);

      console.log(`✅ Successfully published post channel ${postChannelId} to ${channel.account.platform}`);
    } catch (error) {
      // Update channel on failure
      await channel.update({
        status: 'failed',
        errorMessage: error.message
      });

      // Update attempt
      await attempt.update({
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message
      });

      throw error;
    }
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error);
    throw error;
  }
}

/**
 * Update post status based on channel statuses
 */
async function updatePostStatus(postId) {
  const post = await SocialPost.findByPk(postId, {
    include: [
      {
        model: SocialPostChannel,
        as: 'channels'
      }
    ]
  });

  if (!post) return;

  const channels = post.channels || [];
  const allPublished = channels.every(ch => ch.status === 'published');
  const anyFailed = channels.some(ch => ch.status === 'failed');
  const anyPublishing = channels.some(ch => ch.status === 'publishing');

  if (allPublished && channels.length > 0) {
    await post.update({
      status: 'published',
      publishedAt: new Date()
    });
  } else if (anyFailed && !anyPublishing) {
    await post.update({ status: 'failed' });
  } else if (anyPublishing) {
    await post.update({ status: 'publishing' });
  }
}

/**
 * Schedule a post for publishing
 */
export async function schedulePost(postId, scheduledAt) {
  try {
    if (!queue) {
      console.warn('Queue not initialized, using database-based scheduling');
      return schedulePostInDatabase(postId, scheduledAt);
    }

    // Load post with channels
    const post = await SocialPost.findByPk(postId, {
      include: [
        {
          model: SocialPostChannel,
          as: 'channels'
        }
      ]
    });

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    // Schedule each channel
    const jobs = [];
    for (const channel of post.channels || []) {
      const delay = new Date(scheduledAt).getTime() - Date.now();
      
      if (delay <= 0) {
        // Already past scheduled time, publish immediately
        await queue.add('publish-post', {
          postChannelId: channel.id
        }, {
          delay: 0
        });
      } else {
        await queue.add('publish-post', {
          postChannelId: channel.id
        }, {
          delay
        });
      }

      jobs.push(channel.id);
    }

    console.log(`✅ Scheduled ${jobs.length} post channels for post ${postId}`);
    return jobs;
  } catch (error) {
    console.error('Error scheduling post:', error);
    throw error;
  }
}

/**
 * Fallback: Schedule post in database (for when Redis/BullMQ is not available)
 */
async function schedulePostInDatabase(postId, scheduledAt) {
  // This would be handled by a cron job that checks the database
  // for posts with scheduledAt <= now and status = 'scheduled'
  console.log(`Post ${postId} scheduled in database for ${scheduledAt}`);
  return [];
}

/**
 * Cancel scheduled post
 */
export async function cancelScheduledPost(postId) {
  try {
    if (!queue) return;

    // Find and remove jobs for this post
    const post = await SocialPost.findByPk(postId, {
      include: [
        {
          model: SocialPostChannel,
          as: 'channels'
        }
      ]
    });

    if (!post) return;

    for (const channel of post.channels || []) {
      const jobs = await queue.getJobs(['delayed', 'waiting']);
      const channelJobs = jobs.filter(job => job.data.postChannelId === channel.id);
      
      for (const job of channelJobs) {
        await job.remove();
      }
    }

    console.log(`✅ Cancelled scheduled jobs for post ${postId}`);
  } catch (error) {
    console.error('Error cancelling scheduled post:', error);
  }
}

/**
 * Start worker (call this from your main app)
 */
export function startWorker() {
  if (!worker) {
    initializeQueue();
  }
  console.log('✅ Social Publisher worker started');
}

// Export for use in app
export { queue, worker };

