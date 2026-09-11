# Créditos do modelo 3D

`head-mesh.json` é derivado de **"Infinite, 3D Head Scan" por Lee Perry-Smith**, licenciado sob
[Creative Commons Attribution 3.0 Unported](https://creativecommons.org/licenses/by/3.0/).
Original em [www.triplegangers.com](https://www.triplegangers.com), distribuído junto ao
[three.js](https://github.com/mrdoob/three.js/tree/master/examples/models/gltf/LeePerrySmith).

A licença permite uso comercial e obras derivadas, exigindo apenas a atribuição acima.

## O que foi feito com o original

O `.glb` original (9.279 vértices, 17.684 triângulos) foi processado offline para virar uma malha
leve o bastante pra rodar no navegador como wireframe:

1. Soldagem de vértices duplicados nas costuras de UV (`mergeVertices`) — sem isso a decimação não
   consegue colapsar através das costuras e sobram pontos empilhados no mesmo lugar.
2. Decimação por colapso de arestas (`SimplifyModifier` do three.js) até ~1.600 vértices.
3. Extração da lista de arestas únicas a partir dos triângulos.
4. Normalização: centrado na origem e escalado pra 2 unidades de altura.

O resultado (`nodes` + `edges`) é o que o `FaceGraphic.tsx` consome — nenhuma textura, nenhum
carregamento de `.glb` em runtime.
