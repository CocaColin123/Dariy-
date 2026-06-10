declare module 'pagedjs' {
  export class Previewer {
    constructor();
    preview(
      content: string,
      stylesheets: string[],
      target: HTMLElement,
    ): Promise<any>;
    destroy(): void;
  }
}
