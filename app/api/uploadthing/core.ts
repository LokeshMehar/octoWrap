import { db } from "@/db";
import sharp from "sharp";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";
import { PrismaClient } from '@prisma/client';

const f = createUploadthing();

const prisma = new PrismaClient()

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .input(z.object({ configId: z.string().optional() }))
    .middleware(async ({ input }) =>
    {
      return { input };
    })
    .onUploadComplete(async ({ metadata, file }) =>
    {
      console.log("Fetching file from URL...");
      const { configId } = metadata.input;

      const res = await fetch(file.url);
      const buffer = await res.arrayBuffer();

      console.log("Processing image with sharp...");
      const imgMetadata = await sharp(buffer).metadata();
      const { width, height } = imgMetadata;

      if (!configId)
      {
        console.log("Creating new configuration in the database...");
        const configuration = await prisma.configuration.create({
          data: {
            croppedImageUrl: file.url,
            imageUrl: file.url,
            width: width || 500,
            height: height || 500,
          },
        })

        console.log("New configuration created with ID:", configuration.id);
        return { configId: configuration.id };
      } else
      {
        console.log("Updating existing configuration in the database...");
        const updatedConfiguration = await db.configuration.update({
          where: {
            id: configId,
          },
          data: {
            croppedImageUrl: file.url,
          },
        });

        console.log("Configuration updated with ID:", updatedConfiguration.id);
        return { configId: updatedConfiguration.id };
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
