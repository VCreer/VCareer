
export interface ProvinceDto {
  code?: number;
  name?: string;
  wards: WardDto[];
}

export interface WardDto {
  code?: number;
  name?: string;
  division_type?: string;
}
