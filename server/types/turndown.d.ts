declare module 'turndown' {
  interface TurndownOptions {
    headingStyle?: 'setext' | 'atx';
    hr?: string;
    bulletListMarker?: '-' | '+' | '*';
    codeBlockStyle?: 'indented' | 'fenced';
    fence?: '`' | '~';
    emDelimiter?: '_' | '*';
    strongDelimiter?: '__' | '**';
    linkStyle?: 'inlined' | 'referenced';
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
    preformattedCode?: boolean;
  }

  interface TurndownService {
    turndown(html: string): string;
    use(plugin: (service: TurndownService) => void): TurndownService;
    addRule(key: string, rule: object): TurndownService;
    keep(filter: string | string[] | ((node: HTMLElement) => boolean)): TurndownService;
    remove(filter: string | string[] | ((node: HTMLElement) => boolean)): TurndownService;
    escape(str: string): string;
  }

  class TurndownService {
    constructor(options?: TurndownOptions);
  }

  export default TurndownService;
}