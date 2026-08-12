/**
 * Cobre a tela inteira (header/footer do RootLayout incluídos) enquanto o chunk da rota carrega
 * — sem isso, um load inicial lento mostra navbar/footer/texto "escritos" antes da própria página
 * (com sua própria intro) montar. Só a cor de fundo; o status é anunciado só pra leitor de tela.
 */
export function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-background fixed inset-0 z-(--z-page-loader)"
    >
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
