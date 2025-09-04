import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  if (!channelId) {
    throw new ApiError(400, "Channel not exist");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel format");
  }
  const userId = req.user?._id;

  if (channelId.toString() === userId.toString()) {
    throw new ApiError(400, "You can't subscribed your own channel");
  }
  const alreadySubscribed = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (alreadySubscribed) {
    await Subscription.findByIdAndDelete(alreadySubscribed._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Channel Unsubscribed successfully"));
  } else {
    const channelSubscribe = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channelSubscribe,
          "Channel Subscribed successfully"
        )
      );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId?.trim()) {
    throw new ApiError(400, "ChannelId is needed");
  }
  if(!isValidObjectId(channelId)){
    throw new ApiError(400, "chaneel format is invalid")
  }

});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
