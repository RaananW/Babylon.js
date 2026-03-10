import { SpriteManager, SpriteManagerParse, SpriteManagerParseFromFileAsync, SpriteManagerParseFromSnippetAsync } from "./spriteManager.pure";

declare module "./spriteManager.pure" {
    namespace SpriteManager {
        export { SpriteManagerParse as Parse };
        export { SpriteManagerParseFromFileAsync as ParseFromFileAsync };
        export { SpriteManagerParseFromSnippetAsync as ParseFromSnippetAsync };
    }
}

SpriteManager.Parse = SpriteManagerParse;
SpriteManager.ParseFromFileAsync = SpriteManagerParseFromFileAsync;
SpriteManager.ParseFromSnippetAsync = SpriteManagerParseFromSnippetAsync;

export * from "./spriteManager.pure";
