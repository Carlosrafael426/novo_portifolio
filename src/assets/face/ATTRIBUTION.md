# Origem da imagem do rosto

`cabeça3d.png` foi gerada por IA a pedido do Carlos Rafael — não é material de banco de imagens,
não há licença de terceiros envolvida.

`head-3d.webp` é a mesma imagem reduzida para 900×1350 e recomprimida em WebP (1.511 KB → 181 KB).
É essa versão que o site carrega; o PNG original fica guardado só como fonte, caso seja preciso
gerar de novo.

## Como o desenho é montado

O `FaceGraphic.tsx` não exibe a imagem: ele a **lê**. A imagem é desenhada uma vez num canvas fora
de tela, os pixels são varridos, e cada pixel aceso vira uma partícula na mesma posição relativa
que ocupava na imagem. O brilho do pixel define a opacidade da partícula, e os mais brilhantes
(os nós da malha) viram pontos maiores que cintilam.

É por isso que o desenho sai idêntico à referência: a forma não é recriada, é amostrada dela.
E, por serem partículas de verdade, elas explodem para revelar a bio e voltam a se juntar —
coisa que uma imagem estática não faria.
