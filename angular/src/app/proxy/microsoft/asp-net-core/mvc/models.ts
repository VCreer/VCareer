
export interface ActionResult {
}

export interface ActionResult<TValue=any> {
  result: ActionResult;
  value: TValue;
}

export interface IActionResult {
}
