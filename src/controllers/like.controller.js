import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!videoId) {
    throw new ApiError(400, "No video available");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video format");
  }

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "Access not granted");
  }

  const alreadyLikedVideo = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });

  if (alreadyLikedVideo) {
    await Like.findByIdAndDelete(alreadyLikedVideo._id);

    return res.status(200).json(new ApiResponse(200, {}, "Post unlike successfully"));
  } else {
    const vidoeLike = await Like.create({
      video: videoId,
      likedBy: userId,
    });

    if (!vidoeLike) {
      throw new ApiError(500, "Failed to like the post");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, vidoeLike, "Post liked successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!commentId?.trim()) {
    throw new ApiError(400, "comment is unavailable");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment format");
  }

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "Access denied");
  }

  const alreadyLikedComment = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (alreadyLikedComment) {
    await Like.findByIdAndDelete(alreadyLikedComment._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment unliked successfully"));
  } else {
    const commentLike = await Like.create({
      comment: commentId,
      likedBy: userId,
    });

    if (!commentLike) {
      throw new ApiError(400, "Failed to Like the comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, commentLike, "Comment liked successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if (!tweetId) {
    throw new ApiError(400, "Tweet is required");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet format is invalid");
  }
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "Access denied");
  }

  const alreadyLikedTweet = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });

  if (alreadyLikedTweet) {
    await Like.findByIdAndDelete(alreadyLikedTweet._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet unliked successfully"));
  } else {
    const tweetLike = await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });

    if (!tweetLike) {
      throw new ApiError(400, "Failed to Like the Tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, tweetLike, "Tweet liked successfully"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "Access Denied");
  }

  const likedVideoDocs = await Like.find({
    likedBy: userId,
    video: {
      $exists: true,
      $ne: null,
    },
  }).populate("video");

  const likedVideos = likedVideoDocs.map((like) => like.video).filter(Boolean);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
