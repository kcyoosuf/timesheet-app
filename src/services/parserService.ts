import { ParsedWorkItem } from '../models/types';
import { parseWorkUpdate } from '../parser/workUpdateParser';

export interface IDescriptionService {
  improveDescription(description: string): Promise<string>;
}

/**
 * No-op description service for V1 (Zero LLM / deterministic local)
 */
export class NoopDescriptionService implements IDescriptionService {
  async improveDescription(description: string): Promise<string> {
    return description;
  }
}

export class ParserService {
  private descriptionService: IDescriptionService;

  constructor(descriptionService: IDescriptionService = new NoopDescriptionService()) {
    this.descriptionService = descriptionService;
  }

  /**
   * Deterministically parses raw daily update text into structured work items
   */
  parse(rawText: string): ParsedWorkItem[] {
    return parseWorkUpdate(rawText);
  }

  /**
   * Optional helper for future AI improvement hook
   */
  async enhanceDescription(text: string): Promise<string> {
    return this.descriptionService.improveDescription(text);
  }
}

export const parserService = new ParserService();
