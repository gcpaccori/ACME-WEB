// Si un local puede recibir pedidos ahora: sus interruptores (activo, acepta
// pedidos, abierto) y su horario del dia en hora de Lima. Es la misma regla
// que aplica el backend al cotizar, para que la web no muestre "Abierto" a
// un local que luego no deja pagar.
//
// Un cierre a las 00:00 cuenta como medianoche, y un cierre menor que la
// apertura cruza la medianoche (por ejemplo 18:00 a 02:00).

export interface BranchHourRow {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface BranchClosureRow {
  starts_at: string;
  ends_at: string;
}

export interface BranchScheduleInput {
  accepts_orders: boolean;
  is_open: boolean;
  accepting_orders: boolean;
  hours: BranchHourRow[];
  closures: BranchClosureRow[];
}

export interface BranchOpenState {
  open: boolean;
  // Texto corto para el cliente: "Abre hoy a las 4:00 p. m.", o vacio.
  next_opening: string;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// Peru no tiene horario de verano: siempre UTC-5.
function limaClock(now: Date) {
  const lima = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return { dow: lima.getUTCDay(), minutes: lima.getUTCHours() * 60 + lima.getUTCMinutes() };
}

function toMinutes(value: string) {
  const [hours, minutes] = String(value || '').split(':').map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return (hours % 24) * 60 + minutes;
}

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const suffix = hours < 12 ? 'a. m.' : 'p. m.';
  return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${suffix}`;
}

function rowFor(hours: BranchHourRow[], dow: number) {
  return hours.find((row) => Number(row.day_of_week) === dow) ?? null;
}

function isWithin(row: BranchHourRow | null, minutes: number, previousDay = false) {
  if (!row || row.is_closed) return false;
  const start = toMinutes(row.open_time);
  let end = toMinutes(row.close_time);
  if (start === null || end === null) return false;
  if (end === 0) end = 24 * 60;
  if (end > start) return !previousDay && minutes >= start && minutes < end;
  return previousDay ? minutes < end : minutes >= start;
}

function nextOpening(hours: BranchHourRow[], dow: number, minutes: number) {
  for (let offset = 0; offset < 7; offset += 1) {
    const day = (dow + offset) % 7;
    const row = rowFor(hours, day);
    if (!row || row.is_closed) continue;
    const start = toMinutes(row.open_time);
    if (start === null) continue;
    if (offset === 0) {
      if (start > minutes) return `Abre hoy a las ${formatTime(start)}`;
      continue;
    }
    if (offset === 1) return `Abre mañana a las ${formatTime(start)}`;
    return `Abre el ${WEEKDAYS[day]} a las ${formatTime(start)}`;
  }
  return '';
}

export function getBranchOpenState(branch: BranchScheduleInput | null | undefined, now: Date = new Date()): BranchOpenState {
  if (!branch) return { open: false, next_opening: '' };
  if (!branch.accepts_orders || !branch.is_open || !branch.accepting_orders) return { open: false, next_opening: '' };

  const nowMs = now.getTime();
  const inClosure = branch.closures.some((closure) => {
    const starts = Date.parse(closure.starts_at);
    const ends = Date.parse(closure.ends_at);
    return Number.isFinite(starts) && Number.isFinite(ends) && starts <= nowMs && nowMs <= ends;
  });
  if (inClosure) return { open: false, next_opening: '' };

  // Sin horario cargado manda el interruptor de abierto/cerrado.
  if (branch.hours.length === 0) return { open: true, next_opening: '' };

  const { dow, minutes } = limaClock(now);
  const open = isWithin(rowFor(branch.hours, dow), minutes) || isWithin(rowFor(branch.hours, (dow + 6) % 7), minutes, true);
  return { open, next_opening: open ? '' : nextOpening(branch.hours, dow, minutes) };
}
