
export interface ActionResult<TValue = any> {
  // Compatible shape for ASP.NET Core ActionResult<T>
  result?: any;
  value?: TValue;
}

export interface IActionResult {}
