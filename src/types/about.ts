/** Um trecho de texto — `strong` marca os pedaços que devem aparecer em destaque (bold). */
export interface TextSegment {
  text: string;
  strong?: boolean;
}

export type RichText = TextSegment[];

export interface AboutExpectation {
  title: string;
  description: string;
}

export interface AboutContent {
  /** Parágrafos principais, na ordem em que aparecem. */
  paragraphs: RichText[];
  /** Frase curta de transição, antes da declaração de crença. */
  transition: string;
  /** Declaração central, em destaque total. */
  belief: string;
  /** Parágrafo sobre como isso se traduz em prática (código limpo, manutenção etc). */
  practice: RichText;
  expectationsHeading: string;
  expectations: AboutExpectation[];
  /** Parágrafos finais (chamada pra ação + frase de fechamento). */
  closing: RichText[];
}
