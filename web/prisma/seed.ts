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
  await prisma.plantillaMensaje.deleteMany();

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

  const plantillasPorTipo: Record<string, string[]> = {
    recordatorio: [
      "🔥 ¡Hoy se juega, {nombre}! Nos vemos a las {hora} en {cancha}. Trae las ganas — la pelota no espera a los que llegan tarde ⏱️⚽",
      "{saludo} {nombre}! Recuerda que hoy tenemos pichanga a las {hora} en {cancha}. Aporte: S/ {costo}. ¡Nos vemos ahí, crack! ⚽😄",
      "⚽ Once amigos, una pelota, una cancha. Hoy a las {hora} en {cancha} nos vemos para la pichanga de siempre. ¡No faltes, {nombre}! 🔥",
    ],
    pago_pendiente: [
      "{saludo} {nombre} 👋 Antes de que te pite el árbitro… todavía falta tu Yape (S/ {costo}) para la pichanga del {fecha} a las {hora}. Si no llega, tu cupo se libera automáticamente 6 horas antes del partido. ¡No dejes que se enfríe! 💸⚽",
      "{saludo} {nombre}, un recordatorio nomás: falta tu comprobante de pago (S/ {costo}) para la pichanga del {fecha} a las {hora}. Yapea y sube tu captura para asegurar tu cupo 🙏⚽",
    ],
    cupo_liberado: [
      "🟥 {nombre}, tarjeta roja para tu cupo esta vez — se liberó porque no llegó el pago a tiempo para la pichanga del {fecha} a las {hora} en {cancha}. Sin rencores, revisa la app por si todavía hay sitio 👀⚽",
      "⏱️ Se acabó el tiempo, {nombre} — tu cupo para la pichanga del {fecha} a las {hora} quedó libre por falta de pago. Revisa la app, capaz todavía alcanzas 👟",
    ],
    promovido: [
      "🟢 ¡Entras a jugar, {nombre}! Se liberó un cupo y quedaste CONFIRMADO para la pichanga del {fecha} a las {hora} en {cancha}. Aporte: S/ {costo} — yapea pronto para no perder tu titularidad 🔥⚽",
      "🎉 Buenas noticias, {nombre}: se liberó un cupo y ahora estás CONFIRMADO para el {fecha} a las {hora} en {cancha}. Aporte: S/ {costo} — ¡nos vemos en la cancha! ⚽",
    ],
    cierre_partido: [
      "🔥 ¡Qué pichanga la de hoy, {nombre}! Gracias por venir y darlo todo en la cancha. ¡Nos vemos en la próxima! ⚽💪",
      "👏 Excelente nivel el de hoy, {nombre}. Se sintió el equipo. ¡A seguir así para la próxima pichanga! ⚽🔥",
      "⚽ Gracias por jugar hoy, {nombre} — esas jugadas se disfrutan. ¡Nos vemos pronto para la revancha! 💪😄",
    ],
    multa_pendiente: [
      "{saludo} {nombre} 👋 Tienes una multa pendiente de S/ {monto}. Cuando puedas, súbela en la app para ponerte al día 🙏⚽",
      "{saludo} {nombre}, un recordatorio nomás: te queda una multa de S/ {monto} sin pagar. Yapea y sube tu comprobante cuando puedas 💸",
    ],
  };
  for (const [tipo, textos] of Object.entries(plantillasPorTipo)) {
    for (const texto of textos) {
      await prisma.plantillaMensaje.create({ data: { tipo, texto, fechaCreacion: new Date().toISOString() } });
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
