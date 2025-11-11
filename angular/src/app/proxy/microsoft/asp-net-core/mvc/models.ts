export interface ActionResult<TValue = any> {
  result?: ActionResult<any>;
  value?: TValue;
}
