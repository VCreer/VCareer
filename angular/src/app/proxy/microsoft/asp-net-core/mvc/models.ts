
export interface ActionResult<TValue = any> {
  result?: ActionResult<TValue>;
  value?: TValue;
}

export interface IActionResult {
}
