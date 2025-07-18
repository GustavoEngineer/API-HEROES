const fs = require('fs');
const path = require('path');
const Personaje = require('../../domain/models/Personaje');

const DATA_PATH = path.join(__dirname, 'personajes.json');

function loadData() {
  if (!fs.existsSync(DATA_PATH)) return { personajes: [], currentId: 1 };
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  try {
    const data = JSON.parse(raw);
    return {
      personajes: data.personajes || [],
      currentId: data.currentId || 1
    };
  } catch {
    return { personajes: [], currentId: 1 };
  }
}

function saveData(personajes, currentId) {
  fs.writeFileSync(DATA_PATH, JSON.stringify({ personajes, currentId }, null, 2));
}

function normalizeString(str) {
  return str
    ? str.normalize('NFD').replace(/[ -]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    : '';
}

class PersonajeRepository {
  constructor() {
    const data = loadData();
    this.personajes = data.personajes;
    this.currentId = data.currentId;
  }

  getAll({ Categoria, Saga } = {}) {
    let result = this.personajes;
    if (Categoria) {
      result = result.filter(p => p.Categoria === Categoria);
    }
    if (Saga) {
      const sagaNorm = normalizeString(Saga);
      result = result.filter(p => normalizeString(p.Saga) === sagaNorm);
    }
    return result;
  }

  getById(id) {
    return this.personajes.find(p => p.PersonajeID === id);
  }

  create(data) {
    const personaje = new Personaje({
      ...data,
      PersonajeID: this.currentId++,
      Vida: 100,
      Energia: 50,
      Combo: 0,
      Ultra: 0,
      Estado: 'Normal',
    });
    this.personajes.push(personaje);
    saveData(this.personajes, this.currentId);
    return personaje;
  }

  update(id, data) {
    const index = this.personajes.findIndex(p => p.PersonajeID === id);
    if (index === -1) return null;
    const old = this.personajes[index];
    const updated = new Personaje({
      ...old,
      ...data,
      PersonajeID: id,
    });
    this.personajes[index] = updated;
    saveData(this.personajes, this.currentId);
    return updated;
  }

  delete(id) {
    const index = this.personajes.findIndex(p => p.PersonajeID === id);
    if (index === -1) return false;
    this.personajes.splice(index, 1);
    saveData(this.personajes, this.currentId);
    return true;
  }
}

module.exports = new PersonajeRepository(); 