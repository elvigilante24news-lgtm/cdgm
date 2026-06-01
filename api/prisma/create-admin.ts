import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Admin1234!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cdgm.com' },
    update: {},
    create: {
      email: 'admin@cdgm.com',
      password,
      tipo: 'administrador',
      nombre: 'Administrador',
      apellido: 'CDGM',
      dni: '00000000',
      ciudad: 'Posadas',
      celular: '3764000000',
      domicilio: 'Sede CDGM',
      estado: 'activo',
      estado_pago: 'al_dia',
    },
  });

  console.log('✅ Admin creado:', admin.email);
  console.log('📧 Email:', admin.email);
  console.log('🔑 Password: Admin1234!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());