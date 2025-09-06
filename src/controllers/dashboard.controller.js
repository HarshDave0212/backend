import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like  total subscribers, total videos, total likes etc.
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "channelId is required");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id");
  }

  const totalVideos = await Video.countDocuments({ owner: channelId });

  const totalSubscribers = await Subscription.countDocuments({
    owner: channelId,
  });

  const videoIds = await Video.find({
    owner: channelId,
  }).distinct("_id");

  let totalLikes = 0;
  if (videoIds.length) {
    totalLikes = await Like.countDocuments({
      video: { $in: videoIds },
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos,
        totalSubscribers,
        totalLikes,
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  if (!channelId) {
    throw new ApiError(400, "ChannelId is required");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid ChannelId format");
  }

  const videos = await Video.find({
    owner: channelId,
  }).sort({ createdAt: -1 });

  if (!videos.length) {
    throw new ApiError(404, "videos not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
