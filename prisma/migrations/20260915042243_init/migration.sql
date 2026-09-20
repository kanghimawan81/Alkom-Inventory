-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PIMPINAN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Satuan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "kodeSatuan" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MasterStandarAlat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "satuanId" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "namaAlat" TEXT NOT NULL,
    "jumlahWajib" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MasterStandarAlat_satuanId_fkey" FOREIGN KEY ("satuanId") REFERENCES "Satuan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventarisTergelar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "satuanId" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "namaAlat" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 0,
    "kondisi" TEXT NOT NULL DEFAULT 'BAIK',
    "keterangan" TEXT,
    "diperbarui" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventarisTergelar_satuanId_fkey" FOREIGN KEY ("satuanId") REFERENCES "Satuan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Satuan_nama_key" ON "Satuan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Satuan_kodeSatuan_key" ON "Satuan"("kodeSatuan");

-- CreateIndex
CREATE UNIQUE INDEX "MasterStandarAlat_satuanId_namaAlat_key" ON "MasterStandarAlat"("satuanId", "namaAlat");

-- CreateIndex
CREATE INDEX "InventarisTergelar_satuanId_namaAlat_idx" ON "InventarisTergelar"("satuanId", "namaAlat");
