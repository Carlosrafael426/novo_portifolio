export interface TimelineEntry {
  id: string;
  period: string;
  title: string;
  description: string;
  technologies?: string[];
  /** Marco importante — destacar visualmente. */
  highlight?: boolean;
}
