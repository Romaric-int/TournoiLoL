-- AlterTable
ALTER TABLE "RiotAccount" ADD COLUMN     "iconUrl" TEXT,
ADD COLUMN     "losses" INTEGER,
ADD COLUMN     "lp" INTEGER,
ADD COLUMN     "prevRank" TEXT,
ADD COLUMN     "prevTier" TEXT,
ADD COLUMN     "profileIconId" INTEGER,
ADD COLUMN     "rank" TEXT,
ADD COLUMN     "summonerId" TEXT,
ADD COLUMN     "tier" TEXT,
ADD COLUMN     "wins" INTEGER;
