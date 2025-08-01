# Sistema de Turnos en Batallas 3v3 - Documentación Técnica

## 📋 **Definición del Sistema según la API**

### **Estructura de Datos Principal**
```javascript
{
  turnoActual: 1,        // 1 = Equipo 1, 2 = Equipo 2
  idxActivo1: 0,         // Índice del personaje activo del Equipo 1 (0, 1, 2)
  idxActivo2: 0,         // Índice del personaje activo del Equipo 2 (0, 1, 2)
  rondaActual: 1,        // Número de ronda actual
  rondas: [              // Array de rondas con estados de personajes
    {
      numero: 1,
      estadoEquipo1: [   // Estados de los 3 personajes del equipo 1
        { id, nombre, hp, energia, combo, ultra, estado, ultraUsado },
        { id, nombre, hp, energia, combo, ultra, estado, ultraUsado },
        { id, nombre, hp, energia, combo, ultra, estado, ultraUsado }
      ],
      estadoEquipo2: [   // Estados de los 3 personajes del equipo 2
        { id, nombre, hp, energia, combo, ultra, estado, ultraUsado },
        { id, nombre, hp, energia, combo, ultra, estado, ultraUsado },
        { id, nombre, hp, energia, combo, ultra, estado, ultraUsado }
      ]
    }
  ]
}
```

## 🔄 **Lógica de Turnos**

### **1. Determinación del Personaje Activo**
```javascript
// Según la API:
const currentTurn = batalla.turnoActual;           // 1 o 2
const activeIndex = currentTurn === 1 ? 
    batalla.idxActivo1 : batalla.idxActivo2;       // 0, 1, o 2

// Obtener el personaje activo:
const rondaActual = batalla.rondas[batalla.rondaActual - 1];
const activeCharacter = currentTurn === 1 ? 
    rondaActual.estadoEquipo1[activeIndex] : 
    rondaActual.estadoEquipo2[activeIndex];
```

### **2. Flujo de Turnos**
```
Turno 1: Equipo 1, Personaje 1 (idxActivo1 = 0)
Turno 2: Equipo 2, Personaje 1 (idxActivo2 = 0)
Turno 3: Equipo 1, Personaje 1 (idxActivo1 = 0)
Turno 4: Equipo 2, Personaje 1 (idxActivo2 = 0)
...
```

### **3. Cambio de Personaje (Solo por KO)**
```javascript
// Si un personaje es derrotado (HP ≤ 0):
if (batalla.turnoActual === 1) {
    if (batalla.idxActivo2 < 2) {
        batalla.idxActivo2++;  // Siguiente personaje del equipo 2
    } else {
        // Equipo 2 derrotado, gana Equipo 1
        batalla.estado = 'Finalizada';
        batalla.ganador = 'Equipo 1';
    }
} else {
    if (batalla.idxActivo1 < 2) {
        batalla.idxActivo1++;  // Siguiente personaje del equipo 1
    } else {
        // Equipo 1 derrotado, gana Equipo 2
        batalla.estado = 'Finalizada';
        batalla.ganador = 'Equipo 2';
    }
}
```

### **4. Nueva Ronda**
```javascript
// Cuando se derrota al último personaje de un equipo:
if (avanzarRonda && batalla.estado !== 'Finalizada') {
    // Finalizar ronda actual
    rondaActual.fin = `Ronda ${batalla.rondaActual} finalizada por KO`;
    
    // Avanzar ronda
    batalla.rondaActual++;
    
    // Reiniciar índices
    batalla.idxActivo1 = 0;
    batalla.idxActivo2 = 0;
    
    // Crear nueva ronda con personajes reiniciados
    const nuevaRonda = {
        numero: batalla.rondaActual,
        estadoEquipo1: [/* personajes con HP=100, energia=50, etc */],
        estadoEquipo2: [/* personajes con HP=100, energia=50, etc */]
    };
    batalla.rondas.push(nuevaRonda);
}
```

## 🎯 **Implementación en el Frontend**

### **Función getActiveCharacter() Corregida**
```javascript
getActiveCharacter() {
    if (!this.currentBattle) return null;

    // Obtener la ronda actual según la API
    const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
    if (!rondaActual) {
        console.error('No se encontró la ronda actual');
        return null;
    }

    // Determinar el equipo activo y su índice según la API
    const currentTurn = this.currentBattle.turnoActual;
    const activeIndex = currentTurn === 1 ? this.currentBattle.idxActivo1 : this.currentBattle.idxActivo2;
    
    // Obtener el personaje activo del equipo correspondiente
    let activeCharacter = null;
    if (currentTurn === 1 && rondaActual.estadoEquipo1) {
        activeCharacter = rondaActual.estadoEquipo1[activeIndex];
    } else if (currentTurn === 2 && rondaActual.estadoEquipo2) {
        activeCharacter = rondaActual.estadoEquipo2[activeIndex];
    }

    if (!activeCharacter) {
        console.error('No se pudo obtener el personaje activo:', {
            currentTurn,
            activeIndex,
            estadoEquipo1: rondaActual.estadoEquipo1,
            estadoEquipo2: rondaActual.estadoEquipo2
        });
        return null;
    }

    return activeCharacter;
}
```

### **Función isPlayerActive() Corregida**
```javascript
isPlayerActive(playerId) {
    if (!this.currentBattle) return false;

    // Obtener la ronda actual según la API
    const rondaActual = this.currentBattle.rondas?.[this.currentBattle.rondaActual - 1];
    if (!rondaActual) return false;

    // Determinar el equipo activo y su índice según la API
    const currentTurn = this.currentBattle.turnoActual;
    const activeIndex = currentTurn === 1 ? this.currentBattle.idxActivo1 : this.currentBattle.idxActivo2;
    
    // Verificar si este jugador es el activo
    if (playerId.includes('team1') && currentTurn === 1) {
        const playerIndex = parseInt(playerId.replace('team1-player', '')) - 1;
        return playerIndex === activeIndex;
    } else if (playerId.includes('team2') && currentTurn === 2) {
        const playerIndex = parseInt(playerId.replace('team2-player', '')) - 1;
        return playerIndex === activeIndex;
    }

    return false;
}
```

## 🔧 **Correcciones Implementadas**

### **1. Problema Original**
- El frontend no estaba leyendo correctamente la estructura de datos de la API
- No se obtenía el personaje activo desde `rondas[].estadoEquipoX[]`
- Los índices no coincidían con la lógica de la API

### **2. Solución Implementada**
- ✅ Lectura correcta de `rondas[rondaActual - 1]`
- ✅ Uso correcto de `idxActivo1` e `idxActivo2`
- ✅ Acceso a `estadoEquipo1[]` y `estadoEquipo2[]`
- ✅ Validación de datos con logging detallado

### **3. Validaciones Agregadas**
```javascript
// Verificar que existe la ronda actual
if (!rondaActual) {
    console.error('No se encontró la ronda actual');
    return null;
}

// Verificar que existe el personaje activo
if (!activeCharacter) {
    console.error('No se pudo obtener el personaje activo:', {
        currentTurn,
        activeIndex,
        estadoEquipo1: rondaActual.estadoEquipo1,
        estadoEquipo2: rondaActual.estadoEquipo2
    });
    return null;
}
```

## 📊 **Ejemplo de Flujo Completo**

### **Inicio de Batalla**
```javascript
// Estado inicial:
{
  turnoActual: 1,
  idxActivo1: 0,
  idxActivo2: 0,
  rondaActual: 1,
  rondas: [{
    numero: 1,
    estadoEquipo1: [
      { id: "1", nombre: "Spider-Man", hp: 100, energia: 50, ... },
      { id: "2", nombre: "Iron Man", hp: 100, energia: 50, ... },
      { id: "3", nombre: "Flash", hp: 100, energia: 50, ... }
    ],
    estadoEquipo2: [
      { id: "4", nombre: "Darth Vader", hp: 100, energia: 50, ... },
      { id: "5", nombre: "Loki", hp: 100, energia: 50, ... },
      { id: "6", nombre: "Venom", hp: 100, energia: 50, ... }
    ]
  }]
}

// Personaje activo: Spider-Man (Equipo 1, Personaje 1)
```

### **Después de una Acción**
```javascript
// Equipo 1 ejecuta "Ataque Básico"
// Resultado: Darth Vader HP = 85, turno pasa a Equipo 2

{
  turnoActual: 2,  // Cambió de 1 a 2
  idxActivo1: 0,   // No cambió
  idxActivo2: 0,   // No cambió
  // ... resto igual
}

// Personaje activo: Darth Vader (Equipo 2, Personaje 1)
```

### **Después de un KO**
```javascript
// Darth Vader es derrotado (HP = 0)
// Resultado: idxActivo2 cambia a 1

{
  turnoActual: 1,  // Volvió a Equipo 1
  idxActivo1: 0,   // No cambió
  idxActivo2: 1,   // Cambió de 0 a 1
  // ... resto igual
}

// Personaje activo: Spider-Man (Equipo 1, Personaje 1)
// Siguiente personaje del Equipo 2: Loki (índice 1)
```

## 🎮 **Uso en la Interfaz**

### **Indicadores Visuales**
- **Turno Actual**: Muestra "Equipo 1" o "Equipo 2"
- **Personaje Activo**: Indicador verde en la tarjeta del personaje activo
- **Estados**: KO (rojo), Defendiendo (azul), Vulnerable (naranja)

### **Controles**
- **Botones de Acción**: Solo funcionan para el personaje activo
- **Teclas 1-6**: Acciones rápidas
- **Validaciones**: La API valida que el personaje correcto ejecute la acción

## ✅ **Estado Actual**

El sistema de turnos está completamente corregido y sincronizado con la API. La lógica del frontend ahora coincide exactamente con la implementación del backend, eliminando el error "No se pudo determinar el personaje activo". 