class Personaje {
  constructor({ PersonajeID, Nombre, Vida, Energia, Combo, Ultra, Estado, Ciudad, Categoria, Saga, combo1Name, combo2Name, combo3Name, ultraName }) {
    this.PersonajeID = PersonajeID;
    this.Nombre = Nombre;
    this.Vida = this.validarRango(Vida, 0, 100, 'Vida');
    this.Energia = this.validarRango(Energia, 0, 100, 'Energia');
    this.Combo = Combo;
    this.Ultra = this.validarRango(Ultra, 0, 100, 'Ultra');
    this.Estado = this.validarEstado(Estado);
    this.Ciudad = Ciudad;
    this.Categoria = this.validarCategoria(Categoria);
    this.Saga = Saga;
    this.combo1Name = combo1Name;
    this.combo2Name = combo2Name;
    this.combo3Name = combo3Name;
    this.ultraName = ultraName;
  }

  validarRango(valor, min, max, campo) {
    if (typeof valor !== 'number' || valor < min || valor > max) {
      throw new Error(`${campo} debe estar entre ${min} y ${max}`);
    }
    return valor;
  }

  validarEstado(estado) {
    const estados = ['Normal', 'Aturdido', 'Cansado', 'Potenciado'];
    if (!estados.includes(estado)) {
      throw new Error(`Estado inválido: ${estado}`);
    }
    return estado;
  }

  validarCategoria(categoria) {
    const categorias = ['Héroe', 'Villano', 'Antihéroe', 'Antivillano'];
    if (!categorias.includes(categoria)) {
      throw new Error(`Categoría inválida: ${categoria}`);
    }
    return categoria;
  }
}

module.exports = Personaje; 