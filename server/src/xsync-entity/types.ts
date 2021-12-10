export interface IWSSOptions {
  certPath?: string
  keyPath?: string
  domainName?: string
  port?: number
  /**
   * default is true
   */
  localhost?: boolean
  /**
   * default is !localhost
   */
  useWss?: boolean
}