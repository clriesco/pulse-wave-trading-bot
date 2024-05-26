import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf, colorize } = format;

const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
  level: 'debug', // Ajusta el nivel mínimo de log a mostrar
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    new transports.Console({
      level: 'debug', // Asegúrate de que el transporte de consola está configurado correctamente
    }),
  ],
});

export default logger;
