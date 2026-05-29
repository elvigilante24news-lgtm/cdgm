import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest, DirectorioQueryParams } from '../types';

export const listarDirectorio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, matricula, ciudad } = req.query as DirectorioQueryParams;

    // Construir condiciones de busqueda
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: any = {
      estado: 'activo',
      estado_pago: 'al_dia',
    };

    // Filtro por nombre (busca en nombre y apellido)
    if (nombre) {
      whereConditions.OR = [
        { nombre: { contains: nombre, mode: 'insensitive' } },
        { apellido: { contains: nombre, mode: 'insensitive' } },
      ];
    }

    // Filtro por matricula
    if (matricula) {
      whereConditions.numero_matricula = { contains: matricula, mode: 'insensitive' };
    }

    // Filtro por ciudad
    if (ciudad) {
      whereConditions.ciudad = { contains: ciudad, mode: 'insensitive' };
    }

    const usuarios = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        ciudad: true,
        estudio: true,
        foto_perfil: true,
        numero_matricula: true,
        instagram: true,
        facebook: true,
        pagina_web: true,
        linkedin: true,
        behance: true,
        created_at: true,
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    res.status(200).json({ success: true, data: usuarios });
  } catch (error) {
    console.error('Error listando directorio:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};
