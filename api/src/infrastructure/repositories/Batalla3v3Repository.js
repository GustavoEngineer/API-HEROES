const fs = require('fs');
const path = require('path');
const Batalla3v3 = require('../../domain/models/Batalla3v3');

const DATA_PATH = path.join(__dirname, 'batallas3v3.json');

function loadData() {
  if (!fs.existsSync(DATA_PATH)) return { batallas: [], currentId: 1 };
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  try {
    const data = JSON.parse(raw);
    return {
      batallas: data.batallas || [],
      currentId: data.currentId || 1
    };
  } catch {
    return { batallas: [], currentId: 1 };
  }
}

function saveData(batallas, currentId) {
  fs.writeFileSync(DATA_PATH, JSON.stringify({ batallas, currentId }, null, 2));
}

class Batalla3v3Repository {
  constructor() {
    const data = loadData();
    this.batallas = data.batallas;
    this.currentId = data.currentId;
  }

  getAll() {
    return this.batallas;
  }

  getById(id) {
    return this.batallas.find(b => b.BatallaID === id);
  }

  create(data) {
    const batalla = new Batalla3v3({
      ...data,
      BatallaID: this.currentId++
    });
    this.batallas.push(batalla);
    saveData(this.batallas, this.currentId);
    return batalla;
  }

  update(id, data) {
    const index = this.batallas.findIndex(b => b.BatallaID === id);
    if (index === -1) return null;
    const old = this.batallas[index];
    const updated = new Batalla3v3({
      ...old,
      ...data,
      BatallaID: id
    });
    this.batallas[index] = updated;
    saveData(this.batallas, this.currentId);
    return updated;
  }
}

module.exports = new Batalla3v3Repository(); 