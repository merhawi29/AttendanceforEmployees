import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthRequest } from "../types";
import prisma from "../config/database";
import { asyncHandler, sendSuccess, AppError } from "../utils/response";

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found", undefined, "USER_NOT_FOUND");
  }

  const isValid = await bcrypt.compare(oldPassword, user.password);
  if (!isValid) {
    throw new AppError(400, "Incorrect old password", undefined, "INCORRECT_PASSWORD");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  sendSuccess(res, null, "Password changed successfully");
});
