
export interface ActionResultBase {
}

export interface ActionResult<TValue = any> extends ActionResultBase {
  result?: ActionResultBase;
  value?: TValue;
}

export interface IActionResult {
}
