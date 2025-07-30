class Batalla {
  constructor({ BatallaID, Personaje1, Personaje2, Estado, TurnoActual, Ganador, Activa, historial }) {
    this.BatallaID = BatallaID; // ID único autoincremental
    this.Personaje1 = Personaje1; // { ID, Nombre, HP, Energia, Combo, Ultra, Estado }
    this.Personaje2 = Personaje2; // { ID, Nombre, HP, Energia, Combo, Ultra, Estado }
    this.Estado = Estado || 'En curso'; // 'En curso' o 'Finalizada'
    this.TurnoActual = TurnoActual; // 1 o 2
    this.Ganador = Ganador || null; // Nombre o ID del ganador
    this.Activa = Activa !== undefined ? Activa : true;
    this.historial = Array.isArray(historial) ? historial : [];
  }
}

module.exports = Batalla; 