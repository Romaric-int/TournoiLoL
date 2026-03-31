-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptDm" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lookingForTeam" BOOLEAN NOT NULL DEFAULT false;
