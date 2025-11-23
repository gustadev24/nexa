
Ficha Técnica del Proyecto: NEXA
Proyecto: NEXA
Curso: Tecnología de Objetos
Tipo de Software: Videojuego de Estrategia en Tiempo Real (RTS) sobre Grafos
Estado: Fase de Desarrollo e Implementación
Equipo de Desarrollo: Alexandra, Luis, Paul, Ricardo, Jhonatan.
1. Resumen Ejecutivo
NEXA es un videojuego de estrategia táctica desarrollado en Java, diseñado para simular conflictos territoriales sobre una estructura de datos de grafo abstracto. El proyecto tiene como objetivo principal la aplicación pura de la Programación Orientada a Objetos (POO), demostrando la capacidad del equipo para construir una arquitectura de software robusta y escalable sin la dependencia de motores gráficos comerciales (como Unity o Unreal) ni librerías externas de gestión de lógica.
La esencia técnica de NEXA reside en su construcción "desde cero" (from scratch), lo que obliga a una implementación manual y estricta de Patrones de Diseño (GoF) para resolver problemas complejos de renderizado, gestión de estados, concurrencia y lógica de negocio.
2. Enfoque Tecnológico y Arquitectura
El desarrollo se rige por una arquitectura en capas (Dominio, Aplicación, Infraestructura, Presentación) y se destaca por la implementación nativa de soluciones de diseño:
Desarrollo sin Frameworks: Toda la gestión del ciclo de vida del juego (Game Loop), la física de colisiones y el renderizado gráfico se han programado manualmente utilizando las librerías estándar del lenguaje.
Patrones de Diseño Manuales: Se han codificado explícitamente patrones clásicos para orquestar la lógica del sistema, incluyendo:
Observer: Para el sistema de eventos y actualización de UI.
State: Para la máquina de estados finitos del juego y de los nodos.
Strategy: Para algoritmos intercambiables de resolución de conflictos.
Factory & Command: Para la creación dinámica de entidades y la gestión de acciones del usuario.
Singleton: Para la gestión centralizada de recursos únicos.
3. Descripción del Juego
NEXA sitúa al jugador en un campo de batalla representado por nodos (bases) y aristas (rutas de conexión). El objetivo es gestionar un flujo de energía, un recurso conservativo que debe distribuirse inteligentemente para atacar enemigos y defender posiciones propias.
Mecánicas Principales:
Gestión de Energía: La energía no se crea mágicamente; fluye. El jugador decide cuánta energía dejar en un nodo para defensa y cuánta enviar a través de las aristas para conquistar nuevos territorios.
Control Territorial: El juego se gana dominando el mapa. La captura se produce cuando la energía de ataque supera la defensa de un nodo rival.
Diversidad Estratégica: Existen nodos con propiedades únicas (Ataque, Defensa, Super Energía) que alteran el flujo de la partida y requieren estrategias adaptativas.
Resolución de Conflictos: Las batallas ocurren tanto en los nodos como en las aristas (choque de energías), resueltas mediante algoritmos matemáticos deterministas en tiempo real.
Condiciones de Victoria:
El juego fomenta la agresividad controlada y la expansión rápida mediante dos vías de victoria:
Dominancia: Mantener el control del 70% de los nodos durante 10 segundos continuos.
Conquista por Tiempo: Poseer la mayor cantidad de nodos al finalizar el límite de 3 minutos.
Eliminación: Capturar el nodo inicial del enemigo causa su derrota inmediata.


Documento de Especificación Lógica: NEXA
Fecha: Actualidad
Versión: 1.0 (Fase de Implementación)
Ámbito: Capa de Dominio y Aplicación
1. Principios Fundamentales
1.1 Tiempo y Ciclos de Ejecución (Game Loop)
El sistema opera bajo un modelo de tiempo discreto dividido en "Ticks". Existen dos frecuencias de actualización independientes que deben coordinarse:
Ciclo de Defensa (30 ms): Actualiza el estado interno de los nodos y consolida la energía estacionaria. Tiene prioridad de ejecución.
Ciclo de Ataque (20 ms): Gestiona el movimiento de los paquetes de energía en las aristas y calcula las llegadas a nodos destino.
Orden de Resolución por Tick:
Regeneración/Actualización de Defensa en Nodos.
Cálculo de posiciones de energía en aristas.
Resolución de colisiones en aristas.
Resolución de llegadas (impactos) en nodos y cambio de propiedad.
1.2 Principio de Conservación de Energía
La energía es un recurso finito y conservativo. No se crea ni se destruye espontáneamente durante la simulación básica.
Energía Total: Suma de la energía almacenada en nodos (Defensa) + energía viajando en aristas (Ataque).
Variación: La Energía Total de un jugador solo cambia al capturar o perder Nodos de Energía o Super Energía.
Transición: Al enviar un ataque, la energía se descuenta del nodo origen y se convierte en una entidad móvil; no se duplica (salvo por efecto de Nodo de Ataque).

2. Entidades y Comportamiento
2.1 Lógica del Grafo y Navegación
El mapa es un grafo ponderado no dirigido.
Peso de Arista: Representa tiempo de viaje, no distancia física. Una arista con mayor peso retiene el paquete de energía por más ciclos de actualización.
Conectividad: Si el grafo se fragmenta (por pérdida de un nodo de articulación), el jugador pierde control inmediato de cualquier sub-grafo que no esté conectado a su Nodo Inicial. Esos nodos pasan a ser Neutrales.
2.2 Lógica de los Nodos
Los nodos actúan como contenedores de defensa y emisores de ataques.
Capacidad: Infinita. No hay desbordamiento (overflow) de energía.
Nodo Básico: Comportamiento estándar de entrada/salida.
Nodo de Ataque: Aplica un multiplicador (x2) a cualquier paquete de energía que salga del nodo. El costo para el saldo del jugador es el original, pero el valor del paquete en la arista es el doble.
Nodo de Defensa: Aplica un multiplicador (x2) a la resistencia del nodo solo durante el cálculo de daño recibido. La energía almacenada real no cambia.
Nodo Neutral: Defensa igual a cero o valor residual. No regenera ni emite. Capturable por cualquiera.

3. Dinámica de Conflictos
3.1 Colisiones en Aristas (Intercepción)
Ocurre cuando dos paquetes de energía transitan la misma arista.
Enemigos (Sentidos Opuestos): Se comparan los valores. El paquete menor desaparece; al mayor se le resta el valor del menor y continúa su trayectoria. Si son iguales, ambos desaparecen.
Aliados (Sentidos Opuestos): Se considera un error estratégico ("Desperdicio"). Ambas energías se anulan mutuamente y se pierde ese recurso del total del jugador. Se debe emitir una notificación de advertencia.
Mismo Sentido: No hay colisión, viajan como paquetes independientes (cola).
3.2 Resolución de Ataques a Nodos
Ocurre cuando un paquete de energía completa su recorrido en una arista y entra al nodo.
Caso A: Llegada a Nodo Aliado
La energía entrante se suma directamente a la reserva de defensa del nodo.
Caso B: Llegada a Nodo Enemigo (Combate)
Se calcula la defensa efectiva del nodo (aplicando bonificadores si es Nodo de Defensa).
Si Ataque > Defensa: El nodo es capturado. La nueva defensa del nodo es igual a la diferencia (Ataque - Defensa). El nodo cambia de dueño al atacante.
Si Ataque < Defensa: El ataque se disipa. La defensa del nodo se reduce en una cantidad igual al valor del ataque.
Si Ataque == Defensa: El nodo queda con 0 energía y pasa a estado Neutral (sin dueño).

4. Estados de Victoria y Derrota
4.1 Condición de Dominancia (Timer)
El sistema debe verificar en cada ciclo el porcentaje de nodos controlados por cada jugador.
Si un jugador posee >= 70% de los nodos, inicia un temporizador de 10 segundos.
Si el porcentaje cae bajo el 70% durante la cuenta, el temporizador se reinicia.
Si el temporizador llega a 0, victoria inmediata.
4.2 Condición de Tiempo Límite
Al finalizar los 3 minutos de partida:
Se contabiliza la cantidad absoluta de nodos por jugador.
Gana el mayor. En empate de cantidad, se declara empate técnico.
4.3 Condición de Eliminación (Muerte Súbita)
El Nodo Inicial de cada jugador es crítico.
Si un jugador pierde el control de su Nodo Inicial (es capturado o neutralizado), es eliminado inmediatamente de la partida, independientemente de cuántos otros nodos posea. Todas sus unidades y nodos restantes pasan a ser Neutrales.


