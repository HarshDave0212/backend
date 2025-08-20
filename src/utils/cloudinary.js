import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    //upload
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //successfully uploaded
    // console.log("File uploaded Successfully", response);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // if upload fails it deletes the temporarily saved file from local server
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
