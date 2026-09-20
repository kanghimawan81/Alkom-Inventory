import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Seed Users
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN',
    },
  })

  const pimpinan = await prisma.user.upsert({
    where: { username: 'pimpinan' },
    update: {},
    create: {
      username: 'pimpinan',
      password: hashedPassword,
      name: 'Komandan Satuan',
      role: 'PIMPINAN',
    },
  })

  // Seed Satuan
  const satuan1 = await prisma.satuan.upsert({
    where: { kodeSatuan: 'SAT-01' },
    update: {},
    create: {
      nama: 'Koopsudnas',
      kodeSatuan: 'SAT-01',
    },
  })

  const satuan2 = await prisma.satuan.upsert({
    where: { kodeSatuan: 'SAT-02' },
    update: {},
    create: {
      nama: 'Mabesau',
      kodeSatuan: 'SAT-02',
    },
  })

  const operator1 = await prisma.user.upsert({
    where: { username: 'operator_sat1' },
    update: {},
    create: {
      username: 'operator_sat1',
      password: hashedPassword,
      name: 'Koopsudnas',
      role: 'OPERATOR_SATUAN',
      satuanId: satuan1.id,
    },
  })

  console.log({ admin, pimpinan, satuan1, satuan2, operator1 })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
