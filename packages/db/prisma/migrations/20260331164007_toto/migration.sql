/*
  Warnings:

  - A unique constraint covering the columns `[teamId,role]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT');

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "role" "Role";

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_role_key" ON "TeamMember"("teamId", "role");
