import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { generarHash } from "../src/lib/auth-crypto";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.pago.deleteMany();
  await prisma.multa.deleteMany();
  await prisma.inscripcion.deleteMany();
  await prisma.partido.deleteMany();
  await prisma.jugador.deleteMany();
  await prisma.sesion.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.estadio.deleteMany();
  await prisma.clubConfig.deleteMany();

  const { hash: hashAdmin, salt: saltAdmin } = generarHash("demo123");
  const admin = await prisma.usuario.create({
    data: {
      nombre: "Marco",
      telefono: "51999999999",
      passwordHash: hashAdmin,
      salt: saltAdmin,
      rol: "admin",
    },
  });
  await prisma.jugador.create({
    data: { usuarioId: admin.id, apodo: "Marco", posicion: "Mediocampo", apellidos: "" },
  });

  const nombres = [
    "Antony García", "Cristhian Asmat", "Danfer Jhoel", "Daniel Saavedra",
    "Eladio Sánchez", "Erick Arribasplata", "Gino Cubas", "Henry Gallardo",
    "Jampier Herrera", "Jhon Tanta",
  ];
  const jugadores = [];
  for (let i = 0; i < nombres.length; i++) {
    const [nombre, apellidos] = nombres[i].split(" ");
    const { hash, salt } = generarHash("jugador123");
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        telefono: `5199888${String(i).padStart(4, "0")}`,
        passwordHash: hash,
        salt,
        rol: "jugador",
      },
    });
    const jugador = await prisma.jugador.create({
      data: {
        usuarioId: usuario.id,
        apellidos,
        posicion: ["Arquero", "Defensa", "Mediocampo", "Delantero"][i % 4],
      },
    });
    jugadores.push(jugador);
  }

  await prisma.clubConfig.create({
    data: { id: 1, nombreYape: "Marco Ramirez", telefonoYape: "999999999" },
  });

  const estadio = await prisma.estadio.create({
    data: { nombre: "Polideportivo Qapac Ñam", costoCancha: 120, costoPorJugador: 10 },
  });

  const partidoProgramado = await prisma.partido.create({
    data: {
      fecha: "2026-09-20",
      hora: "19:00",
      cancha: estadio.nombre,
      cupoMax: 14,
      costoCancha: 120,
      costoPorJugador: 10,
      estado: "programado",
    },
  });

  for (const j of jugadores.slice(0, 6)) {
    await prisma.inscripcion.create({
      data: { partidoId: partidoProgramado.id, jugadorId: j.id, estado: "confirmado" },
    });
  }

  const partidoJugado = await prisma.partido.create({
    data: {
      fecha: "2026-09-06",
      hora: "19:00",
      cancha: estadio.nombre,
      cupoMax: 14,
      costoCancha: 120,
      costoPorJugador: 10,
      estado: "jugado",
    },
  });

  for (let i = 0; i < jugadores.length; i++) {
    const asistio = i < 7 ? "llego" : i === 7 ? "tardanza" : "no_llego";
    const insc = await prisma.inscripcion.create({
      data: { partidoId: partidoJugado.id, jugadorId: jugadores[i].id, estado: "confirmado", asistio },
    });
    if (asistio === "llego") {
      await prisma.pago.create({
        data: { inscripcionId: insc.id, monto: 10, estado: i % 3 === 0 ? "pendiente" : "verificado" },
      });
    }
    if (asistio === "tardanza") {
      await prisma.multa.create({
        data: { jugadorId: jugadores[i].id, partidoId: partidoJugado.id, tipo: "tardanza", monto: 5 },
      });
    }
    if (asistio === "no_llego") {
      await prisma.multa.create({
        data: { jugadorId: jugadores[i].id, partidoId: partidoJugado.id, tipo: "no_asistio", monto: 10 },
      });
    }
  }

  console.log(`Seed OK: ${jugadores.length + 1} jugadores, 2 partidos, admin=51999999999/demo123, jugador de ejemplo=${jugadores[0] ? "51998880000" : ""}/jugador123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
