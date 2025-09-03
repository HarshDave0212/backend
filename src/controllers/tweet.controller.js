import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "No tweet drafted");
  }

  if (content.length > 200) {
    throw new ApiError(400, "Tweet should be less than 200 characters");
  }

  const ownerId = req.user?._id;
  if (!ownerId) {
    throw new ApiError(400, "Login required to tweet");
  }

  const tweet = await Tweet.create({
    content: content,
    owner: ownerId,
  });

  if (!tweet) {
    throw new ApiError(400, "Something went worng while creating tweet");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "user id is required");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user");
  }

  if (userId.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Access denied");
  }

  const tweets = await Tweet.find({
    owner: userId,
  }).sort({ createdAt: -1 });

  if (!tweets.length) {
    throw new ApiError(400, "No tweets found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "tweetId is required");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "nothing has been tweeted");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "You dont have access to update");
  }

  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Nothing to update");
  }

  const updateTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content },
    },
    { new: true }
  );

  if (!updateTweet) {
    throw new ApiError(400, "Something went wrong while updating the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateTweet, "Tweet updated succesfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "TweetId is requrired");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet id is invalid");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet does not exist");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Access denied");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
