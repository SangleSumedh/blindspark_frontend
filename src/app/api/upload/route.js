import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Upload to Cloudinary (reports folder)
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "blindspark/reports",
      resource_type: "image",
    });

    return NextResponse.json({ 
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id 
    });

  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
