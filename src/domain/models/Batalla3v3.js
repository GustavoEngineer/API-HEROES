class Batalla3v3 {
  constructor({ BatallaID, Equipo1, Equipo2, Estado, TurnoActual, Ganador, Activa, historial, idxActivo1, idxActivo2 }) {
    this.BatallaID = BatallaID;
    this.Equipo1 = Equipo1; // Array de 3 personajes (cada uno con sus atributos)
    this.Equipo2 = Equipo2;
    this.Estado = Estado || 'En curso';
    this.TurnoActual = TurnoActual; // 1 o 2
    this.Ganador = Ganador || null;
    this.Activa = Activa !== undefined ? Activa : true;
    this.historial = Array.isArray(historial) ? historial : [];
    this.idxActivo1 = typeof idxActivo1 === 'number' ? idxActivo1 : 0; // índice del personaje activo en Equipo1
    this.idxActivo2 = typeof idxActivo2 === 'number' ? idxActivo2 : 0; // índice del personaje activo en Equipo2
  }
}

module.exports = Batalla3v3; 