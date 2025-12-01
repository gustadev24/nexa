# 📘 Manual de Usuario - Nexa

**Juego de Estrategia en Tiempo Real sobre Grafos**  
**Versión:** 1.0.0  
**Fecha:** Diciembre 2025

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Requisitos del Sistema](#2-requisitos-del-sistema)
3. [Instalación y Acceso](#3-instalación-y-acceso)
4. [Primeros Pasos](#4-primeros-pasos)
5. [Interfaz del Juego](#5-interfaz-del-juego)
6. [Cómo Jugar](#6-cómo-jugar)
7. [Mecánicas del Juego](#7-mecánicas-del-juego)
8. [Estrategias y Consejos](#8-estrategias-y-consejos)
9. [Preguntas Frecuentes](#9-preguntas-frecuentes)
10. [Solución de Problemas](#10-solución-de-problemas)

---

## 1. Introducción

### ¿Qué es Nexa?

**Nexa** es un juego de estrategia en tiempo real donde dos jugadores compiten por el control de un campo de batalla representado como un **grafo** (red de nodos conectados). El objetivo es gestionar inteligentemente la **energía** para conquistar nodos y alcanzar la victoria.

### Concepto del Juego

- **Campo de Batalla:** Un grafo con nodos (círculos) conectados por aristas (líneas)
- **Recurso Principal:** Energía que fluye entre nodos
- **Objetivo:** Dominar el campo mediante control estratégico de nodos

### Modos de Victoria

1. **Dominancia:** Controlar el 70% de los nodos durante 10 segundos continuos
2. **Tiempo Límite:** Tener más nodos al finalizar los 3 minutos
3. **Eliminación:** Capturar el nodo inicial del oponente

---

## 2. Requisitos del Sistema

### Requisitos Mínimos

| Componente | Requisito |
|------------|-----------|
| **Navegador** | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |
| **Sistema Operativo** | Windows 10, macOS 10.15+, Linux (Ubuntu 20.04+) |
| **Resolución** | 1280 x 720 píxeles mínimo |
| **Memoria RAM** | 2 GB mínimo |
| **JavaScript** | Habilitado (esencial) |
| **Conexión a Internet** | Requerida para descarga inicial |

### Requisitos Recomendados

| Componente | Recomendación |
|------------|---------------|
| **Resolución** | 1920 x 1080 píxeles |
| **Memoria RAM** | 4 GB o más |
| **Procesador** | Dual-core 2.0 GHz o superior |

---

## 3. Instalación y Acceso

### Opción A: Jugar Online (Recomendado)

1. **Abrir navegador web**
2. **Visitar la URL del juego**
3. **Esperar carga de recursos** (primera vez puede tardar unos segundos)
4. **¡Listo para jugar!**

### Opción B: Instalación Local (Desarrolladores)

```bash
# 1. Clonar repositorio
git clone https://github.com/gustadev24/nexa.git
cd nexa

# 2. Instalar dependencias
pnpm install

# 3. Ejecutar en desarrollo
pnpm dev

# 4. Abrir navegador en http://localhost:8080
```

---

## 4. Primeros Pasos

### Iniciar una Partida

1. **Pantalla de Inicio**
   - Aparece el menú principal con el logo de Nexa
   - Opción: "Iniciar Partida"

2. **Configuración de Jugadores**
   - Jugador 1: Color Azul
   - Jugador 2: Color Rojo
   - (Los nombres pueden ser editables según implementación)

3. **Generación del Campo**
   - El sistema genera automáticamente el grafo de juego
   - Cada jugador recibe un nodo inicial (base)
   - Los nodos están conectados por aristas

4. **¡Comienza la Partida!**
   - El temporizador inicia en 0:00
   - Ambos jugadores pueden empezar a enviar energía

---

## 5. Interfaz del Juego

### Pantalla Principal de Juego

```
┌─────────────────────────────────────────────────────┐
│  ⏱️  Tiempo: 01:23        🏆 Dominancia: 45%       │  ← HUD Superior
├─────────────────────────────────────────────────────┤
│                                                     │
│          ⚪ ─── ⚪         Nodos Neutros            │
│           │      │                                  │
│          🔵 ─── 🔴         Nodos de Jugadores      │
│           │      │                                  │
│          ⚪ ─── ⚪         Aristas Conectoras        │
│                                                     │
│          💠 → → →          Paquetes de Energía     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  🔋 Energía Total: 500    📊 Nodos: 5/15           │  ← HUD Inferior
└─────────────────────────────────────────────────────┘
```

### Elementos de la Interfaz

#### 1. HUD Superior

- **Temporizador:** Muestra el tiempo transcurrido (máximo 3:00)
- **Porcentaje de Dominancia:** Indica qué jugador domina más nodos
- **Advertencias:** Notificaciones de eventos importantes

#### 2. Campo de Juego (Centro)

- **Nodos:**
  - ⚪ **Blanco:** Nodos neutrales
  - 🔵 **Azul:** Nodos del Jugador 1
  - 🔴 **Rojo:** Nodos del Jugador 2
  - Tamaño indica cantidad de energía almacenada

- **Aristas:**
  - Líneas que conectan nodos
  - Los paquetes de energía viajan por estas líneas

- **Paquetes de Energía:**
  - Pequeñas partículas en movimiento
  - Color indica el propietario

#### 3. HUD Inferior

- **Energía Total:** Suma de energía en todos tus nodos
- **Contador de Nodos:** Nodos controlados / Total de nodos
- **Información Adicional:** Puede incluir tipo de nodo seleccionado

### Tipos de Nodos (Visual)

Los nodos pueden tener diferentes apariencias según su tipo:

- **Nodo Básico:** Círculo simple
- **Nodo de Ataque:** Con símbolo de espada ⚔️
- **Nodo de Defensa:** Con símbolo de escudo 🛡️
- **Nodo de Energía:** Más grande, con símbolo de rayo ⚡
- **Nodo Productivo:** Con símbolo de fábrica 🏭
- **Nodo Recolector:** Con símbolo de imán 🧲

---

## 6. Cómo Jugar

### Controles Básicos

#### Enviar Energía

**Método 1: Click Secuencial**
```
1. Click en nodo origen (tu nodo con energía)
2. Click en nodo destino (nodo conectado por arista)
3. Se envía 10% de la energía del nodo origen
```

**Método 2: Drag and Drop** (si está implementado)
```
1. Mantén click en nodo origen
2. Arrastra hacia nodo destino
3. Suelta para enviar energía
```

### Flujo de Juego Básico

```
┌─────────────────────────────────────────┐
│ 1. Analiza el grafo y localiza tu base │
├─────────────────────────────────────────┤
│ 2. Identifica nodos neutros cercanos    │
├─────────────────────────────────────────┤
│ 3. Envía energía para capturar nodos    │
├─────────────────────────────────────────┤
│ 4. Defiende tus nodos de ataques        │
├─────────────────────────────────────────┤
│ 5. Expande tu territorio                │
├─────────────────────────────────────────┤
│ 6. Controla ≥70% de nodos para ganar    │
└─────────────────────────────────────────┘
```

### Ciclos de Juego

El juego opera en **ciclos de tiempo**:

- **Ciclo de Defensa:** 30 milisegundos
- **Ciclo de Ataque:** 20 milisegundos

En cada ciclo:
1. Los paquetes de energía se mueven
2. Se procesan colisiones en aristas
3. Se resuelven ataques a nodos
4. Se actualizan contadores y HUD

---

## 7. Mecánicas del Juego

### 7.1. Gestión de Energía

#### Conservación de Energía

- **Principio:** La energía total del sistema se conserva
- **No se crea ni destruye:** Solo se redistribuye
- **Excepciones:** 
  - Colisiones destruyen energía
  - Nodos productivos pueden generar energía nueva

#### Capacidad de Nodos

Cada nodo tiene una **capacidad máxima** de energía:
- **Nodo Básico:** 100 unidades
- **Nodo de Energía:** 200 unidades
- **Otros tipos:** Varía según tipo

Si un nodo recibe más energía de su capacidad:
- ⚠️ **Desbordamiento:** Energía adicional se pierde

#### Energía en Tránsito

- Los paquetes de energía viajan a través de aristas
- **Velocidad:** Configurable (normalmente 2-3 píxeles/frame)
- **Tiempo de viaje:** Depende de la longitud de la arista
- La energía en tránsito **cuenta para tu total** pero no está disponible hasta llegar

---

### 7.2. Sistema de Conflictos

#### Colisiones en Aristas

Cuando dos paquetes de energía opuestos se encuentran en una arista:

```
Caso 1: Energías Iguales
🔵 50 ←→ 50 🔴
Resultado: Ambos destruidos
🔥 Colisión ❌

Caso 2: Energías Diferentes
🔵 70 ←→ 30 🔴
Resultado: 🔵 40 continúa →

Caso 3: Energías Aliadas
🔵 50 → → 30 🔵
Resultado: Pasan sin interactuar
```

#### Ataque a Nodos

Cuando un paquete de energía enemigo llega a un nodo:

```
Escenario 1: Nodo Enemigo con Defensa
🔴 Nodo (40 energía) + 🔵 Ataque (60)
├─ Ataque > Defensa
├─ Resultado: Nodo capturado por Azul
└─ Nueva energía del nodo: 60 - 40 = 20

Escenario 2: Nodo Enemigo, Ataque Débil
🔴 Nodo (60 energía) + 🔵 Ataque (40)
├─ Ataque < Defensa
├─ Resultado: Nodo sigue Rojo
└─ Nueva energía del nodo: 60 - 40 = 20

Escenario 3: Empate Perfecto
🔴 Nodo (50 energía) + 🔵 Ataque (50)
├─ Ataque = Defensa
├─ Resultado: Nodo neutralizado
└─ Nueva energía del nodo: 0 (neutral ⚪)
```

#### Energía Enemiga en Nodo Aliado

```
🔵 Nodo Aliado (30) + 🔴 Ataque (20)
├─ La energía enemiga se suma a la defensa
└─ Nueva energía del nodo: 30 + 20 = 50 🔵
```

#### Energías Aliadas Opuestas (¡Desperdicio!)

```
⚠️ ADVERTENCIA: Desperdicio de Energía

🔵 Nodo + 🔵 20 → + ← 30 🔵

Resultado:
├─ Ambas energías se anulan
├─ Se destruyen 20 unidades de cada lado
└─ ⚠️ Se muestra advertencia en pantalla
```

**Consejo:** ¡Evita enviar energía en direcciones opuestas desde el mismo nodo!

---

### 7.3. Captura de Nodos

#### Proceso de Captura

1. **Enviar Ataque:** Tu energía debe vencer la defensa del nodo enemigo
2. **Superioridad:** Tu ataque debe ser mayor que la energía del nodo
3. **Cambio de Propietario:** El nodo cambia a tu color
4. **Energía Residual:** La diferencia (ataque - defensa) queda en el nodo

#### Captura de Nodos Neutros

```
⚪ Nodo Neutral (0 energía) + 🔵 Ataque (30)
└─ Resultado: Nodo capturado por Azul con 30 de energía
```

Los nodos neutrales **no ofrecen resistencia**, son fáciles de capturar.

#### Nodo Inicial (Base)

- **Símbolo:** Corona 👑 o marcador especial
- **Importancia:** Si lo pierdes, **pierdes la partida**
- **Estrategia:** Defiéndelo a toda costa

---

### 7.4. Fragmentación del Grafo

#### Puntos de Articulación

Un **punto de articulación** es un nodo cuya pérdida divide tu grafo en partes desconectadas.

```
Ejemplo:

🔵 ─── 🔵 ─── 🔵
        │
       [A] ← Punto de articulación
        │
🔵 ─── 🔵 ─── 🔵

Si pierdes [A]:
├─ Tu grafo se divide en dos partes
└─ Solo conservas la parte conectada a tu base
```

#### Consecuencias de Fragmentación

1. **Detección:** El sistema detecta automáticamente puntos de articulación
2. **Pérdida:** Al perder un punto de articulación, se verifica conectividad
3. **Neutralización:** Los nodos desconectados de tu base se **neutralizan**
4. **Pérdida de Energía:** Pierdes toda la energía en nodos desconectados

**Consejo:** Crea rutas alternativas para evitar puntos únicos de fallo.

---

### 7.5. Condiciones de Victoria

#### Victoria por Dominancia

```
Requisitos:
✅ Controlar ≥70% de los nodos del grafo
✅ Mantener el control durante 10 segundos continuos

Ejemplo:
Grafo con 20 nodos
├─ Necesitas controlar: 14 nodos (70%)
└─ Durante: 10 segundos sin bajar de 14
```

**HUD muestra:** Barra de dominancia y tiempo acumulado

#### Victoria por Tiempo Límite

```
Al completarse 3:00 minutos:
├─ Se cuenta los nodos de cada jugador
├─ Jugador con más nodos gana
└─ Empate: Si tienen igual cantidad de nodos
```

**Consejo:** Si vas perdiendo en dominancia, enfócate en capturar más nodos antes del tiempo límite.

#### Victoria por Eliminación

```
Si capturas el nodo inicial del oponente:
├─ Victoria instantánea
└─ Fin de la partida
```

**Consejo Defensivo:** Rodea tu base de nodos aliados fuertes.

---

## 8. Estrategias y Consejos

### Para Principiantes

#### 1. Expande Gradualmente

```
❌ Error: Enviar toda tu energía de golpe
✅ Correcto: Enviar paquetes pequeños gradualmente

Razón: Mantén reservas para defender
```

#### 2. Prioriza Nodos Cercanos

```
Estrategia Inicial:
1. Captura nodos adyacentes a tu base
2. Crea un perímetro defensivo
3. Luego expande hacia el centro
```

#### 3. Observa al Oponente

```
Analiza:
├─ ¿Dónde está concentrando energía?
├─ ¿Qué nodos está atacando?
└─ ¿Tiene puntos débiles?
```

### Estrategias Avanzadas

#### Ataque Coordinado

```
Técnica:
1. Acumula energía en varios nodos
2. Ataca un nodo enemigo desde múltiples direcciones
3. Sobrepasa su defensa fácilmente

Ventaja: Difícil de defender contra múltiples frentes
```

#### Defensa Activa

```
Táctica:
1. Envía energía hacia nodos amenazados
2. Intercepta paquetes enemigos en aristas
3. Neutraliza ataques con colisiones
```

#### Control del Centro

```
Ventaja del Centro:
├─ Más conexiones a otros nodos
├─ Mayor flexibilidad táctica
└─ Dominar el centro facilita la victoria

Estrategia:
1. Captura nodos centrales temprano
2. Fortifícalos con mucha energía
3. Irradia presión a todo el mapa
```

#### Identificación de Articulación

```
Ataque Estratégico:
1. Identifica puntos de articulación del oponente
2. Concéntrate en capturar esos nodos
3. Fragmenta su grafo y neutraliza secciones enteras

Defensa:
1. Refuerza tus puntos de articulación
2. Crea rutas alternativas
3. Evita dependencia de un solo nodo
```

---

## 9. Preguntas Frecuentes

### Sobre Mecánicas

**P: ¿Puedo enviar toda mi energía de un nodo?**  
R: Sí, pero no es recomendable. Dejar nodos vacíos los hace vulnerables a captura inmediata.

**P: ¿Qué pasa si envío energía a un nodo aliado lleno?**  
R: Si el nodo alcanza su capacidad máxima, la energía adicional se pierde (desbordamiento).

**P: ¿Puedo cancelar un paquete de energía en tránsito?**  
R: No, una vez enviado, el paquete continúa hasta su destino o hasta colisionar.

**P: ¿Los nodos generan energía automáticamente?**  
R: Solo los **Nodos Productivos** generan energía pasivamente. Los demás tipos no.

### Sobre Victoria

**P: ¿Qué pasa si ambos jugadores tienen 50% de nodos al final?**  
R: Es un **empate**. La partida termina sin ganador.

**P: ¿Puedo ganar después de perder mi nodo inicial?**  
R: No, perder tu nodo inicial es **derrota automática**.

**P: ¿Cómo sé cuánto tiempo llevo dominando?**  
R: El HUD muestra un temporizador de dominancia cuando controlas ≥70% de nodos.

### Sobre Controles

**P: ¿Puedo pausar la partida?**  
R: Depende de la implementación. En modo multijugador en tiempo real, no suele haber pausa.

**P: ¿Hay atajos de teclado?**  
R: Pueden existir atajos para acciones rápidas. Consulta la sección de configuración del juego.

---

## 10. Solución de Problemas

### Problemas Comunes

#### El juego no carga

**Síntomas:** Pantalla en blanco o mensaje de error

**Soluciones:**
1. **Verifica JavaScript:** Asegúrate de que JavaScript esté habilitado en tu navegador
2. **Actualiza el navegador:** Usa la versión más reciente
3. **Limpia caché:** Ctrl+Shift+Delete → Borrar caché
4. **Prueba otro navegador:** Chrome, Firefox, Edge

#### Lag o Rendimiento Bajo

**Síntomas:** Juego lento, frames saltados

**Soluciones:**
1. **Cierra pestañas innecesarias:** Libera memoria RAM
2. **Reduce resolución:** Si es posible en configuración
3. **Actualiza drivers gráficos:** Especialmente en Windows
4. **Verifica recursos:** Abre Task Manager para ver uso de CPU/RAM

#### Controles No Responden

**Síntomas:** Clicks no registran, nodos no seleccionan

**Soluciones:**
1. **Refresca la página:** F5 o Ctrl+R
2. **Verifica el cursor:** Asegúrate de estar dentro del área de juego
3. **Prueba modo incógnito:** Puede haber conflicto con extensiones

#### Energía Desaparece Sin Razón

**Explicación:** Probablemente no es un bug, puede ser:
- **Colisión:** Tus paquetes colisionaron con los del oponente
- **Desbordamiento:** Enviaste más energía de la capacidad del nodo
- **Fragmentación:** Perdiste un punto de articulación

**Verifica:** Observa advertencias en pantalla

---

### Contacto y Soporte

Si encuentras bugs o problemas técnicos:

1. **Revisa Issues en GitHub:** https://github.com/gustadev24/nexa/issues
2. **Reporta nuevos bugs:** Crea un nuevo issue con descripción detallada
3. **Incluye información:**
   - Navegador y versión
   - Sistema operativo
   - Pasos para reproducir el problema
   - Capturas de pantalla si es posible

---

## Anexos

### A. Tabla de Tipos de Nodos

| Tipo | Capacidad | Habilidad Especial |
|------|-----------|-------------------|
| **Básico** | 100 | Ninguna |
| **Ataque** | 100 | Genera energía ofensiva |
| **Defensa** | 100 | Genera energía defensiva |
| **Energía** | 200 | Mayor almacenamiento |
| **Productivo** | 100 | Genera energía pasiva |
| **Recolector** | 100 | Captura energía enemiga |

### B. Glosario de Términos

- **Grafo:** Red de nodos conectados por aristas
- **Nodo:** Punto del grafo que puede almacenar energía
- **Arista:** Conexión entre dos nodos
- **Paquete de Energía:** Unidad de energía en tránsito
- **Dominancia:** Porcentaje de nodos controlados
- **Punto de Articulación:** Nodo crítico cuya pérdida fragmenta el grafo
- **HUD:** Head-Up Display, interfaz de información

### C. Atajos Rápidos (Si Aplica)

| Atajo | Acción |
|-------|--------|
| `Click` | Seleccionar nodo |
| `Double Click` | Enviar máxima energía |
| `ESC` | Abrir menú de pausa |
| `Space` | Vista rápida de estadísticas |

---

## Créditos

**Desarrollado por:** Equipo Nexa  
**Universidad:** Universidad Nacional de San Agustín  
**Curso:** Ingeniería de Software  
**Año:** 2025

**Equipo de Desarrollo:**
- Luis Gustavo Sequeiros Condori
- Ricardo Chambilla
- Paul Cari Lipe
- Jhon Aquino
- Raquel Quispe
- Rafael Chambilla

---

<div align="center">

**¡Disfruta jugando Nexa!** 🎮

**Versión del Manual:** 1.0.0  
**Fecha:** Diciembre 2025

</div>
