declare module "papaparse" {
  export interface ParseConfig {
    header?: boolean;
    dynamicTyping?: boolean;
    skipEmptyLines?: boolean | "greedy";
    delimiter?: string;
    complete?: (results: ParseResult<any>) => void;
    error?: (error: any) => void;
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    fields?: string[];
    truncated: boolean;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export function parse<T = any>(file: File | string, config?: ParseConfig): ParseResult<T>;
  export function unparse(data: any[] | object, config?: any): string;
}
