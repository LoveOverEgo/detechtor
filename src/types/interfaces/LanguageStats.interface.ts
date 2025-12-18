export interface LanguageStats {
    [language: string]: {
        files: number;
        lines: number;
        bytes: number;
        extensions: Set<string>;
        primaryExtension?: string;
    };
}