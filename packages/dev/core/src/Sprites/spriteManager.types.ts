export {};

declare module "./spriteManager.pure" {
    namespace SpriteManager {
        export { SpriteManagerParse as Parse };
        export { SpriteManagerParseFromFileAsync as ParseFromFileAsync };
        export { SpriteManagerParseFromSnippetAsync as ParseFromSnippetAsync };
    }
}
