import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video format is invalid");
  }

  const skip = (Number(page) - 1) * Number(limit);

  const commentsAggregation = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $facet: {
        metadata: [
          {
            $count: "total",
          },
        ],
        data: [
          { $skip: skip },
          { $limit: Number(limit) },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
          {
            $unwind: "$owner",
          },
          {
            $project: {
              _id: 1,
              content: 1,
              createdAt: 1,
              updatedAt: 1,
              "owner._id": 1,
              "owner.username": 1,
              "owner.avatar": 1,
            },
          },
        ],
      },
    },
  ]);
  const total = commentsAggregation[0]?.metadata[0]?.total || 0;

  const comment = commentsAggregation[0]?.data || [];

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalComments: total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        comment,
      },
      "Comments fetcehd successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const content = req.body.content?.trim();

  if (!content || !videoId) {
    throw new ApiError(400, "All fields are missing");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Please log in!");
  }

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: userId,
  });

  if (!comment) {
    throw new ApiError(500, "Something went wrong while creating comment");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const content = req.body.content?.trim();

  if (!content || !commentId) {
    throw new ApiError(400, "All fields are required");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId format");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Access Denied");
  }

  const updatedcomment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content: content },
    },
    { new: true }
  );

  if (!updatedcomment) {
    throw new ApiError(500, "Failed to update comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedcomment, "Comment updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "commentId is required");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId format");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Access Denied");
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
