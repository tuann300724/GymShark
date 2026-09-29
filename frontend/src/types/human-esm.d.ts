/**
 * Declaraction cho bundle browser của @vladmandic/human.
 *
 * Import subpath `@vladmandic/human/dist/human.esm.js` thay vì package gốc:
 * gói `exports` của package ưu tiên condition `node` khi Next build bản server
 * (→ human.node.js → require('@tensorflow/tfjs-node') không cài → build fail).
 * Bản ESM này là bản browser chính thức (tự chứa TFJS), chỉ được load động
 * phía trình duyệt — server không bao giờ evaluate nó.
 */
declare module '@vladmandic/human/dist/human.esm.js' {
  export * from '@vladmandic/human';
  export { default } from '@vladmandic/human';
}
