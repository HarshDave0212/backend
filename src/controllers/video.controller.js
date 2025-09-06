import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  //TODO: get all videos based on query, sort, pagination
  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid videoId format");
  }

  const existUser = await User.findById(userId);
  if (!existUser) {
    throw new ApiError(400, "User does not exist");
  }
  const skip = (Number(page) - 1) * Number(limit);

  const sortOrder = sortType === "asc" ? 1 : -1;

  const matchStage = {
    owner: new mongoose.Types.ObjectId(userId),
    title: { $regex: query, $options: "i" },
  };

  const aggregationPipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    {
      $project: {
        title: 1,
        description: 1,
        createdAt: 1,
        views: 1,
        isPublished: 1,
        thumbnail: 1,
        duration: 1,
        "owner._id": 1,
        "owner.username": 1,
        "owner.avatar": 1,
      },
    },
    { $sort: { [sortBy]: sortOrder } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await Video.aggregate(aggregationPipeline);

  const videos = result[0].data;
  const total = result[0].totalCount[0]?.count || 0;

  return res.status(200).json(
    new ApiResponse(200, {
      videos,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalVideos: total,
    })
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title || !description) {
    throw new ApiError(400, "All field are required");
  }

  const videoFileLocalPath = req.file?.videoFile[0]?.path;
  const thumbnailLocalPath = req.file?.thumbnail[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile.url) {
    throw new ApiError(400, "videoFile is required");
  }

  if (!thumbnail.url) {
    throw new ApiError(400, "thumbnail is required");
  }

  const video = await Video.create({
    owner: req.user._id,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videoFile.duration,
  });
  if (!video) {
    throw new ApiError(500, "Video not published");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video is published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) {
    throw new ApiError(400, "VideoId required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalis Video id format");
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetcehd successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "videoId is missing");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video does not exist");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "All fields are required ");
  }

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is missing");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail.url) {
    throw new ApiError(500, "Thumbnail is failed to upload");
  }

  const updatedvideo = await Video.findByIdAndUpdate(
    videoId,
    {
      title: title,
      description: description,
      thumbnail: thumbnail.url,
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedvideo, "Video details updated successfully")
    );

  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id format");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video does not exist");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Access deined");
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted succeffully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "videoId is missing");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video does not exist");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Accesss Denied");
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "Publish status is toggled successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
