import { describe, it, expect, beforeEach } from 'vitest';
import { CaptureService } from '@/application/services/capture-service';
import { Player } from '@/core/entities/player';
import { BasicNode } from '@/core/entities/node/basic';
import { Edge } from '@/core/entities/edge';
import { Graph } from '@/core/entities/graph';

describe('CaptureService', () => {
  let captureService: CaptureService;
  let p1: Player;
  let p2: Player;
  
  // Helper para crear grafos rápidos
  const createGraph = (nodes: any[], edges: any[]) => {
    return new Graph(new Set(nodes), new Set(edges));
  };

  beforeEach(() => {
    captureService = new CaptureService();
    p1 = new Player({ id: 'p1', username: 'Alice', color: { r: 255, g: 0, b: 0 } });
    p2 = new Player({ id: 'p2', username: 'Bob', color: { r: 0, g: 0, b: 255 } });
    p1.setInGame(true);
    p2.setInGame(true);
  });

  // --- TEST BÁSICOS ---

  it('captureNode: debe capturar un nodo neutral correctamente', () => {
    const node = new BasicNode('n1');
    const result = captureService.captureNode(node, p1, null);

    expect(result.captured).toBe(true);
    expect(node.owner).toBe(p1);
    expect(p1.ownsNode(node)).toBe(true);
    expect(p1.totalEnergy).toBeGreaterThan(0); // Verifica bono de energía
  });

  it('captureNode: debe capturar un nodo enemigo', () => {
    const node = new BasicNode('n1');
    // Setup inicial: P2 es dueño
    p2.captureNode(node);
    node.setOwner(p2);

    const result = captureService.captureNode(node, p1, p2);

    expect(result.captured).toBe(true);
    expect(node.owner).toBe(p1);
    expect(p2.ownsNode(node)).toBe(false); // P2 lo perdió
  });

  it('captureNode: debe eliminar jugador si pierde nodo inicial', () => {
    const node = new BasicNode('base');
    p2.setInitialNode(node);
    p2.captureNode(node);
    node.setOwner(p2);

    const result = captureService.captureNode(node, p1, p2);

    expect(result.playerEliminated).toBe(true);
    expect(p2.isEliminated).toBe(true);
  });

  it('neutralizeNode: debe dejar el nodo sin dueño', () => {
    const node = new BasicNode('n1');
    p1.captureNode(node);
    node.setOwner(p1);

    captureService.neutralizeNode(node, p1);

    expect(node.owner).toBeNull();
    expect(p1.ownsNode(node)).toBe(false);
  });

  // --- TEST AVANZADOS (ARTICULACIÓN Y CASCADA) ---

  it('handleArticulationCapture: debe desconectar nodos en cadena', () => {
    // Grafo: P1_Base(A) -- B -- C
    // Si P1 pierde B, entonces C queda aislado.
    const nodeA = new BasicNode('A');
    const nodeB = new BasicNode('B');
    const nodeC = new BasicNode('C');

    const edge1 = new Edge('e1', [nodeA, nodeB], 10);
    const edge2 = new Edge('e2', [nodeB, nodeC], 10);
    
    // Conectar nodos
    nodeA.addEdge(edge1);
    nodeB.addEdge(edge1);
    nodeB.addEdge(edge2);
    nodeC.addEdge(edge2);

    // Asignar todo a P1
    p1.setInitialNode(nodeA);
    [nodeA, nodeB, nodeC].forEach(n => {
      p1.captureNode(n);
      n.setOwner(p1);
    });

    const graph = createGraph([nodeA, nodeB, nodeC], [edge1, edge2]);

    // Simulamos que P1 pierde B (ahora es neutral o enemigo)
    p1.loseNode(nodeB);
    nodeB.setOwner(null); 

    // Ejecutar detección
    const lostNodes = captureService.handleArticulationCapture(nodeB, p1, graph);

    expect(lostNodes).toHaveLength(1);
    expect(lostNodes[0]).toBe(nodeC);
    expect(nodeC.owner).toBeNull(); // C debe ser neutralizado
  });

  it('captureNodeWithArticulationCheck: debe capturar y procesar cascada automáticamente', () => {
    // Escenario: P2 tiene Base(A) -- B -- C
    // P1 captura B.
    const nodeA = new BasicNode('A');
    const nodeB = new BasicNode('B');
    const nodeC = new BasicNode('C');
    const edge1 = new Edge('e1', [nodeA, nodeB], 10);
    const edge2 = new Edge('e2', [nodeB, nodeC], 10);
    
    nodeA.addEdge(edge1); nodeB.addEdge(edge1);
    nodeB.addEdge(edge2); nodeC.addEdge(edge2);

    p2.setInitialNode(nodeA);
    [nodeA, nodeB, nodeC].forEach(n => {
      p2.captureNode(n);
      n.setOwner(p2);
    });

    const graph = createGraph([nodeA, nodeB, nodeC], [edge1, edge2]);

    // P1 ataca a B
    const result = captureService.captureNodeWithArticulationCheck(nodeB, p1, p2, graph);

    expect(result.captured).toBe(true);
    expect(result.nodesLost).toContain(nodeC); // P2 perdió C por cascada
    expect(nodeB.owner).toBe(p1); // B es de P1
    expect(nodeC.owner).toBeNull(); // C es neutral
    expect(nodeA.owner).toBe(p2); // A sigue siendo de P2
  });

  // --- TEST BONUS (ANÁLISIS ESTRATÉGICO) ---

  it('isArticulationPoint: debe identificar nodos críticos', () => {
    // A(Base) -- B -- C
    // B es crítico. Si se va, C muere.
    const nodeA = new BasicNode('A');
    const nodeB = new BasicNode('B');
    const nodeC = new BasicNode('C');
    const edge1 = new Edge('e1', [nodeA, nodeB], 10);
    const edge2 = new Edge('e2', [nodeB, nodeC], 10);
    nodeA.addEdge(edge1); nodeB.addEdge(edge1); nodeB.addEdge(edge2); nodeC.addEdge(edge2);

    p1.setInitialNode(nodeA);
    [nodeA, nodeB, nodeC].forEach(n => { p1.captureNode(n); n.setOwner(p1); });

    const graph = createGraph([nodeA, nodeB, nodeC], [edge1, edge2]);

    expect(captureService.isArticulationPoint(nodeB, p1, graph)).toBe(true);
    expect(captureService.isArticulationPoint(nodeC, p1, graph)).toBe(false); // C es final, no corta nada
  });

  it('getNodesAtRisk: debe predecir qué nodos se perderán', () => {
    // A(Base) -- B -- C
    // Si pierdo B, pierdo C.
    const nodeA = new BasicNode('A');
    const nodeB = new BasicNode('B');
    const nodeC = new BasicNode('C');
    const edge1 = new Edge('e1', [nodeA, nodeB], 10);
    const edge2 = new Edge('e2', [nodeB, nodeC], 10);
    nodeA.addEdge(edge1); nodeB.addEdge(edge1); nodeB.addEdge(edge2); nodeC.addEdge(edge2);

    p1.setInitialNode(nodeA);
    [nodeA, nodeB, nodeC].forEach(n => { p1.captureNode(n); n.setOwner(p1); });
    
    const graph = createGraph([nodeA, nodeB, nodeC], [edge1, edge2]);

    const risks = captureService.getNodesAtRisk(nodeB, p1, graph);
    
    expect(risks).toHaveLength(1);
    expect(risks[0]).toBe(nodeC);
  });
});