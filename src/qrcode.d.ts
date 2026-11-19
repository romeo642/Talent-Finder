declare module "qrcode" {
  export function toDataURL(text: string, options?: object): Promise<string>;
  const qrcode: { toDataURL: typeof toDataURL };
  export default qrcode;
}
